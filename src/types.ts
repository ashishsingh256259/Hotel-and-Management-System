export type RoomType = 'Standard' | 'Deluxe' | 'Suite';
export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
export type BookingStatus = 'Booked' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
export type FoodCategory = 'Starter' | 'Main Course' | 'Dessert' | 'Beverage';
export type FoodOrderStatus = 'Pending' | 'Served' | 'Cancelled';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'customer';
  customerId?: string; // linked if customer role
  employeeRole?: 'Super Admin' | 'Manager' | 'Receptionist' | 'Chef' | 'Housekeeping Staff';
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus;
  imageUrl?: string;
  hasAC?: boolean; // dynamic AC flag
}

export interface LoyaltyHistoryItem {
  id: string;
  points: number;
  type: 'Earned' | 'Redeemed';
  description: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyaltyPoints?: number;
  loyaltyHistory?: LoyaltyHistoryItem[];
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  task: string;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  roomNumber: string;
  customerId: string;
  customerName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  createdAt: string;
}

export interface EmergencyAlert {
  id: string;
  roomNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  description?: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  roomNumber: string; // references Room.roomNumber or Room.id
  checkInDate: string;
  checkOutDate: string;
  numberOfDays: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  partnerName?: string;
  partnerIdProof?: string;
}

export interface FoodItem {
  id: string;
  foodName: string;
  category: FoodCategory;
  price: number;
  availability: boolean;
  imageUrl?: string;
}

export interface OrderItem {
  foodItemId: string;
  foodName: string;
  quantity: number;
  price: number;
}

export interface FoodOrder {
  id: string;
  customerId: string;
  items: OrderItem[];
  quantity: number;
  totalAmount: number;
  status: FoodOrderStatus;
  orderDate: string;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  bookingId: string | null;
  roomCharges: number;
  foodCharges: number;
  gstAmount: number; // 18%
  grandTotal: number;
  status: 'Paid' | 'Unpaid';
}

// REST Responses
export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  foodOrdersToday: number;
}

export interface ReportsData {
  dailyRevenue: { date: string; amount: number }[];
  monthlyRevenue: { month: string; amount: number }[];
  roomOccupancy: { status: string; count: number }[];
  foodSales: { item: string; count: number; total: number }[];
  customerBookings: { name: string; bookings: number; revenue: number }[];
}

export interface Review {
  id: string;
  roomNumber: string;
  customerId: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface VisitorRequest {
  id: string;
  customerId: string;
  customerName: string;
  visitorName: string;
  visitorPhone: string;
  idProofType: string;
  idProofNumber: string;
  purpose: string;
  visitDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedAt?: string;
  createdAt: string;
}

export interface LostItemReport {
  id: string;
  customerId?: string;
  customerName: string;
  roomNumber?: string;
  itemName: string;
  itemDescription: string;
  lostLocation: string;
  lostDate: string;
  status: 'Reported' | 'Found' | 'Returned';
  remarks?: string;
  createdAt: string;
  reportedBy: 'guest' | 'staff';
}

export interface Feedback {
  id: string;
  customerId: string;
  customerName: string;
  roomRating: number; // 1 to 5
  foodRating: number; // 1 to 5
  staffRating: number; // 1 to 5
  comments: string;
  createdAt: string;
}

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  status: 'Present' | 'Absent';
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  supplierName: string;
  supplierPhone: string;
  supplierEmail?: string;
  updatedAt: string;
}

export type EmployeeRole = 'Super Admin' | 'Manager' | 'Receptionist' | 'Chef' | 'Housekeeping Staff';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: 'Active' | 'On Leave' | 'Inactive';
  assignedArea?: string;
  joiningDate: string;
  userId?: string; // system login reference
}

export interface AppNotification {
  id: string;
  recipientId: string | 'all_admins' | 'all'; // target user id, all admins, or everyone
  title: string;
  message: string;
  type: 'Booking_Confirmed' | 'Booking_Cancelled' | 'Room_Ready' | 'Food_Order_Accepted' | 'Food_Order_Delivered' | 'Complaint_Resolved' | 'Reward_Points_Added' | 'New_Booking' | 'New_Guest' | 'New_Complaint' | 'Low_Inventory' | 'Maintenance_Alert' | 'Emergency_SOS';
  category: 'admin' | 'customer';
  isRead: boolean;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  roomNumber: string;
  issueDescription: string;
  assignedStaffId?: string; // employee table reference
  assignedStaffName?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Active' | 'Completed';
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EmailLog {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  status: 'Success' | 'Failed';
  type: string;
  sentAt: string;
}


