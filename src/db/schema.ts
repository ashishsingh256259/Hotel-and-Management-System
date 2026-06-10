import { pgTable, text, integer, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'customer'
  customerId: text('customer_id'),
  employeeRole: text('employee_role'),
});

// Rooms Table
export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  roomType: text('room_type').notNull(),
  pricePerNight: doublePrecision('price_per_night').notNull(),
  capacity: integer('capacity').notNull(),
  status: text('status').notNull(),
  imageUrl: text('image_url'),
  hasAC: boolean('has_ac').default(false),
});

// Customers Table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').default(0),
  loyaltyHistory: jsonb('loyalty_history'), // Array of LoyaltyHistoryItem
});

// Bookings Table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  roomNumber: text('room_number').notNull(),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date').notNull(),
  numberOfDays: integer('number_of_days').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull(), // BookingStatus
  createdAt: text('created_at').notNull(),
  partnerName: text('partner_name'),
  partnerIdProof: text('partner_id_proof'),
});

// Food Items Table
export const foodItems = pgTable('food_items', {
  id: text('id').primaryKey(),
  foodName: text('food_name').notNull(),
  category: text('category').notNull(),
  price: doublePrecision('price').notNull(),
  availability: boolean('availability').default(true),
  imageUrl: text('image_url'),
});

// Food Orders Table
export const foodOrders = pgTable('food_orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  items: jsonb('items').notNull(), // Array of OrderItem
  quantity: integer('quantity').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull(), // FoodOrderStatus
  orderDate: text('order_date').notNull(),
});

// Bills Table
export const bills = pgTable('bills', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  customerId: text('customer_id').notNull(),
  bookingId: text('booking_id'),
  roomCharges: doublePrecision('room_charges').notNull(),
  foodCharges: doublePrecision('food_charges').notNull(),
  gstAmount: doublePrecision('gst_amount').notNull(),
  grandTotal: doublePrecision('grand_total').notNull(),
  status: text('status').notNull(), // 'Paid' | 'Unpaid'
});

// Reviews Table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: text('created_at').notNull(),
});

// Housekeeping Tasks Table
export const housekeepingTasks = pgTable('housekeeping_tasks', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  task: text('task').notNull(),
  assignedTo: text('assigned_to').notNull(),
  status: text('status').notNull(),
  priority: text('priority').notNull(),
  createdAt: text('created_at').notNull(),
});

// Complaints Table
export const complaints = pgTable('complaints', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  roomNumber: text('room_number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  resolutionNotes: text('resolution_notes'),
  createdAt: text('created_at').notNull(),
});

// Emergency Alerts Table
export const emergencyAlerts = pgTable('emergency_alerts', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  resolvedAt: text('resolved_at'),
});

// Visitor Requests Table
export const visitorRequests = pgTable('visitor_requests', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  visitorName: text('visitor_name').notNull(),
  visitorPhone: text('visitor_phone').notNull(),
  idProofType: text('id_proof_type').notNull(),
  idProofNumber: text('id_proof_number').notNull(),
  purpose: text('purpose').notNull(),
  visitDate: text('visit_date').notNull(),
  status: text('status').notNull(),
  approvedAt: text('approved_at'),
  createdAt: text('created_at').notNull(),
});

// Lost Item Reports Table
export const lostItemReports = pgTable('lost_item_reports', {
  id: text('id').primaryKey(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  roomNumber: text('room_number'),
  itemName: text('item_name').notNull(),
  itemDescription: text('item_description').notNull(),
  lostLocation: text('lost_location').notNull(),
  lostDate: text('lost_date').notNull(),
  status: text('status').notNull(),
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
  reportedBy: text('reported_by').notNull(),
});

// Feedbacks Table
export const feedbacks = pgTable('feedbacks', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  roomRating: integer('room_rating').notNull(),
  foodRating: integer('food_rating').notNull(),
  staffRating: integer('staff_rating').notNull(),
  comments: text('comments').notNull(),
  createdAt: text('created_at').notNull(),
});

// Employee Attendance Table
export const employeeAttendance = pgTable('employee_attendance', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  employeeName: text('employee_name').notNull(),
  role: text('role').notNull(),
  date: text('date').notNull(),
  checkInTime: text('check_in_time'),
  checkOutTime: text('check_out_time'),
  status: text('status').notNull(),
});

// Inventory Items Table
export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(),
  quantity: integer('quantity').notNull(),
  unit: text('unit').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull(),
  supplierName: text('supplier_name').notNull(),
  supplierPhone: text('supplier_phone').notNull(),
  supplierEmail: text('supplier_email'),
  updatedAt: text('updated_at').notNull(),
});

// Employees Table
export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull(),
  assignedArea: text('assigned_area'),
  joiningDate: text('joining_date').notNull(),
  userId: text('user_id'),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipientId: text('recipient_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: text('created_at').notNull(),
});

// Maintenance Requests Table
export const maintenanceRequests = pgTable('maintenance_requests', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  issueDescription: text('issue_description').notNull(),
  assignedStaffId: text('assigned_staff_id'),
  assignedStaffName: text('assigned_staff_name'),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

// Email Logs Table
export const emailLogs = pgTable('email_logs', {
  id: text('id').primaryKey(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull(),
  type: text('type').notNull(),
  sentAt: text('sent_at').notNull(),
});
