import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import { eq } from 'drizzle-orm';
import { 
  rooms as roomsTable, 
  users as usersTable, 
  customers as customersTable, 
  bookings as bookingsTable, 
  foodItems as foodItemsTable, 
  foodOrders as foodOrdersTable, 
  bills as billsTable, 
  reviews as reviewsTable, 
  housekeepingTasks as housekeepingTasksTable, 
  complaints as complaintsTable, 
  emergencyAlerts as emergencyAlertsTable, 
  visitorRequests as visitorRequestsTable, 
  lostItemReports as lostItemReportsTable, 
  feedbacks as feedbacksTable, 
  employeeAttendance as employeeAttendanceTable, 
  inventoryItems as inventoryItemsTable, 
  employees as employeesTable, 
  notifications as notificationsTable, 
  maintenanceRequests as maintenanceRequestsTable, 
  emailLogs as emailLogsTable 
} from '../db/schema.ts';
import { Room, Customer, Booking, FoodItem, FoodOrder, Bill, User, Review, HousekeepingTask, Complaint, EmergencyAlert, VisitorRequest, LostItemReport, Feedback, EmployeeAttendance, InventoryItem, Employee, AppNotification, MaintenanceRequest, EmailLog } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// Interface to match the required legacy structure
export interface DatabaseSchema {
  users: any[];
  rooms: Room[];
  customers: Customer[];
  bookings: Booking[];
  foodItems: FoodItem[];
  foodOrders: FoodOrder[];
  bills: Bill[];
  reviews: Review[];
  housekeepingTasks: HousekeepingTask[];
  complaints: Complaint[];
  emergencyAlerts: EmergencyAlert[];
  visitorRequests: VisitorRequest[];
  lostItemReports: LostItemReport[];
  feedbacks: Feedback[];
  employeeAttendance: EmployeeAttendance[];
  inventoryItems: InventoryItem[];
  employees: Employee[];
  notifications: AppNotification[];
  maintenanceRequests: MaintenanceRequest[];
  emailLogs: EmailLog[];
}

const getInitialDatabase = async (): Promise<DatabaseSchema> => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const rawUsers = [
    { id: 'u1', username: 'admin', passwordHash: hashedPassword, role: 'admin' as const, employeeRole: 'Super Admin' as const },
    { id: 'u2', username: 'customer_john', passwordHash: await bcrypt.hash('john123', salt), role: 'customer' as const, customerId: 'c1' },
    { id: 'u3', username: 'customer_emily', passwordHash: await bcrypt.hash('emily123', salt), role: 'customer' as const, customerId: 'c2' },
    { id: 'u4', username: 'manager', passwordHash: await bcrypt.hash('manager123', salt), role: 'admin' as const, employeeRole: 'Manager' as const },
    { id: 'u5', username: 'receptionist', passwordHash: await bcrypt.hash('recept123', salt), role: 'admin' as const, employeeRole: 'Receptionist' as const },
    { id: 'u6', username: 'chef', passwordHash: await bcrypt.hash('chef123', salt), role: 'admin' as const, employeeRole: 'Chef' as const },
    { id: 'u7', username: 'housekeeping', passwordHash: await bcrypt.hash('house123', salt), role: 'admin' as const, employeeRole: 'Housekeeping Staff' as const }
  ];

  const rooms: Room[] = [
    { id: 'r1', roomNumber: '101', roomType: 'Standard', pricePerNight: 5500, capacity: 2, status: 'Occupied', imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80' },
    { id: 'r2', roomNumber: '102', roomType: 'Standard', pricePerNight: 5500, capacity: 2, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80' },
    { id: 'r3', roomNumber: '201', roomType: 'Deluxe', pricePerNight: 12000, capacity: 3, status: 'Occupied', imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80' },
    { id: 'r4', roomNumber: '202', roomType: 'Deluxe', pricePerNight: 12000, capacity: 3, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1611891404114-5090bc910af7?auto=format&fit=crop&w=800&q=80' },
    { id: 'r5', roomNumber: '301', roomType: 'Suite', pricePerNight: 28000, capacity: 4, status: 'Occupied', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80' },
    { id: 'r6', roomNumber: '302', roomType: 'Suite', pricePerNight: 28000, capacity: 4, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80' },
    { id: 'r7', roomNumber: '103', roomType: 'Standard', pricePerNight: 6500, capacity: 2, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80' },
    { id: 'r8', roomNumber: '203', roomType: 'Deluxe', pricePerNight: 13000, capacity: 2, status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80' }
  ];

  const customers: Customer[] = [
    { id: 'c1', name: 'John Doe', phone: '+1 555-0199', email: 'john.doe@gmail.com', address: '123 Pine St, Seattle, WA' },
    { id: 'c2', name: 'Emily Watson', phone: '+1 555-0144', email: 'emily.w@yahoo.com', address: '456 Oak Rd, Portland, OR' },
    { id: 'c3', name: 'Robert Downey', phone: '+1 555-0122', email: 'robert.d@marvel.com', address: '789 Malibu Dr, Los Angeles, CA' },
    { id: 'c4', name: 'Scarlett Johansson', phone: '+1 555-0177', email: 'scarlett.j@gmail.com', address: '101 Broadway, New York, NY' },
    { id: 'c5', name: 'Chris Evans', phone: '+1 555-0188', email: 'chris.e@boston.com', address: '222 Freedom Blvd, Boston, MA' }
  ];

  const bookings: Booking[] = [
    { id: 'b1', customerId: 'c1', roomNumber: '101', checkInDate: '2026-06-01', checkOutDate: '2026-06-05', numberOfDays: 4, totalAmount: 22000, status: 'Checked-In', createdAt: '2026-05-25T10:00:00.000Z' },
    { id: 'b2', customerId: 'c2', roomNumber: '201', checkInDate: '2026-06-03', checkOutDate: '2026-06-10', numberOfDays: 7, totalAmount: 84000, status: 'Checked-In', createdAt: '2026-05-28T14:30:00.000Z' },
    { id: 'b3', customerId: 'c3', roomNumber: '301', checkInDate: '2026-06-05', checkOutDate: '2026-06-08', numberOfDays: 3, totalAmount: 84000, status: 'Checked-In', createdAt: '2026-06-01T09:12:00.000Z' },
    { id: 'b4', customerId: 'c4', roomNumber: '102', checkInDate: '2026-05-15', checkOutDate: '2026-05-18', numberOfDays: 3, totalAmount: 16500, status: 'Checked-Out', createdAt: '2026-05-10T11:00:00.000Z' },
    { id: 'b5', customerId: 'c5', roomNumber: '202', checkInDate: '2026-05-20', checkOutDate: '2026-05-25', numberOfDays: 5, totalAmount: 60000, status: 'Checked-Out', createdAt: '2026-05-18T16:20:00.000Z' },
    { id: 'b6', customerId: 'c1', roomNumber: '302', checkInDate: '2026-06-12', checkOutDate: '2026-06-15', numberOfDays: 3, totalAmount: 84000, status: 'Booked', createdAt: '2026-06-07T08:00:00.000Z' }
  ];

  const foodItems: FoodItem[] = [
    { id: 'f1', foodName: 'Crispy Spring Rolls', category: 'Starter', price: 320, availability: true, imageUrl: 'https://images.unsplash.com/photo-1606525437679-037aca74a3e9?auto=format&fit=crop&w=800&q=80' },
    { id: 'f2', foodName: 'Paneer Tikka Kebab', category: 'Starter', price: 450, availability: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80' },
    { id: 'f3', foodName: 'Chicken Alfredo Pasta', category: 'Main Course', price: 650, availability: true, imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80' },
    { id: 'f4', foodName: 'Cheeseburger & Fries', category: 'Main Course', price: 480, availability: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { id: 'f5', foodName: 'Hot Fudge Chocolate Brownie', category: 'Dessert', price: 300, availability: true, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80' },
    { id: 'f6', foodName: 'Mango Cheesecake Slice', category: 'Dessert', price: 350, availability: true, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80' },
    { id: 'f7', foodName: 'Iced Caramel Macchiato', category: 'Beverage', price: 220, availability: true, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80' },
    { id: 'f8', foodName: 'Fresh Watermelon Mojito', category: 'Beverage', price: 250, availability: true, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
    { id: 'f9', foodName: 'Sizzling Garlic Ribeye Steak', category: 'Main Course', price: 1250, availability: true, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80' }
  ];

  const foodOrders: FoodOrder[] = [
    {
      id: 'o1',
      customerId: 'c1',
      items: [
        { foodItemId: 'f4', foodName: 'Cheeseburger & Fries', quantity: 2, price: 480 },
        { foodItemId: 'f8', foodName: 'Fresh Watermelon Mojito', quantity: 2, price: 250 }
      ],
      quantity: 4,
      totalAmount: 1460,
      status: 'Served',
      orderDate: '2026-06-04T12:30:00.000Z'
    },
    {
      id: 'o2',
      customerId: 'c2',
      items: [
        { foodItemId: 'f3', foodName: 'Chicken Alfredo Pasta', quantity: 1, price: 650 },
        { foodItemId: 'f7', foodName: 'Iced Caramel Macchiato', quantity: 1, price: 220 },
        { foodItemId: 'f5', foodName: 'Hot Fudge Chocolate Brownie', quantity: 1, price: 300 }
      ],
      quantity: 3,
      totalAmount: 1170,
      status: 'Served',
      orderDate: '2026-06-06T19:15:00.000Z'
    },
    {
      id: 'o3',
      customerId: 'c3',
      items: [
        { foodItemId: 'f9', foodName: 'Sizzling Garlic Ribeye Steak', quantity: 2, price: 1250 },
        { foodItemId: 'f8', foodName: 'Fresh Watermelon Mojito', quantity: 3, price: 250 }
      ],
      quantity: 5,
      totalAmount: 3250,
      status: 'Pending',
      orderDate: '2026-06-08T18:00:00.000Z'
    }
  ];

  const bills: Bill[] = [
    { id: 'bill_b4', invoiceNumber: 'INV-2026-0001', invoiceDate: '2026-05-18T11:05:00.000Z', customerId: 'c4', bookingId: 'b4', roomCharges: 16500, foodCharges: 0, gstAmount: 2970, grandTotal: 19470, status: 'Paid' },
    { id: 'bill_b5', invoiceNumber: 'INV-2026-0002', invoiceDate: '2026-05-25T16:30:00.000Z', customerId: 'c5', bookingId: 'b5', roomCharges: 60000, foodCharges: 0, gstAmount: 10800, grandTotal: 70800, status: 'Paid' }
  ];

  const reviews: Review[] = [
    { id: 'rev1', roomNumber: '101', customerId: 'c1', customerName: 'John Doe', rating: 5, comment: 'Extremely clean and cozy room. The staff was super helpful!', createdAt: '2026-06-05T10:00:00.000Z' },
    { id: 'rev2', roomNumber: '201', customerId: 'c2', customerName: 'Emily Watson', rating: 4, comment: 'Spacious deluxe room with great views. Room dining was fast.', createdAt: '2026-06-07T14:30:00.000Z' },
    { id: 'rev3', roomNumber: '301', customerId: 'c3', customerName: 'Robert Downey', rating: 5, comment: 'Absolute perfection! The suite is luxurious and worth every penny.', createdAt: '2026-06-08T09:12:00.000Z' }
  ];

  const housekeepingTasks: HousekeepingTask[] = [
    { id: 'hk1', roomNumber: '101', task: 'Deep clean carpet and sanitize bathroom', assignedTo: 'Clara Oswald', status: 'Completed', priority: 'High', createdAt: '2026-06-08T08:00:00.000Z' },
    { id: 'hk2', roomNumber: '102', task: 'Replenish mini-bar, change sheets', assignedTo: 'Martha Jones', status: 'Pending', priority: 'Medium', createdAt: '2026-06-08T10:30:00.000Z' },
    { id: 'hk3', roomNumber: '201', task: 'Inspect AC unit performance, unclog shower drain', assignedTo: 'Rory Williams', status: 'In Progress', priority: 'High', createdAt: '2026-06-08T11:00:00.000Z' }
  ];

  const complaints: Complaint[] = [
    { id: 'cp1', title: 'Slow Wi-Fi connection', description: 'The Wi-Fi speed in room 101 averages below 2 Mbps. Cannot join video calls.', roomNumber: '101', customerId: 'c1', customerName: 'John Doe', priority: 'Medium', status: 'In Progress', createdAt: '2026-06-07T15:45:00.000Z' },
    { id: 'cp2', title: 'Mini-fridge not cooling', description: 'The mini-bar fridge seems to be completely dead. Drinks are warm.', roomNumber: '201', customerId: 'c2', customerName: 'Emily Watson', priority: 'High', status: 'Pending', createdAt: '2026-06-08T09:00:00.000Z' }
  ];

  const emergencyAlerts: EmergencyAlert[] = [
    { id: 'sos1', roomNumber: '101', customerId: 'c1', customerName: 'John Doe', phone: '+1 555-0199', status: 'Resolved', createdAt: '2026-06-06T22:15:00.000Z', resolvedAt: '2026-06-06T22:30:00.000Z' }
  ];

  const visitorRequests: VisitorRequest[] = [
    { id: 'vr1', customerId: 'c1', customerName: 'John Doe', visitorName: 'Alice Smith', visitorPhone: '+1 555-0811', idProofType: 'DL', idProofNumber: 'DL-98765-USA', purpose: 'Business collaboration and documentation sign-off', visitDate: '2026-06-10', status: 'Approved', approvedAt: '2026-06-09T08:00:00.000Z', createdAt: '2026-06-09T07:30:00.000Z' },
    { id: 'vr2', customerId: 'c2', customerName: 'Emily Watson', visitorName: 'David Watson', visitorPhone: '+1 555-0922', idProofType: 'Passport', idProofNumber: 'PPT-7733-UK', purpose: 'Family meeting over lunch', visitDate: '2026-06-11', status: 'Pending', createdAt: '2026-06-09T09:15:00.000Z' }
  ];

  const lostItemReports: LostItemReport[] = [
    { id: 'lf1', customerId: 'c1', customerName: 'John Doe', roomNumber: '101', itemName: 'Golden Apple Watch', itemDescription: 'Series 8 smart watch with a magnetic brown leather band.', lostLocation: 'Main Lobby Seating Area', lostDate: '2026-06-08', status: 'Found', remarks: 'Found near the coffee table. Transferred to central safe box.', createdAt: '2026-06-08T14:00:00.000Z', reportedBy: 'guest' },
    { id: 'lf2', customerId: 'c2', customerName: 'Emily Watson', roomNumber: '201', itemName: 'Black Leather Wallet', itemDescription: 'Saddleback leather bi-fold wallet containing personal ID cards.', lostLocation: 'Poolside Lounge', lostDate: '2026-06-09', status: 'Reported', createdAt: '2026-06-09T10:00:00.000Z', reportedBy: 'guest' }
  ];

  const feedbacks: Feedback[] = [
    { id: 'fb1', customerId: 'c1', customerName: 'John Doe', roomRating: 5, foodRating: 4, staffRating: 5, comments: 'Unmatched hospitality. Safe environment, beautiful rooms and excellent in-room dining services!', createdAt: '2026-06-08T18:30:00.000Z' },
    { id: 'fb2', customerId: 'c2', customerName: 'Emily Watson', roomRating: 4, foodRating: 5, staffRating: 4, comments: 'Loved the Paneer Tikka Kebabs! The service was smooth and the lobby desk resolved questions quickly.', createdAt: '2026-06-09T11:20:00.000Z' }
  ];

  const employeeAttendance: EmployeeAttendance[] = [
    { id: 'ea1', employeeId: 'EMP001', employeeName: 'Chef Rajesh Kumar', role: 'Head Culinary Chef', date: '2026-06-09', checkInTime: '08:00 AM', checkOutTime: '04:00 PM', status: 'Present' },
    { id: 'ea2', employeeId: 'EMP002', employeeName: 'Clara Oswald', role: 'Housekeeping Specialist', date: '2026-06-09', checkInTime: '08:30 AM', status: 'Present' },
    { id: 'ea3', employeeId: 'EMP003', employeeName: 'Martha Jones', role: 'Front Desk Receptionist', date: '2026-06-09', checkInTime: '09:00 AM', status: 'Present' },
    { id: 'ea4', employeeId: 'EMP004', employeeName: 'Rory Williams', role: 'Maintenance Technician', date: '2026-06-09', status: 'Absent' }
  ];

  const inventoryItems: InventoryItem[] = [
    { id: 'iv1', itemName: 'Basmati Rice Premium', category: 'Dry Goods', quantity: 150, unit: 'kg', lowStockThreshold: 40, supplierName: 'Bharat Grocers Ltd', supplierPhone: '+91 9876543210', supplierEmail: 'orders@bharatgrocers.com', updatedAt: '2026-06-09T05:00:00.000Z' },
    { id: 'iv2', itemName: 'Fresh Cottage Cheese (Paneer)', category: 'Dairy', quantity: 8, unit: 'kg', lowStockThreshold: 10, supplierName: 'Amul Dairy Distributors', supplierPhone: '+91 9991112223', supplierEmail: 'delhi@amul.co.in', updatedAt: '2026-06-09T06:30:00.000Z' },
    { id: 'iv3', itemName: 'Organic Chicken Breasts', category: 'Poultry', quantity: 35, unit: 'kg', lowStockThreshold: 15, supplierName: 'Metro Meat Wholesalers', supplierPhone: '+1 555-0931', supplierEmail: 'sales@metromeat.com', updatedAt: '2026-06-09T04:20:00.000Z' },
    { id: 'iv4', itemName: 'Fresh Watermelon', category: 'Produce', quantity: 2, unit: 'kg', lowStockThreshold: 5, supplierName: 'Global Fruits Guild', supplierPhone: '+1 555-0220', supplierEmail: 'supply@fruitsguild.org', updatedAt: '2026-06-09T07:10:00.000Z' }
  ];

  const employees: Employee[] = [
    { id: 'e1', employeeId: 'EMP001', name: 'Chef Rajesh Kumar', email: 'rajesh.chef@amberroyale.com', phone: '+91 9876543201', role: 'Chef', status: 'Active', assignedArea: 'Main Kitchen', joiningDate: '2022-03-15', userId: 'u6' },
    { id: 'e2', employeeId: 'EMP002', name: 'Clara Oswald', email: 'clara.hk@amberroyale.com', phone: '+1 555-0155', role: 'Housekeeping Staff', status: 'Active', assignedArea: 'Floors 1 & 2', joiningDate: '2023-05-10', userId: 'u7' },
    { id: 'e3', employeeId: 'EMP003', name: 'Martha Jones', email: 'martha.rec@amberroyale.com', phone: '+1 555-0176', role: 'Receptionist', status: 'Active', assignedArea: 'Front Lobby Desk', joiningDate: '2024-01-18', userId: 'u5' },
    { id: 'e4', employeeId: 'EMP004', name: 'Rory Williams', email: 'rory.maint@amberroyale.com', phone: '+1 555-0198', role: 'Manager', status: 'Active', assignedArea: 'Operations Office', joiningDate: '2021-11-05', userId: 'u4' },
    { id: 'e5', employeeId: 'EMP005', name: 'Administrator', email: 'admin@amberroyale.com', phone: '+1 555-0100', role: 'Super Admin', status: 'Active', assignedArea: 'Executive Wing', joiningDate: '2020-01-01', userId: 'u1' }
  ];

  const notifications: AppNotification[] = [
    { id: 'n1', recipientId: 'all_admins', title: 'New Customer Registered', message: 'A new guest profile has been successfully created for John Doe.', type: 'New_Guest', category: 'admin', isRead: false, createdAt: '2026-06-09T10:00:00.000Z' },
    { id: 'n2', recipientId: 'all_admins', title: 'Low Inventory Alert', message: 'Fresh Cottage Cheese (Paneer) quantity is below low stock threshold!', type: 'Low_Inventory', category: 'admin', isRead: false, createdAt: '2026-06-09T11:00:00.000Z' },
    { id: 'n3', recipientId: 'c1', title: 'Welcome to Amber Royale', message: 'Your guest account is active and you have been rewarded 500 club points!', type: 'Reward_Points_Added', category: 'customer', isRead: false, createdAt: '2026-06-09T10:01:00.000Z' },
    { id: 'n4', recipientId: 'c1', title: 'Cabin Booking Confirmed', message: 'Your booking for Suite Room 101 has been confirmed.', type: 'Booking_Confirmed', category: 'customer', isRead: true, createdAt: '2026-06-09T10:30:00.000Z' }
  ];

  const maintenanceRequests: MaintenanceRequest[] = [
    { id: 'mr1', roomNumber: '203', issueDescription: 'Air Conditioning system blowing hot air instead of cold', assignedStaffId: 'e2', assignedStaffName: 'Clara Oswald', priority: 'High', status: 'Active', notes: 'Checked compressor. Refrigerant level is slightly low.', createdAt: '2026-06-09T08:00:00.000Z' },
    { id: 'mr2', roomNumber: '103', issueDescription: 'Bathroom faucet has a continuous leak', assignedStaffId: 'e2', assignedStaffName: 'Clara Oswald', priority: 'Medium', status: 'Pending', createdAt: '2026-06-09T09:15:00.000Z' },
    { id: 'mr3', roomNumber: '202', issueDescription: 'Keycard reader batteries low', assignedStaffId: 'e2', assignedStaffName: 'Clara Oswald', priority: 'Low', status: 'Completed', notes: 'Batteries swapped. Tested lock 5 times without issue.', createdAt: '2026-06-08T14:00:00.000Z', completedAt: '2026-06-08T15:00:00.000Z' }
  ];

  const emailLogs: EmailLog[] = [
    { id: 'em1', toEmail: 'john.doe@gmail.com', subject: 'Stay Reservation Confirmed - Amber Royale', body: '<div><h3>Amber Royale Resort</h3><p>Dear John Doe, your booking has been successfully confirmed. We look forward to welcome you!</p></div>', status: 'Success', type: 'Booking Confirmation', sentAt: '2026-06-09T10:30:00.000Z' },
    { id: 'em2', toEmail: 'admin@amberroyale.com', subject: '[Alert] Low Inventory Levels Reported', body: '<div><h3>Inventory Dashboard</h3><p>Alert: Fresh Cottage Cheese (Paneer) quantity is below the limit.</p></div>', status: 'Success', type: 'Low Inventory', sentAt: '2026-06-09T11:00:00.000Z' }
  ];

  return {
    users: rawUsers,
    rooms,
    customers,
    bookings,
    foodItems,
    foodOrders,
    bills,
    reviews,
    housekeepingTasks,
    complaints,
    emergencyAlerts,
    visitorRequests,
    lostItemReports,
    feedbacks,
    employeeAttendance,
    inventoryItems,
    employees,
    notifications,
    maintenanceRequests,
    emailLogs
  };
};

export class DB {
  private static dataCache: DatabaseSchema | null = null;

  private static ensureLocalDirsExist() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // Sync to PostgreSQL and also local database.json (so python terminal of students continues to see the latest web-changes in real-time!)
  private static async syncLocalBackupAndCache(data: DatabaseSchema) {
    this.ensureLocalDirsExist();
    this.dataCache = data;
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to write offline local database.json cache:", err);
    }
  }

  static async get(): Promise<DatabaseSchema> {
    if (this.dataCache) return this.dataCache;

    try {
      const [sqlRooms, sqlUsers, sqlCustomers, sqlBookings, sqlFoodItems, sqlFoodOrders, sqlBills, sqlReviews, sqlHousekeeping, sqlComplaints, sqlEmergencies, sqlVisitors, sqlLostItems, sqlFeedbacks, sqlAttendance, sqlInventory, sqlEmployees, sqlNotifications, sqlMaintenance, sqlEmailLogs] = await Promise.all([
        db.select().from(roomsTable),
        db.select().from(usersTable),
        db.select().from(customersTable),
        db.select().from(bookingsTable),
        db.select().from(foodItemsTable),
        db.select().from(foodOrdersTable),
        db.select().from(billsTable),
        db.select().from(reviewsTable),
        db.select().from(housekeepingTasksTable),
        db.select().from(complaintsTable),
        db.select().from(emergencyAlertsTable),
        db.select().from(visitorRequestsTable),
        db.select().from(lostItemReportsTable),
        db.select().from(feedbacksTable),
        db.select().from(employeeAttendanceTable),
        db.select().from(inventoryItemsTable),
        db.select().from(employeesTable),
        db.select().from(notificationsTable),
        db.select().from(maintenanceRequestsTable),
        db.select().from(emailLogsTable)
      ]);

      // If database is completely brand new and empty (e.g., no rooms seeded), let's automatically seed it!
      if (sqlRooms.length === 0 && sqlUsers.length === 0) {
        console.log("Cloud SQL is empty. Automatically seeding transactional database structures with rich initial assets...");
        let initialData: DatabaseSchema;
        if (fs.existsSync(DATA_FILE)) {
          try {
            initialData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
          } catch {
            initialData = await getInitialDatabase();
          }
        } else {
          initialData = await getInitialDatabase();
        }

        // Seed all tables sequentially to avoid pool contention
        if (initialData.users?.length) {
          await db.insert(usersTable).values(
            initialData.users.map((u: any) => ({
              id: u.id,
              username: u.username,
              passwordHash: u.passwordHash,
              role: u.role,
              customerId: u.customerId || null,
              employeeRole: u.employeeRole || null
            }))
          );
        }
        if (initialData.rooms?.length) {
          await db.insert(roomsTable).values(
            initialData.rooms.map((r: any) => ({
              id: r.id,
              roomNumber: r.roomNumber,
              roomType: r.roomType,
              pricePerNight: Number(r.pricePerNight),
              capacity: Number(r.capacity),
              status: r.status,
              imageUrl: r.imageUrl || null,
              hasAC: r.hasAC || false
            }))
          );
        }
        if (initialData.customers?.length) {
          await db.insert(customersTable).values(
            initialData.customers.map((c: any) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              address: c.address || null,
              loyaltyPoints: c.loyaltyPoints || 0,
              loyaltyHistory: c.loyaltyHistory || []
            }))
          );
        }
        if (initialData.bookings?.length) {
          await db.insert(bookingsTable).values(
            initialData.bookings.map((b: any) => ({
              id: b.id,
              customerId: b.customerId,
              roomNumber: b.roomNumber,
              checkInDate: b.checkInDate,
              checkOutDate: b.checkOutDate,
              numberOfDays: Number(b.numberOfDays),
              totalAmount: Number(b.totalAmount),
              status: b.status,
              createdAt: b.createdAt,
              partnerName: b.partnerName || null,
              partnerIdProof: b.partnerIdProof || null
            }))
          );
        }
        if (initialData.foodItems?.length) {
          await db.insert(foodItemsTable).values(
            initialData.foodItems.map((f: any) => ({
              id: f.id,
              foodName: f.foodName,
              category: f.category,
              price: Number(f.price),
              availability: f.availability !== false,
              imageUrl: f.imageUrl || null
            }))
          );
        }
        if (initialData.foodOrders?.length) {
          await db.insert(foodOrdersTable).values(
            initialData.foodOrders.map((o: any) => ({
              id: o.id,
              customerId: o.customerId,
              items: o.items,
              quantity: Number(o.quantity),
              totalAmount: Number(o.totalAmount),
              status: o.status,
              orderDate: o.orderDate
            }))
          );
        }
        if (initialData.bills?.length) {
          await db.insert(billsTable).values(
            initialData.bills.map((b: any) => ({
              id: b.id,
              invoiceNumber: b.invoiceNumber,
              invoiceDate: b.invoiceDate,
              customerId: b.customerId,
              bookingId: b.bookingId || null,
              roomCharges: Number(b.roomCharges),
              foodCharges: Number(b.foodCharges),
              gstAmount: Number(b.gstAmount),
              grandTotal: Number(b.grandTotal),
              status: b.status
            }))
          );
        }
        if (initialData.reviews?.length) {
          await db.insert(reviewsTable).values(
            initialData.reviews.map((r: any) => ({
              id: r.id,
              roomNumber: r.roomNumber,
              customerId: r.customerId,
              customerName: r.customerName,
              rating: Number(r.rating),
              comment: r.comment,
              createdAt: r.createdAt
            }))
          );
        }
        if (initialData.housekeepingTasks?.length) {
          await db.insert(housekeepingTasksTable).values(
            initialData.housekeepingTasks.map((h: any) => ({
              id: h.id,
              roomNumber: h.roomNumber,
              task: h.task,
              assignedTo: h.assignedTo,
              status: h.status,
              priority: h.priority,
              createdAt: h.createdAt
            }))
          );
        }
        if (initialData.complaints?.length) {
          await db.insert(complaintsTable).values(
            initialData.complaints.map((c: any) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              roomNumber: c.roomNumber,
              customerId: c.customerId,
              customerName: c.customerName,
              priority: c.priority,
              status: c.status,
              resolutionNotes: c.resolutionNotes || null,
              createdAt: c.createdAt
            }))
          );
        }
        if (initialData.emergencyAlerts?.length) {
          await db.insert(emergencyAlertsTable).values(
            initialData.emergencyAlerts.map((e: any) => ({
              id: e.id,
              roomNumber: e.roomNumber,
              customerId: e.customerId,
              customerName: e.customerName,
              phone: e.phone,
              description: e.description || null,
              status: e.status,
              createdAt: e.createdAt,
              resolvedAt: e.resolvedAt || null
            }))
          );
        }
        if (initialData.visitorRequests?.length) {
          await db.insert(visitorRequestsTable).values(
            initialData.visitorRequests.map((v: any) => ({
              id: v.id,
              customerId: v.customerId,
              customerName: v.customerName,
              visitorName: v.visitorName,
              visitorPhone: v.visitorPhone,
              idProofType: v.idProofType,
              idProofNumber: v.idProofNumber,
              purpose: v.purpose,
              visitDate: v.visitDate,
              status: v.status,
              approvedAt: v.approvedAt || null,
              createdAt: v.createdAt
            }))
          );
        }
        if (initialData.lostItemReports?.length) {
          await db.insert(lostItemReportsTable).values(
            initialData.lostItemReports.map((l: any) => ({
              id: l.id,
              customerId: l.customerId || null,
              customerName: l.customerName,
              roomNumber: l.roomNumber || null,
              itemName: l.itemName,
              itemDescription: l.itemDescription,
              lostLocation: l.lostLocation,
              lostDate: l.lostDate,
              status: l.status,
              remarks: l.remarks || null,
              createdAt: l.createdAt,
              reportedBy: l.reportedBy
            }))
          );
        }
        if (initialData.feedbacks?.length) {
          await db.insert(feedbacksTable).values(
            initialData.feedbacks.map((f: any) => ({
              id: f.id,
              customerId: f.customerId,
              customerName: f.customerName,
              roomRating: Number(f.roomRating),
              foodRating: Number(f.foodRating),
              staffRating: Number(f.staffRating),
              comments: f.comments,
              createdAt: f.createdAt
            }))
          );
        }
        if (initialData.employeeAttendance?.length) {
          await db.insert(employeeAttendanceTable).values(
            initialData.employeeAttendance.map((a: any) => ({
              id: a.id,
              employeeId: a.employeeId,
              employeeName: a.employeeName,
              role: a.role,
              date: a.date,
              checkInTime: a.checkInTime || null,
              checkOutTime: a.checkOutTime || null,
              status: a.status
            }))
          );
        }
        if (initialData.inventoryItems?.length) {
          await db.insert(inventoryItemsTable).values(
            initialData.inventoryItems.map((i: any) => ({
              id: i.id,
              itemName: i.itemName,
              category: i.category,
              quantity: Number(i.quantity),
              unit: i.unit,
              lowStockThreshold: Number(i.lowStockThreshold),
              supplierName: i.supplierName,
              supplierPhone: i.supplierPhone,
              supplierEmail: i.supplierEmail || null,
              updatedAt: i.updatedAt
            }))
          );
        }
        if (initialData.employees?.length) {
          await db.insert(employeesTable).values(
            initialData.employees.map((e: any) => ({
              id: e.id,
              employeeId: e.employeeId,
              name: e.name,
              email: e.email,
              phone: e.phone,
              role: e.role,
              status: e.status,
              assignedArea: e.assignedArea || null,
              joiningDate: e.joiningDate,
              userId: e.userId || null
            }))
          );
        }
        if (initialData.notifications?.length) {
          await db.insert(notificationsTable).values(
            initialData.notifications.map((n: any) => ({
              id: n.id,
              recipientId: n.recipientId,
              title: n.title,
              message: n.message,
              type: n.type,
              category: n.category,
              isRead: n.isRead || false,
              createdAt: n.createdAt
            }))
          );
        }
        if (initialData.maintenanceRequests?.length) {
          await db.insert(maintenanceRequestsTable).values(
            initialData.maintenanceRequests.map((m: any) => ({
              id: m.id,
              roomNumber: m.roomNumber,
              issueDescription: m.issueDescription,
              assignedStaffId: m.assignedStaffId || null,
              assignedStaffName: m.assignedStaffName || null,
              priority: m.priority,
              status: m.status,
              notes: m.notes || null,
              createdAt: m.createdAt,
              completedAt: m.completedAt || null
            }))
          );
        }
        if (initialData.emailLogs?.length) {
          await db.insert(emailLogsTable).values(
            initialData.emailLogs.map((e: any) => ({
              id: e.id,
              toEmail: e.toEmail,
              subject: e.subject,
              body: e.body,
              status: e.status,
              type: e.type,
              sentAt: e.sentAt
            }))
          );
        }

        this.dataCache = initialData;
        await this.syncLocalBackupAndCache(initialData);
        return initialData;
      }

      // Convert SQL records back to our core TypeScript interface types
      const parsedSchema: DatabaseSchema = {
        users: sqlUsers,
        rooms: sqlRooms.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType as any,
          pricePerNight: r.pricePerNight,
          capacity: r.capacity,
          status: r.status as any,
          imageUrl: r.imageUrl || undefined,
          hasAC: r.hasAC || undefined
        })),
        customers: sqlCustomers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address || '',
          loyaltyPoints: c.loyaltyPoints || undefined,
          loyaltyHistory: (c.loyaltyHistory as any) || undefined
        })),
        bookings: sqlBookings.map(b => ({
          id: b.id,
          customerId: b.customerId,
          roomNumber: b.roomNumber,
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          numberOfDays: b.numberOfDays,
          totalAmount: b.totalAmount,
          status: b.status as any,
          createdAt: b.createdAt,
          partnerName: b.partnerName || undefined,
          partnerIdProof: b.partnerIdProof || undefined
        })),
        foodItems: sqlFoodItems.map(f => ({
          id: f.id,
          foodName: f.foodName,
          category: f.category as any,
          price: f.price,
          availability: f.availability || false,
          imageUrl: f.imageUrl || undefined
        })),
        foodOrders: sqlFoodOrders.map(o => ({
          id: o.id,
          customerId: o.customerId,
          items: (o.items as any) || [],
          quantity: o.quantity,
          totalAmount: o.totalAmount,
          status: o.status as any,
          orderDate: o.orderDate
        })),
        bills: sqlBills.map(b => ({
          id: b.id,
          invoiceNumber: b.invoiceNumber,
          invoiceDate: b.invoiceDate,
          customerId: b.customerId,
          bookingId: b.bookingId,
          roomCharges: b.roomCharges,
          foodCharges: b.foodCharges,
          gstAmount: b.gstAmount,
          grandTotal: b.grandTotal,
          status: b.status as any
        })),
        reviews: sqlReviews,
        housekeepingTasks: sqlHousekeeping.map(h => ({
          id: h.id,
          roomNumber: h.roomNumber,
          task: h.task,
          assignedTo: h.assignedTo,
          status: h.status as any,
          priority: h.priority as any,
          createdAt: h.createdAt
        })),
        complaints: sqlComplaints.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          roomNumber: c.roomNumber,
          customerId: c.customerId,
          customerName: c.customerName,
          priority: c.priority as any,
          status: c.status as any,
          resolutionNotes: c.resolutionNotes || undefined,
          createdAt: c.createdAt
        })),
        emergencyAlerts: sqlEmergencies.map(e => ({
          id: e.id,
          roomNumber: e.roomNumber,
          customerId: e.customerId,
          customerName: e.customerName,
          phone: e.phone,
          description: e.description || undefined,
          status: e.status as any,
          createdAt: e.createdAt,
          resolvedAt: e.resolvedAt || undefined
        })),
        visitorRequests: sqlVisitors.map(v => ({
          id: v.id,
          customerId: v.customerId,
          customerName: v.customerName,
          visitorName: v.visitorName,
          visitorPhone: v.visitorPhone,
          idProofType: v.idProofType,
          idProofNumber: v.idProofNumber,
          purpose: v.purpose,
          visitDate: v.visitDate,
          status: v.status as any,
          approvedAt: v.approvedAt || undefined,
          createdAt: v.createdAt
        })),
        lostItemReports: sqlLostItems.map(l => ({
          id: l.id,
          customerId: l.customerId || undefined,
          customerName: l.customerName,
          roomNumber: l.roomNumber || undefined,
          itemName: l.itemName,
          itemDescription: l.itemDescription,
          lostLocation: l.lostLocation,
          lostDate: l.lostDate,
          status: l.status as any,
          remarks: l.remarks || undefined,
          createdAt: l.createdAt,
          reportedBy: l.reportedBy as any
        })),
        feedbacks: sqlFeedbacks,
        employeeAttendance: sqlAttendance.map(a => ({
          id: a.id,
          employeeId: a.employeeId,
          employeeName: a.employeeName,
          role: a.role,
          date: a.date,
          checkInTime: a.checkInTime || undefined,
          checkOutTime: a.checkOutTime || undefined,
          status: a.status as any
        })),
        inventoryItems: sqlInventory,
        employees: sqlEmployees.map(e => ({
          id: e.id,
          employeeId: e.employeeId,
          name: e.name,
          email: e.email,
          phone: e.phone,
          role: e.role as any,
          status: e.status as any,
          assignedArea: e.assignedArea || undefined,
          joiningDate: e.joiningDate,
          userId: e.userId || undefined
        })),
        notifications: sqlNotifications.map(n => ({
          id: n.id,
          recipientId: n.recipientId,
          title: n.title,
          message: n.message,
          type: n.type as any,
          category: n.category as any,
          isRead: n.isRead,
          createdAt: n.createdAt
        })),
        maintenanceRequests: sqlMaintenance.map(m => ({
          id: m.id,
          roomNumber: m.roomNumber,
          issueDescription: m.issueDescription,
          assignedStaffId: m.assignedStaffId || undefined,
          assignedStaffName: m.assignedStaffName || undefined,
          priority: m.priority as any,
          status: m.status as any,
          notes: m.notes || undefined,
          createdAt: m.createdAt,
          completedAt: m.completedAt || undefined
        })),
        emailLogs: sqlEmailLogs.map(e => ({
          id: e.id,
          toEmail: e.toEmail,
          subject: e.subject,
          body: e.body,
          status: e.status as any,
          type: e.type,
          sentAt: e.sentAt
        }))
      };

      this.dataCache = parsedSchema;
      await this.syncLocalBackupAndCache(parsedSchema);
      return parsedSchema;
    } catch (err) {
      console.error("Failed to query Cloud SQL PostgreSQL database. Falling back to offline local file JSON storage:", err);
      this.ensureLocalDirsExist();
      if (fs.existsSync(DATA_FILE)) {
        try {
          const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
          const parsed = JSON.parse(fileContent);
          this.dataCache = parsed;
          return parsed;
        } catch {
          // ignore parsing issues
        }
      }
      const initial = await getInitialDatabase();
      this.dataCache = initial;
      return initial;
    }
  }

  static async write(): Promise<void> {
    if (!this.dataCache) return;
    this.ensureLocalDirsExist();
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.dataCache, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to save local fallback DB sync file:", err);
    }
  }

  static async getUsers() { 
    return (await this.get()).users;
  }
  static async getRooms() { 
    return (await this.get()).rooms;
  }
  static async getCustomers() { 
    return (await this.get()).customers;
  }
  static async getBookings() { 
    return (await this.get()).bookings;
  }
  static async getFoodItems() { 
    return (await this.get()).foodItems;
  }
  static async getFoodOrders() { 
    return (await this.get()).foodOrders;
  }
  static async getBills() { 
    return (await this.get()).bills;
  }
  static async getReviews() { 
    return (await this.get()).reviews || [];
  }
  static async getHousekeepingTasks() { 
    return (await this.get()).housekeepingTasks || [];
  }
  static async getComplaints() { 
    return (await this.get()).complaints || [];
  }
  static async getEmergencyAlerts() { 
    return (await this.get()).emergencyAlerts || [];
  }

  static async saveUsers(users: any[]) { 
    try {
      await db.delete(usersTable);
      if (users.length > 0) {
        await db.insert(usersTable).values(
          users.map((u: any) => ({
            id: u.id,
            username: u.username,
            passwordHash: u.passwordHash,
            role: u.role,
            customerId: u.customerId || null,
            employeeRole: u.employeeRole || null
          }))
        );
      }
    } catch (err) {
      console.error("SQL write users failed:", err);
    }
    const current = await this.get();
    current.users = users; 
    await this.write();
  }

  static async saveRooms(rooms: Room[]) { 
    try {
      await db.delete(roomsTable);
      if (rooms.length > 0) {
        await db.insert(roomsTable).values(
          rooms.map((r: any) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            roomType: r.roomType,
            pricePerNight: Number(r.pricePerNight),
            capacity: Number(r.capacity),
            status: r.status,
            imageUrl: r.imageUrl || null,
            hasAC: r.hasAC || false
          }))
        );
      }
    } catch (err) {
      console.error("SQL write rooms failed:", err);
    }
    const current = await this.get();
    current.rooms = rooms; 
    await this.write();
  }

  static async saveCustomers(customers: Customer[]) { 
    try {
      await db.delete(customersTable);
      if (customers.length > 0) {
        await db.insert(customersTable).values(
          customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            address: c.address || null,
            loyaltyPoints: c.loyaltyPoints || 0,
            loyaltyHistory: c.loyaltyHistory || []
          }))
        );
      }
    } catch (err) {
      console.error("SQL write customers failed:", err);
    }
    const current = await this.get();
    current.customers = customers; 
    await this.write();
  }

  static async saveBookings(bookings: Booking[]) { 
    try {
      await db.delete(bookingsTable);
      if (bookings.length > 0) {
        await db.insert(bookingsTable).values(
          bookings.map((b: any) => ({
            id: b.id,
            customerId: b.customerId,
            roomNumber: b.roomNumber,
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            numberOfDays: Number(b.numberOfDays),
            totalAmount: Number(b.totalAmount),
            status: b.status,
            createdAt: b.createdAt,
            partnerName: b.partnerName || null,
            partnerIdProof: b.partnerIdProof || null
          }))
        );
      }
    } catch (err) {
      console.error("SQL write bookings failed:", err);
    }
    const current = await this.get();
    current.bookings = bookings; 
    await this.write(); 
  }

  static async saveFoodItems(foodItems: FoodItem[]) { 
    try {
      await db.delete(foodItemsTable);
      if (foodItems.length > 0) {
        await db.insert(foodItemsTable).values(
          foodItems.map((f: any) => ({
            id: f.id,
            foodName: f.foodName,
            category: f.category,
            price: Number(f.price),
            availability: f.availability !== false,
            imageUrl: f.imageUrl || null
          }))
        );
      }
    } catch (err) {
      console.error("SQL write food items failed:", err);
    }
    const current = await this.get();
    current.foodItems = foodItems; 
    await this.write(); 
  }

  static async saveFoodOrders(foodOrders: FoodOrder[]) { 
    try {
      await db.delete(foodOrdersTable);
      if (foodOrders.length > 0) {
        await db.insert(foodOrdersTable).values(
          foodOrders.map((o: any) => ({
            id: o.id,
            customerId: o.customerId,
            items: o.items,
            quantity: Number(o.quantity),
            totalAmount: Number(o.totalAmount),
            status: o.status,
            orderDate: o.orderDate
          }))
        );
      }
    } catch (err) {
      console.error("SQL write food orders failed:", err);
    }
    const current = await this.get();
    current.foodOrders = foodOrders; 
    await this.write(); 
  }

  static async saveBills(bills: Bill[]) { 
    try {
      await db.delete(billsTable);
      if (bills.length > 0) {
        await db.insert(billsTable).values(
          bills.map((b: any) => ({
            id: b.id,
            invoiceNumber: b.invoiceNumber,
            invoiceDate: b.invoiceDate,
            customerId: b.customerId,
            bookingId: b.bookingId || null,
            roomCharges: Number(b.roomCharges),
            foodCharges: Number(b.foodCharges),
            gstAmount: Number(b.gstAmount),
            grandTotal: Number(b.grandTotal),
            status: b.status
          }))
        );
      }
    } catch (err) {
      console.error("SQL write bills failed:", err);
    }
    const current = await this.get();
    current.bills = bills; 
    await this.write(); 
  }

  static async saveReviews(reviews: Review[]) { 
    try {
      await db.delete(reviewsTable);
      if (reviews.length > 0) {
        await db.insert(reviewsTable).values(
          reviews.map((r: any) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            customerId: r.customerId,
            customerName: r.customerName,
            rating: Number(r.rating),
            comment: r.comment,
            createdAt: r.createdAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write reviews failed:", err);
    }
    const current = await this.get();
    current.reviews = reviews; 
    await this.write(); 
  }

  static async saveHousekeepingTasks(housekeepingTasks: HousekeepingTask[]) { 
    try {
      await db.delete(housekeepingTasksTable);
      if (housekeepingTasks.length > 0) {
        await db.insert(housekeepingTasksTable).values(
          housekeepingTasks.map((h: any) => ({
            id: h.id,
            roomNumber: h.roomNumber,
            task: h.task,
            assignedTo: h.assignedTo,
            status: h.status,
            priority: h.priority,
            createdAt: h.createdAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write housekeeping failed:", err);
    }
    const current = await this.get();
    current.housekeepingTasks = housekeepingTasks; 
    await this.write(); 
  }

  static async saveComplaints(complaints: Complaint[]) { 
    try {
      await db.delete(complaintsTable);
      if (complaints.length > 0) {
        await db.insert(complaintsTable).values(
          complaints.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            roomNumber: c.roomNumber,
            customerId: c.customerId,
            customerName: c.customerName,
            priority: c.priority,
            status: c.status,
            resolutionNotes: c.resolutionNotes || null,
            createdAt: c.createdAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write complaints failed:", err);
    }
    const current = await this.get();
    current.complaints = complaints; 
    await this.write(); 
  }

  static async saveEmergencyAlerts(emergencyAlerts: EmergencyAlert[]) { 
    try {
      await db.delete(emergencyAlertsTable);
      if (emergencyAlerts.length > 0) {
        await db.insert(emergencyAlertsTable).values(
          emergencyAlerts.map((e: any) => ({
            id: e.id,
            roomNumber: e.roomNumber,
            customerId: e.customerId,
            customerName: e.customerName,
            phone: e.phone,
            description: e.description || null,
            status: e.status,
            createdAt: e.createdAt,
            resolvedAt: e.resolvedAt || null
          }))
        );
      }
    } catch (err) {
      console.error("SQL write emergencies failed:", err);
    }
    const current = await this.get();
    current.emergencyAlerts = emergencyAlerts; 
    await this.write(); 
  }

  static async getVisitorRequests() { 
    return (await this.get()).visitorRequests || [];
  }
  static async saveVisitorRequests(visitorRequests: VisitorRequest[]) { 
    try {
      await db.delete(visitorRequestsTable);
      if (visitorRequests.length > 0) {
        await db.insert(visitorRequestsTable).values(
          visitorRequests.map((v: any) => ({
            id: v.id,
            customerId: v.customerId,
            customerName: v.customerName,
            visitorName: v.visitorName,
            visitorPhone: v.visitorPhone,
            idProofType: v.idProofType,
            idProofNumber: v.idProofNumber,
            purpose: v.purpose,
            visitDate: v.visitDate,
            status: v.status,
            approvedAt: v.approvedAt || null,
            createdAt: v.createdAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write visitors failed:", err);
    }
    const current = await this.get();
    current.visitorRequests = visitorRequests; 
    await this.write(); 
  }

  static async getLostItemReports() { 
    return (await this.get()).lostItemReports || [];
  }
  static async saveLostItemReports(lostItemReports: LostItemReport[]) { 
    try {
      await db.delete(lostItemReportsTable);
      if (lostItemReports.length > 0) {
        await db.insert(lostItemReportsTable).values(
          lostItemReports.map((l: any) => ({
            id: l.id,
            customerId: l.customerId || null,
            customerName: l.customerName,
            roomNumber: l.roomNumber || null,
            itemName: l.itemName,
            itemDescription: l.itemDescription,
            lostLocation: l.lostLocation,
            lostDate: l.lostDate,
            status: l.status,
            remarks: l.remarks || null,
            createdAt: l.createdAt,
            reportedBy: l.reportedBy
          }))
        );
      }
    } catch (err) {
      console.error("SQL write lost items failed:", err);
    }
    const current = await this.get();
    current.lostItemReports = lostItemReports; 
    await this.write(); 
  }

  static async getFeedbacks() { 
    return (await this.get()).feedbacks || [];
  }
  static async saveFeedbacks(feedbacks: Feedback[]) { 
    try {
      await db.delete(feedbacksTable);
      if (feedbacks.length > 0) {
        await db.insert(feedbacksTable).values(
          feedbacks.map((f: any) => ({
            id: f.id,
            customerId: f.customerId,
            customerName: f.customerName,
            roomRating: Number(f.roomRating),
            foodRating: Number(f.foodRating),
            staffRating: Number(f.staffRating),
            comments: f.comments,
            createdAt: f.createdAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write feedback failed:", err);
    }
    const current = await this.get();
    current.feedbacks = feedbacks; 
    await this.write(); 
  }

  static async getEmployeeAttendance() { 
    return (await this.get()).employeeAttendance || [];
  }
  static async saveEmployeeAttendance(employeeAttendance: EmployeeAttendance[]) { 
    try {
      await db.delete(employeeAttendanceTable);
      if (employeeAttendance.length > 0) {
        await db.insert(employeeAttendanceTable).values(
          employeeAttendance.map((a: any) => ({
            id: a.id,
            employeeId: a.employeeId,
            employeeName: a.employeeName,
            role: a.role,
            date: a.date,
            checkInTime: a.checkInTime || null,
            checkOutTime: a.checkOutTime || null,
            status: a.status
          }))
        );
      }
    } catch (err) {
      console.error("SQL write attendance failed:", err);
    }
    const current = await this.get();
    current.employeeAttendance = employeeAttendance; 
    await this.write(); 
  }

  static async getInventoryItems() { 
    return (await this.get()).inventoryItems || [];
  }
  static async saveInventoryItems(inventoryItems: InventoryItem[]) { 
    try {
      await db.delete(inventoryItemsTable);
      if (inventoryItems.length > 0) {
        await db.insert(inventoryItemsTable).values(
          inventoryItems.map((i: any) => ({
            id: i.id,
            itemName: i.itemName,
            category: i.category,
            quantity: Number(i.quantity),
            unit: i.unit,
            lowStockThreshold: Number(i.lowStockThreshold),
            supplierName: i.supplierName,
            supplierPhone: i.supplierPhone,
            supplierEmail: i.supplierEmail || null,
            updatedAt: i.updatedAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write inventory failed:", err);
    }
    const current = await this.get();
    current.inventoryItems = inventoryItems; 
    await this.write(); 
  }

  static async getEmployees() { 
    return (await this.get()).employees || [];
  }
  static async saveEmployees(employees: Employee[]) { 
    try {
      await db.delete(employeesTable);
      if (employees.length > 0) {
        await db.insert(employeesTable).values(
          employees.map((e: any) => ({
            id: e.id,
            employeeId: e.employeeId,
            name: e.name,
            email: e.email,
            phone: e.phone,
            role: e.role,
            status: e.status,
            assignedArea: e.assignedArea || null,
            joiningDate: e.joiningDate,
            userId: e.userId || null
          }))
        );
      }
    } catch (err) {
      console.error("SQL write employees failed:", err);
    }
    const current = await this.get();
    current.employees = employees; 
    await this.write(); 
  }

  static async getNotifications() { 
    return (await this.get()).notifications || [];
  }
  static async saveNotifications(notifications: AppNotification[]) { 
    try {
      await db.delete(notificationsTable);
      if (notifications.length > 0) {
        await db.insert(notificationsTable).values(
          notifications.map((n: any) => ({
            id: n.id,
            recipientId: n.recipientId,
            title: n.title,
            message: n.message,
            type: n.type,
            category: n.category,
            isRead: n.isRead,
            createdAt: n.createdAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write notifications failed:", err);
    }
    const current = await this.get();
    current.notifications = notifications; 
    await this.write(); 
  }

  static async getMaintenanceRequests() { 
    return (await this.get()).maintenanceRequests || [];
  }
  static async saveMaintenanceRequests(maintenanceRequests: MaintenanceRequest[]) { 
    try {
      await db.delete(maintenanceRequestsTable);
      if (maintenanceRequests.length > 0) {
        await db.insert(maintenanceRequestsTable).values(
          maintenanceRequests.map((m: any) => ({
            id: m.id,
            roomNumber: m.roomNumber,
            issueDescription: m.issueDescription,
            assignedStaffId: m.assignedStaffId || null,
            assignedStaffName: m.assignedStaffName || null,
            priority: m.priority,
            status: m.status,
            notes: m.notes || null,
            createdAt: m.createdAt,
            completedAt: m.completedAt || null
          }))
        );
      }
    } catch (err) {
      console.error("SQL write maintenance failed:", err);
    }
    const current = await this.get();
    current.maintenanceRequests = maintenanceRequests; 
    await this.write(); 
  }

  static async getEmailLogs() { 
    return (await this.get()).emailLogs || [];
  }
  static async saveEmailLogs(emailLogs: EmailLog[]) { 
    try {
      await db.delete(emailLogsTable);
      if (emailLogs.length > 0) {
        await db.insert(emailLogsTable).values(
          emailLogs.map((e: any) => ({
            id: e.id,
            toEmail: e.toEmail,
            subject: e.subject,
            body: e.body,
            status: e.status,
            type: e.type,
            sentAt: e.sentAt
          }))
        );
      }
    } catch (err) {
      console.error("SQL write email logs failed:", err);
    }
    const current = await this.get();
    current.emailLogs = emailLogs; 
    await this.write(); 
  }
}
