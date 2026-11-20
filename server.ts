import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import nodemailer from 'nodemailer';
import { DB } from './src/backend/db';
import { Room, Customer, Booking, FoodItem, FoodOrder, Bill, User, HousekeepingTask, Complaint, EmergencyAlert, VisitorRequest, LostItemReport, Feedback, EmployeeAttendance, InventoryItem, Employee, AppNotification, MaintenanceRequest, EmailLog } from './src/types';

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a cryptographically random secret of at least 32 characters.');
}

const app = express();
app.use(express.json());

// Auth Middleware
interface CustomRequest extends express.Request {
  user?: { id: string; username: string; role: 'admin' | 'customer'; customerId?: string; employeeRole?: string };
}

const authenticateJWT = (req: CustomRequest, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

const requireRole = (role: 'admin' | 'customer') => {
  return (req: CustomRequest, res: express.Response, next: express.NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: `Forbidden: Requires ${role} role` });
      return;
    }
    next();
  };
};

const requireEmployeePermission = (action: 'view_reports' | 'manage_rooms' | 'manage_employees' | 'view_revenue' | 'manage_customers' | 'manage_bookings' | 'check_in_out' | 'manage_food_orders' | 'update_order_status' | 'update_cleaning_status' | 'view_assigned_rooms') => {
  return (req: CustomRequest, res: express.Response, next: express.NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }
    const { role, employeeRole } = req.user;
    if (role === 'customer') {
      res.status(403).json({ error: 'Forbidden: Customers cannot access staff utilities' });
      return;
    }
    // Super Admins/Admins default to everything
    if (!employeeRole || employeeRole === 'Super Admin') {
      return next();
    }
    
    // Map staff roles to exact valid permissions
    const permissionsMap: Record<string, string[]> = {
      'Manager': ['view_reports', 'manage_rooms', 'manage_employees', 'view_revenue', 'update_cleaning_status'],
      'Receptionist': ['manage_customers', 'manage_bookings', 'check_in_out', 'update_cleaning_status'],
      'Chef': ['manage_food_orders', 'update_order_status'],
      'Housekeeping Staff': ['update_cleaning_status', 'view_assigned_rooms']
    };
    
    const permissions = permissionsMap[employeeRole] || [];
    if (permissions.includes(action)) {
      return next();
    }
    
    res.status(403).json({ error: `Forbidden: Staff Role (${employeeRole}) lacks permission for this action.` });
  };
};

// ==========================================
// REAL-TIME WEBSOCKET & SMTP EMAIL REGISTRIES
// ==========================================

const activeWsClients = new Set<WebSocket>();

const broadcastNotification = (notification: AppNotification) => {
  const payload = JSON.stringify({ type: 'NOTIFICATION_RECEIVED', data: notification });
  activeWsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  });
};

let transporter: any = null;
const getTransporter = async () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      console.log('Nodemailer SMTP Transporter initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize SMTP transporter, falling back to JSON transport:', err);
      transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
};

const createNotificationAndEmailLog = async (params: {
  recipientId: string | 'all_admins' | 'all';
  title: string;
  message: string;
  type: any;
  category: 'admin' | 'customer';
  emailTo?: string;
  emailSubject?: string;
  emailDetails?: string;
}) => {
  try {
    const notifications = await DB.getNotifications();
    const newNotif: AppNotification = {
      id: 'n_' + Date.now() + Math.random().toString(36).substring(2, 6),
      recipientId: params.recipientId,
      title: params.title,
      message: params.message,
      type: params.type,
      category: params.category,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    await DB.saveNotifications(notifications);

    // Instant Real-Time WebSocket broadcast
    broadcastNotification(newNotif);

    if (params.emailTo && params.emailSubject && params.emailDetails) {
      const emailLogs = await DB.getEmailLogs();
      const htmlBody = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background-color: #0f172a; padding: 32px 24px; text-align: center; border-bottom: 4px solid #d97706;">
            <p style="color: #fbbf24; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 8px 0; font-family: monospace;">Amber Royale Resort</p>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">AUTOMATED ENTERPRISE NOTIFICATION</h1>
          </div>
          
          <!-- Content Frame -->
          <div style="padding: 32px 24px; line-height: 1.6; color: #334155;">
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">${params.emailSubject}</h2>
            <p style="font-size: 14px; margin-bottom: 24px;">This is an official automated transmission from the Amber Royale Enterprise Management engine.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
              <p style="font-size: 14px; margin: 0; font-weight: 600; color: #1e293b; white-space: pre-line;">${params.emailDetails}</p>
            </div>
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Transaction category: <strong style="color: #334155;">${params.type.split('_').join(' ')}</strong></p>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Timestamp: <strong style="color: #334155;">${new Date().toLocaleString()}</strong></p>
          </div>
          
          <!-- Footer standard -->
          <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">&copy; 2026 Amber Royale Resort & Spa, New Delhi, India.</p>
            <p style="font-size: 10px; color: #94a3b8; margin: 0;">This email was automatically generated. Please do not reply directly.</p>
          </div>
        </div>
      `;
      
      let emailStatus: 'Success' | 'Failed' = 'Success';
      try {
        const mailer = await getTransporter();
        const mailOptions = {
          from: process.env.SMTP_FROM || '"Amber Royale Resort" <noreply@amberroyale.com>',
          to: params.emailTo,
          subject: params.emailSubject,
          html: htmlBody
        };
        await mailer.sendMail(mailOptions);
        console.log(`Nodemailer sent email notification to: ${params.emailTo}`);
      } catch (err) {
        console.error(`Nodemailer delivery failed for ${params.emailTo}:`, err);
        emailStatus = 'Failed';
      }

      const newEmailLog: EmailLog = {
        id: 'em_' + Date.now() + Math.random().toString(36).substring(2, 6),
        toEmail: params.emailTo,
        subject: params.emailSubject,
        body: htmlBody,
        status: emailStatus,
        type: params.type,
        sentAt: new Date().toISOString()
      };
      emailLogs.unshift(newEmailLog);
      await DB.saveEmailLogs(emailLogs);
    }
  } catch (err) {
    console.error('Trigger notification error:', err);
  }
};

const generateInvoiceNumber = async (): Promise<string> => {
  const bills = await DB.getBills();
  const index = bills.length + 1;
  return `INV-2026-${String(index).padStart(4, '0')}`;
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.get('/api/auth/firebase-config', (req: express.Request, res: express.Response) => {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let config = null;
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error('Error reading firebase-applet-config.json:', e);
    }
  }
  
  if (config) {
    res.json({
      isEnabled: true,
      config: {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      }
    });
  } else if (process.env.VITE_FIREBASE_API_KEY) {
    res.json({
      isEnabled: true,
      config: {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
      }
    });
  } else {
    res.json({ isEnabled: false });
  }
});

app.post('/api/auth/login', async (req: express.Request, res: express.Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const db = await DB.get();
    const users = db.users as any[];
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      customerId: user.customerId,
      employeeRole: user.employeeRole
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        customerId: user.customerId,
        employeeRole: user.employeeRole
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error occurred on login' });
  }
});

app.post('/api/auth/register', async (req: express.Request, res: express.Response): Promise<void> => {
  const { name, phone, email, address, username, password } = req.body;
  if (!name || !phone || !email || !username || !password) {
    res.status(400).json({ error: 'Full Name, Phone, Email, Username, and Password are required' });
    return;
  }

  try {
    const db = await DB.get();
    const customers = db.customers;
    const users = db.users as any[];

    if (customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'A guest profile with this email already exists' });
      return;
    }

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    const newCustomerId = 'c_' + Date.now();
    const newCustomer: Customer = {
      id: newCustomerId,
      name,
      phone,
      email,
      address: address || ''
    };

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUserId = 'u_' + Date.now();
    const newUser = {
      id: newUserId,
      username,
      passwordHash,
      role: 'customer' as const,
      customerId: newCustomerId
    };

    db.customers.push(newCustomer);
    db.users.push(newUser);

    await DB.saveCustomers(db.customers);
    await DB.saveUsers(db.users);

    // Trigger enterprise double events
    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'New Customer Registered',
      message: `New guest profile created for ${name} (${username}). Contact: ${phone}`,
      type: 'New_Guest',
      category: 'admin'
    });

    await createNotificationAndEmailLog({
      recipientId: newCustomerId,
      title: 'Welcome to Amber Royale Club',
      message: `Dear ${name}, thank you for registering! 500 Welcome reward points have been credited to your club wallet.`,
      type: 'Reward_Points_Added',
      category: 'customer',
      emailTo: email,
      emailSubject: 'Welcome to Amber Royale Resort & Loyalty Club',
      emailDetails: `Hi ${name},\n\nWe are absolutely delighted to welcome you to Amber Royale.\n\nYour loyalty club registration was successful, and we have credited 500 bonus welcome points to your profile! You can use these to order complimentary gourmet room service or get upgrades.\n\nWe look forward to hosting you soon.`
    });

    const payload = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      customerId: newUser.customerId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        customerId: newUser.customerId
      }
    });
  } catch (err) {
    console.error('Error on registration endpoint:', err);
    res.status(500).json({ error: 'Internal server error occurred on registration' });
  }
});

app.post('/api/auth/forgot-password', async (req: express.Request, res: express.Response): Promise<void> => {
  const { username, email, newPassword } = req.body;
  if (!username || !email || !newPassword) {
    res.status(400).json({ error: 'Username, associated email, and new password are required' });
    return;
  }

  try {
    const db = await DB.get();
    const users = db.users as any[];
    const customers = db.customers;

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    let associatedEmail = '';
    if (user.role === 'admin') {
      associatedEmail = 'admin@amberroyale.com';
    } else if (user.customerId) {
      const customer = customers.find(c => c.id === user.customerId);
      if (customer) {
        associatedEmail = customer.email;
      }
    }

    if (!associatedEmail || associatedEmail.toLowerCase() !== email.toLowerCase()) {
      res.status(400).json({ error: 'Verification failed. This email does not match the account.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = passwordHash;

    await DB.saveUsers(users);

    res.json({ success: true, message: 'Password reset accomplished! You can now log into your suite portal.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error occurred during password reset' });
  }
});

app.post('/api/auth/google', async (req: express.Request, res: express.Response): Promise<void> => {
  const { email, name, uid } = req.body;
  if (!email || !uid) {
    res.status(400).json({ error: 'Google email and account credentials are required' });
    return;
  }

  try {
    const db = await DB.get();
    const users = db.users as any[];
    const customers = db.customers;

    let customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    let user = users.find(u => u.customerId && u.customerId === customer?.id);

    if (!customer) {
      const newCustomerId = 'c_' + Date.now();
      customer = {
        id: newCustomerId,
        name: name || email.split('@')[0],
        phone: '+1 555-0100',
        email: email,
        address: 'Google Authenticated Portal'
      };
      customers.push(customer);
      await DB.saveCustomers(customers);

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('google_' + uid, salt);
      user = {
        id: 'u_' + Date.now(),
        username: email.split('@')[0] + '_' + uid.slice(-4),
        passwordHash,
        role: 'customer',
        customerId: newCustomerId
      };
      users.push(user);
      await DB.saveUsers(users);
    } else if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('google_' + uid, salt);
      user = {
        id: 'u_' + Date.now(),
        username: email.split('@')[0],
        passwordHash,
        role: 'customer',
        customerId: customer.id
      };
      users.push(user);
      await DB.saveUsers(users);
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      customerId: user.customerId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        customerId: user.customerId
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error occurred on Google Sign-In backend operations' });
  }
});

// ==========================================
// DASHBOARD & REPORTS ENDPOINTS
// ==========================================

app.get('/api/dashboard/stats', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const rooms = await DB.getRooms();
    const customers = await DB.getCustomers();
    const bookings = await DB.getBookings();
    const bills = await DB.getBills();
    const foodOrders = await DB.getFoodOrders();
    const visitorRequests = await DB.getVisitorRequests();
    const lostItemReports = await DB.getLostItemReports();
    const feedbacks = await DB.getFeedbacks();
    const reviews = await DB.getReviews();
    const attendance = await DB.getEmployeeAttendance();
    const stockItems = await DB.getInventoryItems();

    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const totalCustomers = customers.length;
    
    // Active bookings
    const activeBookings = bookings.filter(b => b.status === 'Checked-In' || b.status === 'Booked');
    const totalBookings = bookings.length;

    // Sum grandfather revenue (from paid bills)
    const totalRevenue = bills
      .filter(b => b.status === 'Paid')
      .reduce((sum, b) => sum + b.grandTotal, 0);

    // Food orders placed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const foodOrdersToday = foodOrders.filter(o => {
      const orderTime = new Date(o.orderDate);
      return orderTime >= startOfToday && o.status !== 'Cancelled';
    }).length;

    // Custom stats additions
    const visitorPendingCount = visitorRequests.filter(v => v.status === 'Pending').length;
    const lostItemsCount = lostItemReports.filter(l => l.status === 'Reported').length;

    let totalRatingSum = 0;
    let ratingCount = 0;
    reviews.forEach(r => { 
      totalRatingSum += r.rating; 
      ratingCount++; 
    });
    feedbacks.forEach(f => {
      totalRatingSum += (f.roomRating + f.foodRating + f.staffRating) / 3;
      ratingCount++;
    });
    const averageRating = ratingCount > 0 ? parseFloat((totalRatingSum / ratingCount).toFixed(2)) : 4.75;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === todayStr);
    const attendancePresentCount = todayAttendance.filter(a => a.status === 'Present').length;
    const attendanceTotalCount = todayAttendance.length;

    const lowStockAlertsCount = stockItems.filter(item => item.quantity <= item.lowStockThreshold).length;

    res.json({
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalCustomers,
      totalBookings,
      totalRevenue,
      foodOrdersToday,
      activeBookingsCount: activeBookings.length,
      // Custom modules stats
      visitorPendingCount,
      lostItemsCount,
      averageRating,
      attendancePresentCount,
      attendanceTotalCount,
      lowStockAlertsCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/dashboard/reports', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const bookings = await DB.getBookings();
    const bills = await DB.getBills();
    const rooms = await DB.getRooms();
    const foodOrders = await DB.getFoodOrders();
    const customers = await DB.getCustomers();

    // 1. Daily revenue (last 10 days)
    // Compute date maps
    const dailyMap: { [key: string]: number } = {};
    bills.forEach(bill => {
      if (bill.status === 'Paid') {
        const dateStr = new Date(bill.invoiceDate).toISOString().split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + bill.grandTotal;
      }
    });
    // Fill up empty days or display actual days in ascending order
    const dailyRevenue = Object.keys(dailyMap)
      .sort()
      .map(date => ({ date, amount: parseFloat(dailyMap[date].toFixed(2)) }))
      .slice(-10);

    // 2. Monthly Revenue
    const monthlyMap: { [key: string]: number } = {};
    bills.forEach(bill => {
      if (bill.status === 'Paid') {
        const monthStr = new Date(bill.invoiceDate).toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + bill.grandTotal;
      }
    });
    const monthlyRevenue = Object.keys(monthlyMap).map(month => ({
      month,
      amount: parseFloat(monthlyMap[month].toFixed(2))
    }));

    // 3. Room Occupancy
    const occupantCount = rooms.filter(r => r.status === 'Occupied').length;
    const availableCount = rooms.filter(r => r.status === 'Available').length;
    const roomOccupancy = [
      { status: 'Occupied', count: occupantCount },
      { status: 'Available', count: availableCount }
    ];

    // 4. Food Sales by item
    const foodSalesMap: { [key: string]: { count: number; total: number } } = {};
    foodOrders.forEach(order => {
      if (order.status === 'Served') {
        order.items.forEach(it => {
          if (!foodSalesMap[it.foodName]) {
            foodSalesMap[it.foodName] = { count: 0, total: 0 };
          }
          foodSalesMap[it.foodName].count += it.quantity;
          foodSalesMap[it.foodName].total += it.price * it.quantity;
        });
      }
    });
    const foodSales = Object.keys(foodSalesMap).map(item => ({
      item,
      count: foodSalesMap[item].count,
      total: parseFloat(foodSalesMap[item].total.toFixed(2))
    })).sort((a, b) => b.total - a.total);

    // 5. Customer Booking Leaderboard
    const customerBookingsMap: { [key: string]: { bookings: number; revenue: number } } = {};
    bookings.forEach(b => {
      const cust = customers.find(c => c.id === b.customerId);
      const name = cust ? cust.name : 'Unknown Guest';
      if (!customerBookingsMap[name]) {
        customerBookingsMap[name] = { bookings: 0, revenue: 0 };
      }
      customerBookingsMap[name].bookings += 1;
      if (b.status === 'Checked-Out') {
        customerBookingsMap[name].revenue += b.totalAmount;
      }
    });
    const customerBookings = Object.keys(customerBookingsMap).map(name => ({
      name,
      bookings: customerBookingsMap[name].bookings,
      revenue: parseFloat(customerBookingsMap[name].revenue.toFixed(2))
    })).sort((a,b) => b.bookings - a.bookings).slice(0, 5);

    res.json({
      dailyRevenue,
      monthlyRevenue,
      roomOccupancy,
      foodSales,
      customerBookings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate financial reports data' });
  }
});

// ==========================================
// ROOM MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/rooms', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const rooms = await DB.getRooms();
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    const type = req.query.type ? String(req.query.type) : '';
    const status = req.query.status ? String(req.query.status) : '';

    let filtered = rooms;
    if (search) {
      filtered = filtered.filter(r => r.roomNumber.toLowerCase().includes(search));
    }
    if (type) {
      filtered = filtered.filter(r => r.roomType === type);
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve rooms' });
  }
});

app.post('/api/rooms', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { roomNumber, roomType, pricePerNight, capacity, status, imageUrl } = req.body;
  if (!roomNumber || !roomType || !pricePerNight || !capacity) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  try {
    const rooms = await DB.getRooms();
    // Unique room check
    if (rooms.some(r => r.roomNumber === roomNumber)) {
      res.status(400).json({ error: `Room ${roomNumber} already exists` });
      return;
    }

    const defaultImages: Record<string, string> = {
      Standard: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      Deluxe: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      Suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    };
    const finalImageUrl = imageUrl || defaultImages[roomType] || defaultImages.Standard;

    const newRoom: Room = {
      id: 'r_rec_' + Date.now(),
      roomNumber,
      roomType,
      pricePerNight: Number(pricePerNight),
      capacity: Number(capacity),
      status: status || 'Available',
      imageUrl: finalImageUrl
    };

    rooms.push(newRoom);
    await DB.saveRooms(rooms);
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add room' });
  }
});

app.put('/api/rooms/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { roomNumber, roomType, pricePerNight, capacity, status, imageUrl } = req.body;

  try {
    const rooms = await DB.getRooms();
    const idx = rooms.findIndex(r => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Room record not found' });
      return;
    }

    // Verify roomNumber unique constraint but ignore current room
    if (rooms.some((r, i) => r.roomNumber === roomNumber && i !== idx)) {
      res.status(400).json({ error: `Room ${roomNumber} already exists in records` });
      return;
    }

    rooms[idx] = {
      ...rooms[idx],
      roomNumber: roomNumber || rooms[idx].roomNumber,
      roomType: roomType || rooms[idx].roomType,
      pricePerNight: pricePerNight !== undefined ? Number(pricePerNight) : rooms[idx].pricePerNight,
      capacity: capacity !== undefined ? Number(capacity) : rooms[idx].capacity,
      status: status || rooms[idx].status,
      imageUrl: imageUrl !== undefined ? imageUrl : rooms[idx].imageUrl
    };

    await DB.saveRooms(rooms);
    res.json(rooms[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room records' });
  }
});

app.delete('/api/rooms/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const rooms = await DB.getRooms();
    const room = rooms.find(r => r.id === id);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.status === 'Occupied') {
      res.status(400).json({ error: 'Cannot delete an occupied room! Guests are currently checked-in.' });
      return;
    }

    const updatedRooms = rooms.filter(r => r.id !== id);
    await DB.saveRooms(updatedRooms);
    res.json({ success: true, message: 'Room successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// ==========================================
// CUSTOMER MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/customers', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const customers = await DB.getCustomers();
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';

    let products = customers;
    if (search) {
      products = products.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search)
      );
    }
    // Customer constraints (role-based)
    if (req.user?.role === 'customer' && req.user.customerId) {
      products = products.filter(c => c.id === req.user?.customerId);
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer profiles' });
  }
});

app.post('/api/customers', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { name, phone, email, address, username, password } = req.body;
  if (!name || !phone || !email) {
    res.status(400).json({ error: 'Name, phone, and email are required' });
    return;
  }

  try {
    const customers = await DB.getCustomers();
    const db = await DB.get();

    // Check duplicate email
    if (customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'A customer with this email already exists' });
      return;
    }

    const newCustomerId = 'c_' + Date.now();
    const newCustomer: Customer = {
      id: newCustomerId,
      name,
      phone,
      email,
      address: address || ''
    };

    customers.push(newCustomer);
    await DB.saveCustomers(customers);

    // Also automatically provision a user account for them!
    const clientUsername = username || email.split('@')[0];
    const clientPass = password || 'customer123';
    
    const users = db.users as any[];
    if (!users.some(u => u.username.toLowerCase() === clientUsername.toLowerCase())) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(clientPass, salt);
      users.push({
        id: 'u_' + Date.now(),
        username: clientUsername,
        passwordHash,
        role: 'customer',
        customerId: newCustomerId
      });
      await DB.write();
    }

    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  // Security guard
  if (req.user?.role === 'customer' && req.user.customerId !== id) {
    res.status(403).json({ error: 'Unauthorized: Cannot edit another customer profile' });
    return;
  }

  try {
    const customers = await DB.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Email check
    if (email && customers.some((c, i) => c.email.toLowerCase() === email.toLowerCase() && i !== idx)) {
      res.status(400).json({ error: 'Email already taken by another guest' });
      return;
    }

    customers[idx] = {
      ...customers[idx],
      name: name || customers[idx].name,
      phone: phone || customers[idx].phone,
      email: email || customers[idx].email,
      address: address || customers[idx].address
    };

    await DB.saveCustomers(customers);
    res.json(customers[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer details' });
  }
});

app.delete('/api/customers/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const customers = await DB.getCustomers();
    const updated = customers.filter(c => c.id !== id);
    await DB.saveCustomers(updated);

    // Handle cascade: deactivate related bookings/user account
    const users = await DB.getUsers();
    const updatedUsers = users.filter((u: any) => u.customerId !== id);
    await DB.saveUsers(updatedUsers);

    res.json({ success: true, message: 'Customer profile deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ==========================================
// BOOKING MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/bookings', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const bookings = await DB.getBookings();
    const customers = await DB.getCustomers();
    
    let filteredBookings = bookings;
    if (req.user?.role === 'customer' && req.user.customerId) {
      filteredBookings = bookings.filter(b => b.customerId === req.user?.customerId);
    }

    // Attach customer names
    const enriched = filteredBookings.map(b => {
      const cust = customers.find(c => c.id === b.customerId);
      return {
        ...b,
        customerName: cust ? cust.name : 'Unknown Guest',
        customerEmail: cust ? cust.email : ''
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings list' });
  }
});

app.post('/api/bookings', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { customerId, roomNumber, checkInDate, checkOutDate, customDays, partnerName, partnerIdProof } = req.body;
  
  const guestId = req.user?.role === 'customer' ? req.user.customerId! : customerId;

  if (!guestId || !roomNumber || !checkInDate || !checkOutDate) {
    res.status(400).json({ error: 'Missing mandatory booking fields' });
    return;
  }

  try {
    const rooms = await DB.getRooms();
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (!room) {
      res.status(404).json({ error: 'Room number not found' });
      return;
    }

    if (room.status === 'Occupied') {
      res.status(400).json({ error: `Room ${roomNumber} is currently occupied and unavailable.` });
      return;
    }

    if (room.status === 'Maintenance') {
      res.status(400).json({ error: `Room ${roomNumber} is currently undergoing maintenance and cannot be booked.` });
      return;
    }

    // Check if there are active unresolved maintenance requests as fallback
    const maintList = await DB.getMaintenanceRequests();
    if (maintList.some(mr => mr.roomNumber === roomNumber && mr.status !== 'Completed')) {
      res.status(400).json({ error: `Room ${roomNumber} has an active unresolved maintenance request and is currently blocked.` });
      return;
    }

    // Validate date intervals
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      res.status(400).json({ error: 'Check-out date must be after check-in date' });
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Auto-calculate amount
    const totalAmount = numberOfDays * room.pricePerNight;

    const bookings = await DB.getBookings();
    const newBooking: Booking = {
      id: 'b_' + Date.now(),
      customerId: guestId,
      roomNumber,
      checkInDate,
      checkOutDate,
      numberOfDays,
      totalAmount,
      status: 'Booked', // Initial status
      createdAt: new Date().toISOString(),
      partnerName: partnerName || undefined,
      partnerIdProof: partnerIdProof || undefined
    };

    bookings.push(newBooking);
    await DB.saveBookings(bookings);

    // Fetch customer details for notifications
    const custs = await DB.getCustomers();
    const guestObj = custs.find(c => c.id === guestId);
    const guestEmail = guestObj?.email || '';
    const guestName = guestObj?.name || 'Valued Guest';

    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'New Stay Booking Received',
      message: `Suite Room ${roomNumber} has been reserved by ${guestName} for ${numberOfDays} nights. Total value: $${totalAmount}`,
      type: 'New_Booking',
      category: 'admin'
    });

    await createNotificationAndEmailLog({
      recipientId: guestId,
      title: 'Residency Stay Booked',
      message: `Your booking for Suite Room ${roomNumber} for ${numberOfDays} nights starting on ${checkInDate} is confirmed.`,
      type: 'Booking_Confirmed',
      category: 'customer',
      emailTo: guestEmail,
      emailSubject: 'Luxurious Residency Reservation Confirmed - Amber Royale',
      emailDetails: `Dear ${guestName},\n\nWe are pleased to confirm your upcoming luxury residency at Amber Royale.\n\nRoom Number: ${roomNumber}\nCheck-In Date: ${checkInDate}\nCheck-Out Date: ${checkOutDate}\nDuration: ${numberOfDays} Nights\nGrand Total: $${totalAmount}\n\nThank you for choosing Amber Royale Resort. We look forward to welcome you!`
    });

    // Reward points: 10 loyalty points per $1 booked
    const bookPts = Math.round(totalAmount * 10);
    if (bookPts > 0 && guestId) {
      await addLoyaltyPoints(guestId, bookPts, `Reserved Room ${roomNumber} for ${numberOfDays} Nights (Stay #${newBooking.id})`);
    }

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/api/bookings/:id/status', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // 'Checked-In' | 'Checked-Out' | 'Cancelled'

  if (!['Checked-In', 'Checked-Out', 'Cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid booking status target' });
    return;
  }

  try {
    const bookings = await DB.getBookings();
    const bkIdx = bookings.findIndex(b => b.id === id);
    if (bkIdx === -1) {
      res.status(404).json({ error: 'Booking booking not found' });
      return;
    }

    const booking = bookings[bkIdx];

    // Customer constraints
    if (req.user?.role === 'customer' && booking.customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Unauthorized status operation' });
      return;
    }

    // Status transition updates room status
    const rooms = await DB.getRooms();
    const roomIdx = rooms.findIndex(r => r.roomNumber === booking.roomNumber);

    if (status === 'Checked-In') {
      if (roomIdx !== -1) {
        rooms[roomIdx].status = 'Occupied';
      }
    } else if (status === 'Checked-Out' || status === 'Cancelled') {
      if (roomIdx !== -1) {
        // Change room back to Available upon checkout or cancellation
        rooms[roomIdx].status = 'Available';
      }

      // Generate invoice upon automatic Check-Out
      if (status === 'Checked-Out') {
        const foodOrders = await DB.getFoodOrders();
        
        // Sum served food orders for this customer (not billed yet)
        const guestOrders = foodOrders.filter(o => o.customerId === booking.customerId && o.status === 'Served');
        const foodChargesSum = guestOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        const roomCharges = booking.totalAmount;
        const subtotal = roomCharges + foodChargesSum;
        const gstAmount = parseFloat((subtotal * 0.18).toFixed(2));
        const grandTotal = parseFloat((subtotal + gstAmount).toFixed(2));

        const invoiceNo = await generateInvoiceNumber();

        const bills = await DB.getBills();
        const guestBill: Bill = {
          id: 'bill_' + booking.id,
          invoiceNumber: invoiceNo,
          invoiceDate: new Date().toISOString(),
          customerId: booking.customerId,
          bookingId: booking.id,
          roomCharges,
          foodCharges: foodChargesSum,
          gstAmount,
          grandTotal,
          status: 'Unpaid'
        };

        bills.push(guestBill);
        await DB.saveBills(bills);
      }
    }

    // Retrieve guest email & details for automated email logs
    const customersList = await DB.getCustomers();
    const guestObj = customersList.find(c => c.id === booking.customerId);
    const guestEmail = guestObj?.email || '';
    const guestName = guestObj?.name || 'Valued Guest';

    if (status === 'Cancelled') {
      await createNotificationAndEmailLog({
        recipientId: booking.customerId,
        title: 'Booking Cancelled',
        message: `Your booking for Room ${booking.roomNumber} has been cancelled successfully.`,
        type: 'Booking_Cancelled',
        category: 'customer',
        emailTo: guestEmail,
        emailSubject: 'Booking Cancellation Confirmed - Amber Royale',
        emailDetails: `Dear ${guestName},\n\nThis is to confirm that your booking for Room ${booking.roomNumber} from ${booking.checkInDate} has been cancelled.\n\nWe appreciate your communication and look forward to managing your reservations again in the future.`
      });
      
      await createNotificationAndEmailLog({
        recipientId: 'all_admins',
        title: 'Booking Cancelled Log',
        message: `Booking stay #${booking.id} for Room ${booking.roomNumber} has been cancelled by ${req.user!.username}.`,
        type: 'Booking_Cancelled',
        category: 'admin'
      });
    } else if (status === 'Checked-In') {
      await createNotificationAndEmailLog({
        recipientId: booking.customerId,
        title: 'Checked-In Successfully',
        message: `Welcome to Suite Room ${booking.roomNumber}! Your room is ready and assigned. Enjoy your stay.`,
        type: 'Room_Ready',
        category: 'customer',
        emailTo: guestEmail,
        emailSubject: 'Welcome Check-In Confirmed - Amber Royale',
        emailDetails: `Dear ${guestName},\n\nWelcome to Amber Royale Resort!\n\nYou have been successfully Checked-In to Room ${booking.roomNumber}.\n\nPlease let us know if you require any room service or helpdesk assistance during your luxurious stay.`
      });
    } else if (status === 'Checked-Out') {
      await createNotificationAndEmailLog({
        recipientId: booking.customerId,
        title: 'Checked-out & Invoice Generated',
        message: `Thank you for choosing Amber Royale! Your invoice for Room ${booking.roomNumber} has been generated.`,
        type: 'Room_Ready',
        category: 'customer',
        emailTo: guestEmail,
        emailSubject: 'Luxury Residency Check-Out Receipt',
        emailDetails: `Dear ${guestName},\n\nThank you for choosing to stay with us at Amber Royale Resort.\n\nYou have been checked out of Room ${booking.roomNumber} on ${new Date().toLocaleDateString()}.\n\nYour digital invoice of grand total is available on your portal. We hope to serve you again very soon!`
      });
    }

    bookings[bkIdx].status = status;
    await DB.saveBookings(bookings);
    await DB.saveRooms(rooms);

    res.json(bookings[bkIdx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

app.delete('/api/bookings/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const bookings = await DB.getBookings();
    const b = bookings.find(x => x.id === id);
    if (!b) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (b.status === 'Checked-In') {
      res.status(400).json({ error: 'Cannot delete booking of checked-in guests. Please check-out first.' });
      return;
    }

    const updated = bookings.filter(x => x.id !== id);
    await DB.saveBookings(updated);
    res.json({ success: true, message: 'Booking removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// ==========================================
// RESTAURANT MENU MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/food-items', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const items = await DB.getFoodItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurant menu' });
  }
});

app.post('/api/food-items', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { foodName, category, price, availability, imageUrl } = req.body;
  if (!foodName || !category || price === undefined) {
    res.status(400).json({ error: 'Missing food properties' });
    return;
  }

  try {
    const foodItems = await DB.getFoodItems();
    const newItem: FoodItem = {
      id: 'f_' + Date.now(),
      foodName,
      category,
      price: Number(price),
      availability: availability !== undefined ? Boolean(availability) : true,
      imageUrl: imageUrl || ''
    };
    foodItems.push(newItem);
    await DB.saveFoodItems(foodItems);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create food item' });
  }
});

app.put('/api/food-items/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { foodName, category, price, availability, imageUrl } = req.body;

  try {
    const foodItems = await DB.getFoodItems();
    const idx = foodItems.findIndex(f => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Food item not found' });
      return;
    }

    foodItems[idx] = {
      ...foodItems[idx],
      foodName: foodName || foodItems[idx].foodName,
      category: category || foodItems[idx].category,
      price: price !== undefined ? Number(price) : foodItems[idx].price,
      availability: availability !== undefined ? Boolean(availability) : foodItems[idx].availability,
      imageUrl: imageUrl !== undefined ? imageUrl : foodItems[idx].imageUrl
    };

    await DB.saveFoodItems(foodItems);
    res.json(foodItems[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update food item properties' });
  }
});

app.delete('/api/food-items/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const foodItems = await DB.getFoodItems();
    const updated = foodItems.filter(f => f.id !== id);
    await DB.saveFoodItems(updated);
    res.json({ success: true, message: 'Food item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete food item' });
  }
});

// ==========================================
// FOOD ORDERING ENDPOINTS
// ==========================================

app.get('/api/food-orders', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const foodOrders = await DB.getFoodOrders();
    const customers = await DB.getCustomers();

    let filteredOrders = foodOrders;
    if (req.user?.role === 'customer' && req.user.customerId) {
      filteredOrders = foodOrders.filter(o => o.customerId === req.user?.customerId);
    }

    const enriched = filteredOrders.map(o => {
      const cust = customers.find(c => c.id === o.customerId);
      return {
        ...o,
        customerName: cust ? cust.name : 'Unknown Guest'
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve food orders' });
  }
});

app.post('/api/food-orders', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { customerId, items } = req.body; // items: { foodItemId: string, quantity: number }[]

  const guestId = req.user?.role === 'customer' ? req.user.customerId! : customerId;

  if (!guestId || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'A customer and food items list are required to place an order.' });
    return;
  }

  try {
    const foodItems = await DB.getFoodItems();
    const orderItems: any[] = [];
    let totalAmount = 0;
    let totalQty = 0;

    for (const it of items) {
      const originalItem = foodItems.find(f => f.id === it.foodItemId);
      if (!originalItem) {
        res.status(400).json({ error: `Food item ${it.foodItemId} does not exist.` });
        return;
      }
      if (!originalItem.availability) {
        res.status(400).json({ error: `Food item "${originalItem.foodName}" is out of stock.` });
        return;
      }
      const qty = Number(it.quantity) || 1;
      const sub = originalItem.price * qty;
      totalAmount += sub;
      totalQty += qty;

      orderItems.push({
        foodItemId: originalItem.id,
        foodName: originalItem.foodName,
        quantity: qty,
        price: originalItem.price
      });
    }

    const foodOrders = await DB.getFoodOrders();
    const newOrder: FoodOrder = {
      id: 'o_' + Date.now(),
      customerId: guestId,
      items: orderItems,
      quantity: totalQty,
      totalAmount,
      status: 'Pending',
      orderDate: new Date().toISOString()
    };

    foodOrders.push(newOrder);
    await DB.saveFoodOrders(foodOrders);

    // Fetch customer details
    const customers = await DB.getCustomers();
    const guestObj = customers.find(c => c.id === guestId);
    const guestEmail = guestObj?.email || '';
    const guestName = guestObj?.name || 'Valued Guest';

    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'New Food Order Received',
      message: `Kitchen alert: a new service order #${newOrder.id} of total $${totalAmount} has been placed for guest ${guestName}.`,
      type: 'Food_Order_Accepted',
      category: 'admin'
    });

    await createNotificationAndEmailLog({
      recipientId: guestId,
      title: 'Food Order Accepted',
      message: `Your cuisine order reference #${newOrder.id} has been accepted by the Chef. Preparing fresh gourmet food!`,
      type: 'Food_Order_Accepted',
      category: 'customer',
      emailTo: guestEmail,
      emailSubject: 'Your Room Service Culinary Order is Accepted - Amber Royale',
      emailDetails: `Dear ${guestName},\n\nYour gourmet in-room dining service order #${newOrder.id} has been accepted by our Chef!\n\nDetails:\nQuantity: ${totalQty} items\nTotal order amount: $${totalAmount}\n\nOur kitchen staff is preparing it with premium organic ingredients. It will be served to you shortly.`
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place food order' });
  }
});

app.put('/api/food-orders/:id/status', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // 'Pending' | 'Served' | 'Cancelled'

  if (!['Pending', 'Served', 'Cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid order status' });
    return;
  }

  try {
    const foodOrders = await DB.getFoodOrders();
    const orderIdx = foodOrders.findIndex(o => o.id === id);
    if (orderIdx === -1) {
      res.status(404).json({ error: 'Food order not found' });
      return;
    }

    if (req.user?.role === 'customer' && foodOrders[orderIdx].customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Forbidden: Cannot edit another customer order status' });
      return;
    }

    const originalOrder = foodOrders[orderIdx];
    const customerId = originalOrder.customerId;
    const cats = await DB.getCustomers();
    const guestObj = cats.find(c => c.id === customerId);
    const guestEmail = guestObj?.email || '';
    const guestName = guestObj?.name || 'Valued Guest';

    if (status === 'Served') {
      await createNotificationAndEmailLog({
        recipientId: customerId,
        title: 'Food Order Delivered',
        message: `Your room service culinary order reference #${id} is delivered to your suite door. Enjoy!`,
        type: 'Food_Order_Delivered',
        category: 'customer',
        emailTo: guestEmail,
        emailSubject: 'Tasty In-Room Dining Service Delivered',
        emailDetails: `Dear ${guestName},\n\nWe are delighted to let you know that your food order reference #${id} has been served to your room.\n\nBon Appétit!`
      });
    } else if (status === 'Cancelled') {
      await createNotificationAndEmailLog({
        recipientId: customerId,
        title: 'Food Order Cancelled',
        message: `Your food order reference #${id} has been marked as cancelled.`,
        type: 'Food_Order_Accepted', // fallback
        category: 'customer'
      });
    }

    foodOrders[orderIdx].status = status;
    await DB.saveFoodOrders(foodOrders);
    res.json(foodOrders[orderIdx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ==========================================
// BILLING & INVOICING ENDPOINTS
// ==========================================

app.get('/api/bills', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const bills = await DB.getBills();
    const customers = await DB.getCustomers();

    let filteredBills = bills;
    if (req.user?.role === 'customer' && req.user.customerId) {
      filteredBills = bills.filter(b => b.customerId === req.user?.customerId);
    }

    const enriched = filteredBills.map(b => {
      const cust = customers.find(c => c.id === b.customerId);
      return {
        ...b,
        customerName: cust ? cust.name : 'Unknown Guest',
        customerPhone: cust ? cust.phone : '',
        customerEmail: cust ? cust.email : '',
        customerAddress: cust ? cust.address : ''
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoice history' });
  }
});

app.put('/api/bills/:id/pay', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const bills = await DB.getBills();
    const idx = bills.findIndex(b => b.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Gated safety check for security
    if (req.user?.role === 'customer' && bills[idx].customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Forbidden: Cannot settle billing invoice of another customer profile' });
      return;
    }

    bills[idx].status = 'Paid';
    await DB.saveBills(bills);
    res.json(bills[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register invoice payment' });
  }
});

// ==========================================
// CENTRALIZED LOYALTY & REWARD UTILITY
// ==========================================
const addLoyaltyPoints = async (customerId: string, points: number, description: string) => {
  try {
    const customers = await DB.getCustomers();
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx !== -1) {
      const c = customers[idx];
      const prevPoints = c.loyaltyPoints || 0;
      const prevHistory = c.loyaltyHistory || [];
      const updatedHistory = [
        ...prevHistory,
        {
          id: 'lh_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          points,
          type: 'Earned' as const,
          description,
          date: new Date().toISOString()
        }
      ];
      customers[idx] = {
        ...c,
        loyaltyPoints: prevPoints + points,
        loyaltyHistory: updatedHistory
      };
      await DB.saveCustomers(customers);
    }
  } catch (err) {
    console.error('Failed to log loyalty points transaction:', err);
  }
};

// Hook loyalty points addition to food order creations
app.post('/api/food-orders', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { customerId, items } = req.body;
    const authorId = req.user?.role === 'customer' ? req.user.customerId! : customerId;

    if (!authorId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Incomplete room service selection details' });
      return;
    }

    const foodItems = await DB.getFoodItems();
    let computedSum = 0;
    let computedQuantity = 0;

    const parsedItems = items.map(sel => {
      const fi = foodItems.find(f => f.id === sel.foodItemId);
      if (!fi) throw new Error(`Menu item not found: ${sel.foodItemId}`);
      computedSum += fi.price * sel.quantity;
      computedQuantity += sel.quantity;
      return {
        foodItemId: fi.id,
        foodName: fi.foodName,
        quantity: sel.quantity,
        price: fi.price
      };
    });

    const orders = await DB.getFoodOrders();
    const newOrder: FoodOrder = {
      id: 'ord_' + Date.now(),
      customerId: authorId,
      items: parsedItems,
      quantity: computedQuantity,
      totalAmount: computedSum,
      status: 'Pending',
      orderDate: new Date().toISOString()
    };

    orders.push(newOrder);
    await DB.saveFoodOrders(orders);

    // Dynamic loyalty point accumulation: 5 loyalty points per $1 ordered (rounded)
    const pts = Math.round(computedSum * 5);
    if (pts > 0) {
      await addLoyaltyPoints(authorId, pts, `Ordered Room Service (Order #${newOrder.id})`);
    }

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to place kitchen order' });
  }
});

// Loyalty points on booking checked-in/created hooks:
// Let's modify the bookings creation in bookings endpoint to add points as well! To avoid overriding checkInDate parsing, we will add points helper directly to app.post('/api/bookings') in our file edit.
// Wait, we can intercept /api/bookings and issue point allocation when Checked-In or created.
// To keep things 100% clean, let's write a dedicated add points interceptor in App.tsx or inside server.ts, which checks if customer created a booking and rewards them. Let's do it inside the booking creation route in server.ts!
// Let's also add points inside booking creations:
// In original server.ts /api/bookings post, we can just fetch the original code from there and append points. Let's write the remaining routes first, then do a swift update for the custom booking loyalty point hooks!

// ==========================================
// HOUSEKEEPING ENDPOINTS
// ==========================================
app.get('/api/housekeeping', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const tasks = await DB.getHousekeepingTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve housekeeping schedule' });
  }
});

app.post('/api/housekeeping', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { roomNumber, task, assignedTo, priority } = req.body;
    if (!roomNumber || !task || !assignedTo) {
      res.status(400).json({ error: 'Room number, specific task, and assignee are required' });
      return;
    }

    const tasks = await DB.getHousekeepingTasks();
    const newTask: HousekeepingTask = {
      id: 'hk_' + Date.now(),
      roomNumber,
      task,
      assignedTo,
      status: 'Pending',
      priority: priority || 'Medium',
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    await DB.saveHousekeepingTasks(tasks);

    // Cascade update Room status to Cleaning or Maintenance if needed!
    const rooms = await DB.getRooms();
    const targetRoomIdx = rooms.findIndex(r => r.roomNumber === roomNumber);
    if (targetRoomIdx !== -1 && rooms[targetRoomIdx].status === 'Available') {
      rooms[targetRoomIdx].status = 'Cleaning';
      await DB.saveRooms(rooms);
    }

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create housekeeping task' });
  }
});

app.put('/api/housekeeping/:id', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { task, assignedTo, status, priority, roomNumber } = req.body;

    const tasks = await DB.getHousekeepingTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Housekeeping task not found' });
      return;
    }

    const updatedTask = {
      ...tasks[idx],
      ...(task && { task }),
      ...(assignedTo && { assignedTo }),
      ...(status && { status }),
      ...(priority && { priority })
    };

    tasks[idx] = updatedTask as HousekeepingTask;
    await DB.saveHousekeepingTasks(tasks);

    // Cascade room status change when task is Completed:
    if (status === 'Completed') {
      const rooms = await DB.getRooms();
      const rIdx = rooms.findIndex(r => r.roomNumber === updatedTask.roomNumber);
      if (rIdx !== -1 && (rooms[rIdx].status === 'Cleaning' || rooms[rIdx].status === 'Maintenance')) {
        rooms[rIdx].status = 'Available';
        await DB.saveRooms(rooms);
      }
    } else if (status === 'In Progress' && updatedTask.roomNumber) {
      const rooms = await DB.getRooms();
      const rIdx = rooms.findIndex(r => r.roomNumber === updatedTask.roomNumber);
      if (rIdx !== -1 && rooms[rIdx].status === 'Available') {
        rooms[rIdx].status = 'Cleaning';
        await DB.saveRooms(rooms);
      }
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update housekeeping details' });
  }
});

app.delete('/api/housekeeping/:id', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tasks = await DB.getHousekeepingTasks();
    const filtered = tasks.filter(t => t.id !== id);
    await DB.saveHousekeepingTasks(filtered);
    res.json({ success: true, message: 'Housekeeping task removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete housekeeping task' });
  }
});

// ==========================================
// COMPLAINT MANAGEMENT ENDPOINTS
// ==========================================
app.get('/api/complaints', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const complaints = await DB.getComplaints();
    if (req.user?.role === 'customer' && req.user.customerId) {
      const filtered = complaints.filter(c => c.customerId === req.user?.customerId);
      res.json(filtered);
    } else {
      res.json(complaints);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

app.post('/api/complaints', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { title, description, roomNumber, priority } = req.body;
    if (!title || !description || !roomNumber) {
      res.status(400).json({ error: 'Title, description details, and room number are required' });
      return;
    }

    const customerId = req.user?.customerId || 'admin_direct';
    const customerName = req.user?.username || 'Authenticated Staff';

    const complaints = await DB.getComplaints();
    const newComplaint: Complaint = {
      id: 'cp_' + Date.now(),
      title,
      description,
      roomNumber,
      customerId,
      customerName,
      priority: priority || 'Low',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    complaints.push(newComplaint);
    await DB.saveComplaints(complaints);

    // Trigger Admin notification
    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'New Complaint Filed',
      message: `Attention Staff: [Room ${roomNumber}] filed a ${priority} priority ticket: "${title}"`,
      type: 'New_Complaint',
      category: 'admin'
    });

    res.status(201).json(newComplaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit guest complaint' });
  }
});

app.put('/api/complaints/:id/status', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body; // 'Pending' | 'In Progress' | 'Resolved'

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      res.status(400).json({ error: 'Invalid complaint filing status tag' });
      return;
    }

    const complaints = await DB.getComplaints();
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Complaint log not found' });
      return;
    }

    const originalComplaint = complaints[idx];
    complaints[idx].status = status;
    if (resolutionNotes) {
      complaints[idx].resolutionNotes = resolutionNotes;
    }
    await DB.saveComplaints(complaints);

    if (status === 'Resolved' && originalComplaint.customerId !== 'admin_direct') {
      const customers = await DB.getCustomers();
      const guestObj = customers.find(c => c.id === originalComplaint.customerId);
      const guestEmail = guestObj?.email || '';
      const guestName = guestObj?.name || originalComplaint.customerName;

      await createNotificationAndEmailLog({
        recipientId: originalComplaint.customerId,
        title: 'Helpdesk Ticket Resolved',
        message: `Your service ticket "${originalComplaint.title}" has been successfully resolved. Resolution: ${resolutionNotes || 'Action complete.'}`,
        type: 'Complaint_Resolved',
        category: 'customer',
        emailTo: guestEmail,
        emailSubject: 'Your Support Complaint is Resolved - Amber Royale',
        emailDetails: `Dear ${guestName},\n\nWe would like to inform you that your reported service ticket has been marked as Resolved.\n\nTicket Title: "${originalComplaint.title}"\nResolution details: ${resolutionNotes || 'Undergone active inspection and completion.'}\n\nPlease reach out if you have any further requests. Thank you for your patience.`
      });
    }

    res.json(complaints[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register resolution modification' });
  }
});

app.delete('/api/complaints/:id', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const complaints = await DB.getComplaints();
    const filtered = complaints.filter(c => c.id !== id);
    await DB.saveComplaints(filtered);
    res.json({ success: true, message: 'Complaint resolved and cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to drop complaint file' });
  }
});

// ==========================================
// EMERGENCY SOS SYSTEM ENDPOINTS
// ==========================================
app.get('/api/emergency/alerts', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const alerts = await DB.getEmergencyAlerts();
    if (req.user?.role === 'customer' && req.user.customerId) {
      const filtered = alerts.filter(a => a.customerId === req.user?.customerId);
      res.json(filtered);
    } else {
      res.json(alerts);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emergency alerts index' });
  }
});

app.post('/api/emergency/alert', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { roomNumber, description } = req.body;
    let fallbackRoomNum = roomNumber || '';

    let customerId = req.user?.customerId || 'admin_or_visitor';
    let customerName = req.user?.username || 'Guest';
    let phoneNum = '+1 555-911-0000';

    if (req.user?.role === 'customer' && req.user.customerId) {
      const customers = await DB.getCustomers();
      const me = customers.find(c => c.id === req.user?.customerId);
      if (me) {
        customerName = me.name;
        phoneNum = me.phone;
      }
      
      // Auto-extract room number from his current Checked-In active stay
      const bookings = await DB.getBookings();
      const myActiveStay = bookings.find(b => b.customerId === req.user?.customerId && b.status === 'Checked-In');
      if (myActiveStay) {
        fallbackRoomNum = myActiveStay.roomNumber;
      }
    }

    if (!fallbackRoomNum) {
      fallbackRoomNum = 'Lobby / Common Area';
    }

    const alerts = await DB.getEmergencyAlerts();
    const newAlert: EmergencyAlert = {
      id: 'sos_' + Date.now(),
      roomNumber: String(fallbackRoomNum),
      customerId,
      customerName,
      phone: phoneNum,
      description: description || 'Emergency Alert',
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    alerts.push(newAlert);
    await DB.saveEmergencyAlerts(alerts);

    // Trigger Admin Notification
    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'EMERGENCY SOS ALERT ACTIVATED',
      message: `CRITICAL ALERT: SOS Distress signal raised in Room ${fallbackRoomNum} by guest ${customerName} (Phone: ${phoneNum}). Description: ${description || 'Immediate emergency response needed'}`,
      type: 'Emergency_SOS',
      category: 'admin'
    });

    res.status(201).json(newAlert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to raise distress signal' });
  }
});

app.put('/api/emergency/alerts/:id/resolve', authenticateJWT, requireRole('admin'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Acknowledged' | 'Resolved'

    const alerts = await DB.getEmergencyAlerts();
    const idx = alerts.findIndex(a => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Distress alarm not found' });
      return;
    }

    alerts[idx].status = status;
    if (status === 'Resolved') {
      alerts[idx].resolvedAt = new Date().toISOString();
    }
    await DB.saveEmergencyAlerts(alerts);
    res.json(alerts[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log alert dispatch update' });
  }
});

// ==========================================
// SMART ROOM RECOMMENDATION ENDPOINT
// ==========================================
app.post('/api/rooms/recommend', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { budget, guests, roomType, acPreference } = req.body;

    const limitBudget = budget ? Number(budget) : Infinity;
    const countGuests = guests ? Number(guests) : 1;
    const typePref = roomType && roomType !== 'Any' ? String(roomType) : null;
    // acPreference: 'AC' | 'Non-AC' | 'Any'
    const acPref = acPreference || 'Any';

    const rooms = await DB.getRooms();
    
    // Seed AC boolean mock to rooms index for search flexibility if missing
    const preparedRooms = rooms.map(r => {
      if (r.hasAC === undefined) {
        // Suites are AC, Deluxe are AC, Standard standardly has standard non-AC or AC
        const ac = r.roomType === 'Suite' || r.roomType === 'Deluxe' || r.roomNumber.endsWith('2');
        return { ...r, hasAC: ac };
      }
      return r;
    });

    const matches = preparedRooms.filter(r => {
      if (r.status !== 'Available') return false;
      if (r.capacity < countGuests) return false;
      if (r.pricePerNight > limitBudget) return false;
      if (typePref && r.roomType !== typePref) return false;

      if (acPref === 'AC' && !r.hasAC) return false;
      if (acPref === 'Non-AC' && r.hasAC) return false;
      
      return true;
    });

    if (matches.length === 0) {
      res.json({ success: false, recommendation: null, message: 'No available suites match all the specified criteria. Try relaxing your budget or capacity preferences.' });
      return;
    }

    // Sort by price closest to budget / best fit
    matches.sort((a, b) => a.pricePerNight - b.pricePerNight);
    const chosen = matches[0]; // best recommended option

    // Generate intelligent reason via Gemini!
    // If Gemini client exists, use it! Otherwise, fall back gracefully to premium static description.
    const apiKey = process.env.GEMINI_API_KEY;
    let recommendationReason = `This available Room ${chosen.roomNumber} is excellent for you. It perfectly accommodates your party size of ${countGuests} guests at a highly affordable price point of ₹${chosen.pricePerNight}/night (well within your budget of ₹${limitBudget}). It has the requested ${chosen.roomType} setup with ideal ${chosen.hasAC ? 'AC cooling systems' : 'ventilated fans'} for standard comfort.`;

    if (apiKey) {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const prompt = `You are the chief concierge AI of Amber Royale Palace Hotel. Provide a single paragraph (maximum 3 concise sentences), extremely polite and personalized "Reason for Recommendation" to the guest John Doe/Emily Watson.
        Preferences selected:
        - Budget: ₹${limitBudget}/night
        - Guests: ${countGuests} people
        - Class type preference: ${typePref || 'Any class description'}
        - AC cooling choice: ${acPref}

        Recommended room found:
        - Room Number: ${chosen.roomNumber}
        - Room Type: ${chosen.roomType}
        - Price per night: ₹${chosen.pricePerNight}
        - Capacity: for up to ${chosen.capacity} guests
        - Air Conditioned: ${chosen.hasAC ? 'Yes' : 'No'}

        Explain warmly why this room is a stellar match for their specifications. Stay elegant, write prose directly without markdown formatting. Do not output anything other than the single paragraph reason. Ensure the style matches the luxury profile of Amber Royale Palace.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        if (response.text) {
          recommendationReason = response.text.trim();
        }
      } catch (gemErr) {
        console.error('Gemini generated recommendation text failure, falling back to static prompt:', gemErr);
      }
    }

    res.json({
      success: true,
      recommendation: {
        roomNumber: chosen.roomNumber,
        roomType: chosen.roomType,
        pricePerNight: chosen.pricePerNight,
        capacity: chosen.capacity,
        imageUrl: chosen.imageUrl,
        hasAC: chosen.hasAC,
        reason: recommendationReason
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to process suite recommendation' });
  }
});

// ==========================================
// AI HOTEL ASSISTANT CHATBOT ENDPOINT
// ==========================================
app.post('/api/ai/chat', async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      res.status(400).json({ error: 'An entry message is required for dialog services' });
      return;
    }

    const rooms = await DB.getRooms();
    const foodItems = await DB.getFoodItems();

    // Permissive JWT token parsing for Chatbot: allow conversational access for unauthenticated guests, or personalize for logged in users
    let guestUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        guestUser = decoded;
      } catch (err) {
        // Safe skip, treat as anonymous visitor
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a very friendly AI chatbot helper explanation that requests setting the API key!
      res.json({
        response: `Warm greetings! I am your AI Virtual Concierge at Amber Royale Hotel.
        
To activate full AI intelligence, please add your **GEMINI_API_KEY** in the **Settings > Secrets** panel of the workspace!
        
In the meantime, I can give you some quick local info:
🏨 Rooms Index: We have ${rooms.length} suites total.
🍽️ Fine Dining Menu: We offer premium options like our ${foodItems.slice(0, 3).map(f => f.foodName).join(', ')} and more!
💡 To book a room or trigger room service deliveries, click on the sidebar menu sections!`
      });
      return;
    }

    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Retrieve and stitch connected tables if a user session exists
    let personalizationPrompt = '';
    if (guestUser) {
      const db = await DB.get();
      if (guestUser.role === 'admin') {
        personalizationPrompt = `
        IMPORTANT ROLE DIRECTIVE:
        The customer chatting with you is logged in as a SYSTEM ADMINISTRATOR (Username: "${guestUser.username}").
        Direct them accurately to admin-specific tools. Assure them of system health, housekeeping queues, or outstanding safety alerts if they ask.
        `;
      } else if (guestUser.customerId) {
        const customer = db.customers.find(c => c.id === guestUser.customerId);
        const customerBookings = db.bookings.filter(b => b.customerId === guestUser.customerId);
        const customerComplaints = db.complaints.filter(c => c.customerId === guestUser.customerId);
        const customerOrders = db.foodOrders.filter(o => o.customerId === guestUser.customerId);
        const customerBills = db.bills.filter(b => b.customerId === guestUser.customerId);

        personalizationPrompt = `
        GUEST PERSONALIZATION CONTEXT (The user speaking is an authenticated checked-in guest):
        - Guest Profile Name: "${customer ? customer.name : guestUser.username}"
        - Email Address: ${customer ? customer.email : 'Unlisted'}
        - Phone Number: ${customer ? customer.phone : 'Unlisted'}
        
        THEIR ACTIVE & HISTORICAL RESERVATIONS:
        ${customerBookings.length > 0 
          ? JSON.stringify(customerBookings.map(b => ({ Room: b.roomNumber, In: b.checkInDate, Out: b.checkOutDate, Status: b.status, Days: b.numberOfDays, BillAmt: `$${b.totalAmount}` })))
          : 'No bookings on file yet.'}
          
        THEIR SUBMITTED SERVICE COMPLAINTS / REPAIRS TICKETS:
        ${customerComplaints.length > 0
          ? JSON.stringify(customerComplaints.map(c => ({ Title: c.title, Room: c.roomNumber, Priority: c.priority, Status: c.status, AgentResponse: c.resolutionNotes || 'Awaiting dispatch' })))
          : 'No submitted complaints or support tickets.'}

        THEIR PLACED IN-ROOM DINING ORDERS:
        ${customerOrders.length > 0
          ? JSON.stringify(customerOrders.map(o => ({ Id: o.id, Status: o.status, Amount: `$${o.totalAmount}`, Time: o.orderDate })))
          : 'No in-suite dining orders.'}

        THEIR BILLING INVOICES:
        ${customerBills.length > 0
          ? JSON.stringify(customerBills.map(b => ({ Invoice: b.invoiceNumber, RoomCharges: `$${b.roomCharges}`, FoodCharges: `$${b.foodCharges}`, Gst: `$${b.gstAmount}`, Total: `$${b.grandTotal}`, Paid: b.status })))
          : 'No current invoices issued.'}

        DIRECTIVES:
        - Greet this guest warmly by name ("Sir/Madame" or their name "${customer ? customer.name : guestUser.username}").
        - If they ask about their room number, bookings, delivery status, invoices, or tickets, use the real-time context above to answer with absolute, precise accuracy!
        - If they ask how to resolve an issue or place an order, let them know they can click the custom sidebar section:
          * To file a repair/issue ticket: Click "Log Service Ticket" in the sidebar.
          * To order room service: Click "Order Room Service" in the sidebar.
          * To see invoice breakdown: Click "My Invoices" in the sidebar.
        `;
      }
    } else {
      personalizationPrompt = `
      THE VISITOR IS AN UNAUTHENTICATED GUEST (Visitor Mode).
      Invite them to sign up or log in to their guest portal so they can view personalized services, access room keys, or file tickets!
      `;
    }

    // Provide complete live context so the chatbot acts with 100% accurate data
    const hotelSystemPrompt = `You are "Roy", the elegant AI Virtual Concierge and personal guest ambassador of the luxury Amber Royale Hotel. 
    Your demeanor is incredibly warm, impeccably polite, royal, helpful, and concise. 
    
    You have REAL-TIME access to our hotel database. Always answer accurately and direct guests correctly.
    
    CURRENT AVAILABLE ROOMS DATABASE IN OUR HOTEL (Guests can book these):
    ${JSON.stringify(rooms.map(r => ({ Number: r.roomNumber, Class: r.roomType, PriceNight: `₹${r.pricePerNight}`, Capacity: `${r.capacity} guests`, CurrentStatus: r.status })))}
    
    CURRENT RESTAURANT CULINARY FINE DINING MENU (Guests can order this under "Order Room Service"):
    ${JSON.stringify(foodItems.map(f => ({ ItemName: f.foodName, Category: f.category, Price: `₹${f.price}`, Available: f.availability ? 'Yes' : 'No' })))}
    
    HOTEL AMENITIES & CONCIERGE SERVICES:
    - High-Speed Fiber Wi-Fi: Free of charge, SSID: "AmberRoyale_Guest", No password required. Just accept terms in splash screen.
    - Royal Rooftop Pool & Lounge: Located on 15th Floor, open 6:00 AM - 10:00 PM. Includes luxury cabanas and poolside bars.
    - Imperial Wellness Spa & Gymnasium: Open 24/7 on Ground level. Professional massages can be reserved.
    - 24/7 In-Suite Room Dining: Guests can place food delivery orders directly under "Order Room Service".
    
    APPLICATION NAVIGATION SHORTCUT COMMANDS (If the guest asks how to book or navigate, explain which sidebar option they should press):
    - To reserve or browse rooms: Click on "Browse Suite Catalog" (or "Rooms Inventory" for managers).
    - To file/browse complaints: Click on "Log Service Ticket".
    - To check invoices: Click on "My Invoices" (visible in portal).
    - To order culinary service: Click on "Order Room Service".

    ${personalizationPrompt}

    Keep your dialog professional, concise, and focused purely on hotel operations. Avoid tech details or developer terms or mentioning variables. Use elegant styling in your answers with short items.`;

    // Package the history into correct Gemini API format
    // Since history arrives as array of { role: 'user' | 'model', text: string }, map them
    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((h: any) => {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const genResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: hotelSystemPrompt,
        temperature: 0.7
      }
    });

    res.json({
      response: genResponse.text ? genResponse.text.trim() : 'I apologize, I am experiencing a brief connection delay. Please try again.'
    });

  } catch (err: any) {
    console.error('AI chat endpoint failure:', err);
    res.status(500).json({ error: 'AI Concierge service is currently cooling down. Try again!' });
  }
});

// ==========================================
// BILL POINT DISCOUNT REDEMPTION
// ==========================================
app.post('/api/bills/:id/redeem', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { pointsToRedeem } = req.body;

    const numericPts = Number(pointsToRedeem);
    if (isNaN(numericPts) || numericPts <= 0) {
      res.status(400).json({ error: 'Positive reward numeric point value is required to calculate redeem discounts' });
      return;
    }

    const customerId = req.user?.customerId;
    if (!customerId) {
      res.status(400).json({ error: 'Only registered lodging guests can request point redemption discounts' });
      return;
    }

    const customers = await DB.getCustomers();
    const cIdx = customers.findIndex(c => c.id === customerId);
    if (cIdx === -1) {
      res.status(404).json({ error: 'Customer profile metadata not found' });
      return;
    }

    const currentPoints = customers[cIdx].loyaltyPoints || 0;
    if (currentPoints < numericPts) {
      res.status(400).json({ error: `Insufficient loyalty balance. You have ${currentPoints} points, requested to redeem ${numericPts} points.` });
      return;
    }

    const bills = await DB.getBills();
    const bIdx = bills.findIndex(b => b.id === id);
    if (bIdx === -1) {
      res.status(404).json({ error: 'Invoiced bill not found' });
      return;
    }

    const bill = bills[bIdx];
    if (bill.customerId !== customerId) {
      res.status(451).json({ error: 'Invoice bill selected does not match registered session customer.' });
      return;
    }

    if (bill.status === 'Paid') {
      res.status(400).json({ error: 'This invoice has already been fully completed and paid.' });
      return;
    }

    // 10 loyalty points = $1 discount
    const discountAmount = Number((numericPts / 10).toFixed(2));
    const newGrandTotal = Math.max(0, parseFloat((bill.grandTotal - discountAmount).toFixed(2)));

    // Apply adjustments
    bills[bIdx].grandTotal = newGrandTotal;
    await DB.saveBills(bills);

    // Charge off user loyalty account
    customers[cIdx].loyaltyPoints = currentPoints - numericPts;
    const currentHist = customers[cIdx].loyaltyHistory || [];
    customers[cIdx].loyaltyHistory = [
      ...currentHist,
      {
        id: 'lh_' + Date.now() + '_' + Math.floor(Math.random() * 100),
        points: -numericPts,
        type: 'Redeemed' as const,
        description: `Applied $${discountAmount} discount to Invoice #${bill.invoiceNumber}`,
        date: new Date().toISOString()
      }
    ];

    await DB.saveCustomers(customers);

    res.json({
      success: true,
      message: `Successfully redeemed ${numericPts} reward points! Applied $${discountAmount} discount to your invoice.`,
      updatedBill: bills[bIdx],
      updatedPoints: customers[cIdx].loyaltyPoints
    });

  } catch (err) {
    res.status(500).json({ error: 'Discount deduction sequence error' });
  }
});


// ==========================================
// REVIEWS & RATINGS ENDPOINTS
// ==========================================

app.get('/api/reviews', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const reviews = await DB.getReviews();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

app.post('/api/reviews', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { roomNumber, rating, comment } = req.body;
  if (!roomNumber || !rating || !comment) {
    res.status(400).json({ error: 'Room number, rating, and comment are required' });
    return;
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    return;
  }

  try {
    const reviews = await DB.getReviews();
    const customers = await DB.getCustomers();
    
    // Find customer profile name
    let customerName = 'Anonymous Guest';
    let customerId = 'anonymous';

    if (req.user?.role === 'customer') {
      customerId = req.user.customerId || 'anonymous';
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        customerName = cust.name;
      }
    } else {
      customerName = req.user?.username || 'Admin';
      customerId = req.user?.id || 'admin';
    }

    const newReview = {
      id: `rev-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      roomNumber: String(roomNumber),
      customerId,
      customerName,
      rating: numericRating,
      comment: String(comment),
      createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    await DB.saveReviews(reviews);
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// ==========================================
// VISITOR MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/visitors', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getVisitorRequests();
    if (req.user?.role === 'admin') {
      res.json(list);
    } else {
      const customerId = req.user?.customerId || 'anonymous';
      res.json(list.filter(v => v.customerId === customerId));
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitor requests' });
  }
});

app.post('/api/visitors', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { visitorName, visitorPhone, idProofType, idProofNumber, purpose, visitDate } = req.body;
  if (!visitorName || !visitorPhone || !visitDate) {
    res.status(400).json({ error: 'Visitor name, phone and visit date are required' });
    return;
  }

  try {
    const list = await DB.getVisitorRequests();
    let customerId = 'anonymous';
    let customerName = 'Guest';

    if (req.user?.role === 'customer') {
      customerId = req.user.customerId || 'anonymous';
      const customers = await DB.getCustomers();
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        customerName = cust.name;
      }
    }

    const newRequest: VisitorRequest = {
      id: `vr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId,
      customerName,
      visitorName: String(visitorName),
      visitorPhone: String(visitorPhone),
      idProofType: String(idProofType || 'N/A'),
      idProofNumber: String(idProofNumber || 'N/A'),
      purpose: String(purpose || 'N/A'),
      visitDate: String(visitDate),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    list.push(newRequest);
    await DB.saveVisitorRequests(list);
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create visitor request' });
  }
});

app.put('/api/visitors/:id/status', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { status } = req.body;
  const { id } = req.params;
  if (status !== 'Approved' && status !== 'Rejected') {
    res.status(400).json({ error: 'Status must be Approved or Rejected' });
    return;
  }

  try {
    const list = await DB.getVisitorRequests();
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Visitor request not found' });
      return;
    }

    list[idx].status = status;
    if (status === 'Approved') {
      list[idx].approvedAt = new Date().toISOString();
    }

    await DB.saveVisitorRequests(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update visitor status' });
  }
});


// ==========================================
// LOST & FOUND MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/lost-found', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getLostItemReports();
    if (req.user?.role === 'admin') {
      res.json(list);
    } else {
      const customerId = req.user?.customerId || 'anonymous';
      res.json(list.filter(item => item.reportedBy === 'staff' || item.customerId === customerId));
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lost & found reports' });
  }
});

app.post('/api/lost-found', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { itemName, itemDescription, lostLocation, lostDate, roomNumber, reportedByStaff } = req.body;
  if (!itemName || !lostLocation || !lostDate) {
    res.status(400).json({ error: 'Item name, location, and lost date are required' });
    return;
  }

  try {
    const list = await DB.getLostItemReports();
    let customerId = undefined;
    let customerName = 'Guest/Staff';

    if (req.user?.role === 'customer') {
      customerId = req.user.customerId;
      const customers = await DB.getCustomers();
      const cust = customers.find(c => c.id === customerId);
      if (cust) customerName = cust.name;
    } else {
      customerName = req.user?.username || 'Staff/Admin';
    }

    const isStaff = req.user?.role === 'admin' || reportedByStaff === true;

    const newReport: LostItemReport = {
      id: `lf-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId,
      customerName,
      roomNumber: roomNumber ? String(roomNumber) : undefined,
      itemName: String(itemName),
      itemDescription: String(itemDescription || ''),
      lostLocation: String(lostLocation),
      lostDate: String(lostDate),
      status: 'Reported',
      createdAt: new Date().toISOString(),
      reportedBy: isStaff ? 'staff' : 'guest'
    };

    list.push(newReport);
    await DB.saveLostItemReports(list);
    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ error: 'Failed to report lost item' });
  }
});

app.put('/api/lost-found/:id/status', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { status, remarks } = req.body;
  const { id } = req.params;
  if (status !== 'Reported' && status !== 'Found' && status !== 'Returned') {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const list = await DB.getLostItemReports();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    list[idx].status = status;
    if (remarks !== undefined) {
      list[idx].remarks = String(remarks);
    }

    await DB.saveLostItemReports(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item status' });
  }
});


// ==========================================
// FEEDBACK & RATINGS ENDPOINTS
// ==========================================

app.get('/api/feedbacks', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getFeedbacks();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

app.post('/api/feedbacks', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { roomRating, foodRating, staffRating, comments } = req.body;
  
  const rRat = Number(roomRating);
  const fRat = Number(foodRating);
  const sRat = Number(staffRating);

  if (isNaN(rRat) || isNaN(fRat) || isNaN(sRat) || rRat < 1 || rRat > 5 || fRat < 1 || fRat > 5 || sRat < 1 || sRat > 5) {
    res.status(400).json({ error: 'Ratings must be numbers between 1 and 5' });
    return;
  }

  try {
    const list = await DB.getFeedbacks();
    let customerId = 'anonymous';
    let customerName = 'Anonymous Guest';

    if (req.user?.role === 'customer') {
      customerId = req.user.customerId || 'anonymous';
      const customers = await DB.getCustomers();
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        customerName = cust.name;
      }
    } else {
      customerName = req.user?.username || 'Guest';
    }

    const newFeedback: Feedback = {
      id: `fb-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId,
      customerName,
      roomRating: rRat,
      foodRating: fRat,
      staffRating: sRat,
      comments: comments ? String(comments) : '',
      createdAt: new Date().toISOString()
    };

    list.push(newFeedback);
    await DB.saveFeedbacks(list);
    res.status(201).json(newFeedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});


// ==========================================
// EMPLOYEE ATTENDANCE ENDPOINTS
// ==========================================

app.get('/api/attendance', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getEmployeeAttendance();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve attendance log' });
  }
});

app.post('/api/attendance/check-in', async (req: express.Request, res: express.Response): Promise<void> => {
  const { employeeId, employeeName, role } = req.body;
  if (!employeeId || !employeeName || !role) {
    res.status(400).json({ error: 'Employee ID, name, and role are required' });
    return;
  }

  try {
    const list = await DB.getEmployeeAttendance();
    const todayStr = new Date().toISOString().split('T')[0];

    // Check if check-in already exists today
    const existing = list.find(a => a.employeeId === employeeId && a.date === todayStr);
    if (existing) {
      res.status(400).json({ error: 'Employee already checked in today.' });
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: EmployeeAttendance = {
      id: `ea-${Date.now()}`,
      employeeId: String(employeeId),
      employeeName: String(employeeName),
      role: String(role),
      date: todayStr,
      checkInTime: timeStr,
      status: 'Present'
    };

    list.push(newRecord);
    await DB.saveEmployeeAttendance(list);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed employee check-in' });
  }
});

app.post('/api/attendance/check-out', async (req: express.Request, res: express.Response): Promise<void> => {
  const { employeeId } = req.body;
  if (!employeeId) {
    res.status(400).json({ error: 'Employee ID is required' });
    return;
  }

  try {
    const list = await DB.getEmployeeAttendance();
    const todayStr = new Date().toISOString().split('T')[0];

    const idx = list.findIndex(a => a.employeeId === employeeId && a.date === todayStr);
    if (idx === -1) {
      res.status(404).json({ error: 'No check-in record found for this employee today.' });
      return;
    }

    if (list[idx].checkOutTime) {
      res.status(400).json({ error: 'Employee already checked out today.' });
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    list[idx].checkOutTime = timeStr;

    await DB.saveEmployeeAttendance(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed employee check-out' });
  }
});

app.post('/api/attendance/log', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { employeeId, employeeName, role, date, status, checkInTime, checkOutTime } = req.body;
  if (!employeeId || !employeeName || !role || !date || !status) {
    res.status(400).json({ error: 'Missing required attendance logging parameters' });
    return;
  }

  try {
    const list = await DB.getEmployeeAttendance();
    const newRecord: EmployeeAttendance = {
      id: `ea-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: String(employeeId),
      employeeName: String(employeeName),
      role: String(role),
      date: String(date),
      checkInTime: checkInTime ? String(checkInTime) : undefined,
      checkOutTime: checkOutTime ? String(checkOutTime) : undefined,
      status: status === 'Present' ? 'Present' : 'Absent'
    };

    list.push(newRecord);
    await DB.saveEmployeeAttendance(list);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed logging custom attendance record' });
  }
});


// ==========================================
// INVENTORY MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/inventory', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getInventoryItems();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve inventory list' });
  }
});

app.post('/api/inventory', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { itemName, category, quantity, unit, lowStockThreshold, supplierName, supplierPhone, supplierEmail } = req.body;
  if (!itemName || !category || quantity === undefined || !unit || lowStockThreshold === undefined || !supplierName || !supplierPhone) {
    res.status(400).json({ error: 'Missing required inventory parameters' });
    return;
  }

  try {
    const list = await DB.getInventoryItems();
    const newItem: InventoryItem = {
      id: `iv-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      itemName: String(itemName),
      category: String(category),
      quantity: Number(quantity),
      unit: String(unit),
      lowStockThreshold: Number(lowStockThreshold),
      supplierName: String(supplierName),
      supplierPhone: String(supplierPhone),
      supplierEmail: supplierEmail ? String(supplierEmail) : undefined,
      updatedAt: new Date().toISOString()
    };

    list.push(newItem);
    await DB.saveInventoryItems(list);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record inventory item' });
  }
});

app.put('/api/inventory/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { itemName, category, quantity, unit, lowStockThreshold, supplierName, supplierPhone, supplierEmail } = req.body;

  try {
    const list = await DB.getInventoryItems();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    if (itemName !== undefined) list[idx].itemName = String(itemName);
    if (category !== undefined) list[idx].category = String(category);
    if (quantity !== undefined) list[idx].quantity = Number(quantity);
    if (unit !== undefined) list[idx].unit = String(unit);
    if (lowStockThreshold !== undefined) list[idx].lowStockThreshold = Number(lowStockThreshold);
    if (supplierName !== undefined) list[idx].supplierName = String(supplierName);
    if (supplierPhone !== undefined) list[idx].supplierPhone = String(supplierPhone);
    if (supplierEmail !== undefined) list[idx].supplierEmail = String(supplierEmail);
    list[idx].updatedAt = new Date().toISOString();

    await DB.saveInventoryItems(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

app.delete('/api/inventory/:id', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const list = await DB.getInventoryItems();
    const updated = list.filter(item => item.id !== id);
    if (list.length === updated.length) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }
    await DB.saveInventoryItems(updated);
    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});


// ==========================================
// ENTERPRISE NOTIFICATION CENTER ENDPOINTS
// ==========================================

app.get('/api/notifications', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getNotifications();
    const { role, customerId, id } = req.user!;
    
    // Filter based on recipient
    if (role === 'customer') {
      const filtered = list.filter(n => n.category === 'customer' && (n.recipientId === customerId || n.recipientId === id || n.recipientId === 'all'));
      res.json(filtered);
    } else {
      const filtered = list.filter(n => n.category === 'admin' || n.recipientId === 'all_admins' || n.recipientId === 'all');
      res.json(filtered);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const list = await DB.getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    list[idx].isRead = true;
    await DB.saveNotifications(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.post('/api/notifications/read-all', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getNotifications();
    const { role, customerId, id } = req.user!;
    
    const updated = list.map(n => {
      if (role === 'customer') {
        if (n.category === 'customer' && (n.recipientId === customerId || n.recipientId === id || n.recipientId === 'all')) {
          n.isRead = true;
        }
      } else {
        if (n.category === 'admin' || n.recipientId === 'all_admins' || n.recipientId === 'all') {
          n.isRead = true;
        }
      }
      return n;
    });
    
    await DB.saveNotifications(updated);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});


// ==========================================
// ROLE-BASED EMPLOYEE DIRECTORY ENDPOINTS
// ==========================================

app.get('/api/employees', authenticateJWT, requireEmployeePermission('manage_employees'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getEmployees();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employee directory' });
  }
});

app.post('/api/employees', authenticateJWT, requireEmployeePermission('manage_employees'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { name, email, phone, role, status, assignedArea } = req.body;
  
  if (!name || !email || !phone || !role || !status) {
    res.status(400).json({ error: 'Missing mandatory employee description params' });
    return;
  }
  
  try {
    const list = await DB.getEmployees();
    
    // Check if there is already an employee with this email
    if (list.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'An employee profile with this exact email already exists.' });
      return;
    }
    
    // Generate unique employee ID
    const count = list.length + 1;
    const empId = `EMP${String(count).padStart(3, '0')}`;
    
    // Auto provision user account for system staff if needed
    let userId: string | undefined;
    const db = await DB.get();
    const username = email.split('@')[0].toLowerCase();
    
    if (!db.users.some(u => u.username === username)) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('staff123', salt);
      const newStaffUser = {
        id: 'u_' + Date.now() + Math.floor(Math.random() * 100),
        username,
        passwordHash,
        role: 'admin' as const,
        employeeRole: role
      };
      db.users.push(newStaffUser);
      await DB.saveUsers(db.users);
      userId = newStaffUser.id;
    }
    
    const newEmp: Employee = {
      id: 'e_' + Date.now(),
      employeeId: empId,
      name,
      email,
      phone,
      role,
      status,
      assignedArea: assignedArea || '',
      joiningDate: new Date().toISOString().split('T')[0],
      userId
    };
    
    list.push(newEmp);
    await DB.saveEmployees(list);
    
    // Trigger notification
    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'New Employee Registered',
      message: `Employee ${name} has been added as a ${role}. Portal password set to staff123`,
      type: 'New_Booking', // using as generic admin trigger
      category: 'admin',
      emailTo: email,
      emailSubject: 'Welcome to Amber Royale Employee Network',
      emailDetails: `Dear ${name},\nYour employee profile is active. You have been assigned the role of ${role}.\n\nPortal Username: ${username}\nTemporary Password: staff123`
    });
    
    res.status(201).json(newEmp);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee profile' });
  }
});

app.put('/api/employees/:id', authenticateJWT, requireEmployeePermission('manage_employees'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, role, status, assignedArea } = req.body;
  try {
    const list = await DB.getEmployees();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    
    list[idx] = {
      ...list[idx],
      name: name !== undefined ? name : list[idx].name,
      email: email !== undefined ? email : list[idx].email,
      phone: phone !== undefined ? phone : list[idx].phone,
      role: role !== undefined ? role : list[idx].role,
      status: status !== undefined ? status : list[idx].status,
      assignedArea: assignedArea !== undefined ? assignedArea : list[idx].assignedArea
    };
    
    await DB.saveEmployees(list);
    
    // Sync the user's role if they have a user record
    if (list[idx].userId && role) {
      const db = await DB.get();
      const uIdx = db.users.findIndex(u => u.id === list[idx].userId);
      if (uIdx !== -1) {
        db.users[uIdx].employeeRole = role;
        await DB.saveUsers(db.users);
      }
    }
    
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', authenticateJWT, requireEmployeePermission('manage_employees'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const list = await DB.getEmployees();
    const filtered = list.filter(e => e.id !== id);
    if (list.length === filtered.length) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    
    // Clean up associated user account
    const matchedEmp = list.find(e => e.id === id);
    if (matchedEmp?.userId) {
      const db = await DB.get();
      db.users = db.users.filter(u => u.id !== matchedEmp.userId);
      await DB.saveUsers(db.users);
    }
    
    await DB.saveEmployees(filtered);
    res.json({ success: true, message: 'Employee profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});


// ==========================================
// ROOM MAINTENANCE ENDPOINTS
// ==========================================

app.get('/api/maintenance', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getMaintenanceRequests();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

app.post('/api/maintenance', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { roomNumber, issueDescription, priority, assignedStaffId } = req.body;
  if (!roomNumber || !issueDescription || !priority) {
    res.status(400).json({ error: 'Missing scheduled maintenance parameters' });
    return;
  }
  
  try {
    const rooms = await DB.getRooms();
    const roomIdx = rooms.findIndex(r => r.roomNumber === roomNumber);
    if (roomIdx === -1) {
      res.status(404).json({ error: 'Room number not recognized' });
      return;
    }
    
    // Set Room status to Maintenance
    rooms[roomIdx].status = 'Maintenance';
    await DB.saveRooms(rooms);
    
    // Lookup staff name if assigned
    let assignedStaffName = '';
    if (assignedStaffId) {
      const emps = await DB.getEmployees();
      const emp = emps.find(e => e.id === assignedStaffId);
      if (emp) assignedStaffName = emp.name;
    }
    
    const list = await DB.getMaintenanceRequests();
    const newReq: MaintenanceRequest = {
      id: 'mr_' + Date.now(),
      roomNumber,
      issueDescription,
      assignedStaffId,
      assignedStaffName: assignedStaffName || undefined,
      priority,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    list.unshift(newReq);
    await DB.saveMaintenanceRequests(list);
    
    // Trigger admin notification
    await createNotificationAndEmailLog({
      recipientId: 'all_admins',
      title: 'Low/High Room Maintenance Scheduled',
      message: `Room ${roomNumber} is set to Under Maintenance: ${issueDescription}. Assigned to: ${assignedStaffName || 'Unassigned'}`,
      type: 'Maintenance_Alert',
      category: 'admin'
    });
    
    res.status(201).json(newReq);
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
});

app.put('/api/maintenance/:id', authenticateJWT, async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  const { status, notes, assignedStaffId, priority } = req.body;
  try {
    const list = await DB.getMaintenanceRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Maintenance log request not found' });
      return;
    }
    
    const prevStatus = list[idx].status;
    
    if (notes !== undefined) list[idx].notes = notes;
    if (status !== undefined) list[idx].status = status;
    if (priority !== undefined) list[idx].priority = priority;
    
    if (assignedStaffId !== undefined) {
      list[idx].assignedStaffId = assignedStaffId;
      if (assignedStaffId) {
        const emps = await DB.getEmployees();
        const emp = emps.find(e => e.id === assignedStaffId);
        if (emp) list[idx].assignedStaffName = emp.name;
      } else {
        list[idx].assignedStaffName = undefined;
      }
    }
    
    if (status === 'Completed') {
      list[idx].completedAt = new Date().toISOString();
      
      // Free the room to Available upon completion of work
      const rooms = await DB.getRooms();
      const roomIdx = rooms.findIndex(r => r.roomNumber === list[idx].roomNumber);
      if (roomIdx !== -1) {
        rooms[roomIdx].status = 'Available';
        await DB.saveRooms(rooms);
      }
      
      // Trigger user ready alert if there is a pending customer waiting (or just notify staff)
      await createNotificationAndEmailLog({
        recipientId: 'all_admins',
        title: 'Room Maintenance Completed',
        message: `Maintenance of Room ${list[idx].roomNumber} is complete. Room is now Available.`,
        type: 'Room_Ready',
        category: 'admin'
      });
    }
    
    await DB.saveMaintenanceRequests(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

app.delete('/api/maintenance/:id', authenticateJWT, requireEmployeePermission('manage_rooms'), async (req: CustomRequest, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    const list = await DB.getMaintenanceRequests();
    const filtered = list.filter(r => r.id !== id);
    if (list.length === filtered.length) {
      res.status(404).json({ error: 'Log not found' });
      return;
    }
    await DB.saveMaintenanceRequests(filtered);
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove maintenance log' });
  }
});


// ==========================================
// ENTERPRISE EMAIL METRICS & AUDIT LOGS
// ==========================================

app.get('/api/email-logs', authenticateJWT, requireRole('admin'), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const list = await DB.getEmailLogs();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve email logs' });
  }
});


// ==========================================
// PORT & WORKSPACE INTEGRATION SETUP

// ==========================================

const startServer = async () => {
  // Trigger initial database load to verify default values / seed values
  await DB.get();

  const PORT = 3000;

  // Wrap express app in http.createServer to support WebSocket upgrades on port 3000
  const server = http.createServer(app);

  // Setup WebSocket Server bound to the same HTTP server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    activeWsClients.add(ws);
    console.log(`WebSocket Client connected. Active Connections: ${activeWsClients.size}`);
    
    ws.on('close', () => {
      activeWsClients.delete(ws);
      console.log(`WebSocket Client disconnected. Active Connections: ${activeWsClients.size}`);
    });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Hotel & Restaurant Management System Server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Critical server startup error:', err);
});
