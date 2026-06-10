import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import axios from 'axios';
import { 
  Building, 
  Hotel, 
  Users, 
  CalendarDays, 
  Pizza, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldAlert, 
  BellRing, 
  ChefHat, 
  FileText,
  Sparkles,
  Compass,
  Award,
  MessageSquare,
  Clock,
  Package,
  Search,
  HelpCircle,
  UserCheck,
  UsersRound,
  Hammer,
  Mail
} from 'lucide-react';

// Subviews
import DashboardView from './components/DashboardView';
import GuestDashboardView from './components/GuestDashboardView';
import RoomsView from './components/RoomsView';
import CustomersView from './components/CustomersView';
import BookingsView from './components/BookingsView';
import RestaurantView from './components/RestaurantView';
import OrderingView from './components/OrderingView';
import BillingView from './components/BillingView';
import ReportsView from './components/ReportsView';
import HousekeepingView from './components/HousekeepingView';
import ComplaintsView from './components/ComplaintsView';
import RecommendationView from './components/RecommendationView';
import LoyaltyView from './components/LoyaltyView';
import EmergencyView from './components/EmergencyView';
import VisitorManagementView from './components/VisitorManagementView';
import LostFoundView from './components/LostFoundView';
import FeedbackManagementView from './components/FeedbackManagementView';
import AttendanceView from './components/AttendanceView';
import InventoryView from './components/InventoryView';
import NotificationsWidget from './components/NotificationsWidget';
import StaffManagementView from './components/StaffManagementView';
import MaintenanceView from './components/MaintenanceView';
import EmailLogsView from './components/EmailLogsView';
import AiChatbotWidget from './components/AiChatbotWidget';

import { User, Room, Customer, Booking, FoodItem, FoodOrder, Bill, DashboardStats, ReportsData, BookingStatus, FoodOrderStatus, Review, HousekeepingTask, Complaint, EmergencyAlert } from './types';
import AuthView from './components/AuthView';

// API Base configuration
const API_URL = window.location.origin;

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App UI Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Records state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  // Bridge state for room booking shortcut
  const [preselectedRoomNumber, setPreselectedRoomNumber] = useState<string | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

  // Loader / Toast states
  const [dataLoading, setDataLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dynamic ticking system time state
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check saved session on start
  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUser = localStorage.getItem('current_user');
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setAuthToken(savedToken);
      setCurrentUser(parsedUser);
      // If customer, switch tab away from dashboard to room reservations
      setActiveTab('dashboard');
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
  }, []);

  // Sync data automatically when user logs in or changes tab
  useEffect(() => {
    if (currentUser) {
      fetchAllApplicationData();
    }
  }, [currentUser, activeTab]);

  // Show auto-dismiss messages
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  const handleLoginSuccess = (token: string, user: User) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setAuthToken(token);
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    delete axios.defaults.headers.common['Authorization'];
    setAuthToken(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
    triggerToast('Securely logged out.', 'success');
  };

  // FETCH ALL REST SERVICES
  const fetchAllApplicationData = async () => {
    setDataLoading(true);
    try {
      // 1. Fetch common public / guest-accessible endpoints
      const [roomsRes, foodItemsRes, reviewsRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`),
        axios.get(`${API_URL}/api/food-items`),
        axios.get(`${API_URL}/api/reviews`)
      ]);

      const validRooms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      setRooms(validRooms);
      setFoodItems(Array.isArray(foodItemsRes.data) ? foodItemsRes.data : []);
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);

      // 2. Fetch role-specific authenticated endpoints
      if (currentUser?.role === 'admin') {
        const [
          customersRes,
          bookingsRes,
          foodOrdersRes,
          billsRes,
          hkRes,
          compRes,
          sosRes,
          statsRes,
          reportsRes
        ] = await Promise.all([
          axios.get(`${API_URL}/api/customers`),
          axios.get(`${API_URL}/api/bookings`),
          axios.get(`${API_URL}/api/food-orders`),
          axios.get(`${API_URL}/api/bills`),
          axios.get(`${API_URL}/api/housekeeping`),
          axios.get(`${API_URL}/api/complaints`),
          axios.get(`${API_URL}/api/emergency/alerts`),
          axios.get(`${API_URL}/api/dashboard/stats`),
          axios.get(`${API_URL}/api/dashboard/reports`)
        ]);

        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setFoodOrders(Array.isArray(foodOrdersRes.data) ? foodOrdersRes.data : []);
        setBills(Array.isArray(billsRes.data) ? billsRes.data : []);
        setHousekeepingTasks(Array.isArray(hkRes.data) ? hkRes.data : []);
        setComplaints(Array.isArray(compRes.data) ? compRes.data : []);
        setEmergencyAlerts(Array.isArray(sosRes.data) ? sosRes.data : []);
        setDashboardStats(statsRes.data || null);
        setReportsData(reportsRes.data || null);

      } else if (currentUser?.role === 'customer') {
        const [
          customersRes,
          bookingsRes,
          foodOrdersRes,
          billsRes,
          compRes,
          sosRes
        ] = await Promise.all([
          axios.get(`${API_URL}/api/customers`),
          axios.get(`${API_URL}/api/bookings`),
          axios.get(`${API_URL}/api/food-orders`),
          axios.get(`${API_URL}/api/bills`),
          axios.get(`${API_URL}/api/complaints`),
          axios.get(`${API_URL}/api/emergency/alerts`)
        ]);

        const validCust = Array.isArray(customersRes.data) ? customersRes.data : [];
        const validBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const validFoodOrders = Array.isArray(foodOrdersRes.data) ? foodOrdersRes.data : [];
        const validBills = Array.isArray(billsRes.data) ? billsRes.data : [];
        const validComplaints = Array.isArray(compRes.data) ? compRes.data : [];
        const validSos = Array.isArray(sosRes.data) ? sosRes.data : [];

        setCustomers(validCust);
        setBookings(validBookings);
        setFoodOrders(validFoodOrders);
        setBills(validBills);
        setComplaints(validComplaints);
        setEmergencyAlerts(validSos);
        setHousekeepingTasks([]); // Not accessible for guests

        // Generate analytics summary from guest's owned records
        setDashboardStats({
          totalRooms: validRooms.length,
          availableRooms: validRooms.filter((r: any) => r.status === 'Available').length,
          occupiedRooms: validRooms.filter((r: any) => r.status === 'Occupied').length,
          totalCustomers: 1,
          totalBookings: validBookings.length,
          totalRevenue: validBills.filter((b: any) => b.status === "Paid").reduce((acc: any, cur: any) => acc + cur.grandTotal, 0),
          foodOrdersToday: validFoodOrders.length
        });
      }
    } catch (err) {
      console.error('Failed to sync master files:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // ROOM ACTIONS
  const handleAddRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      const res = await axios.post(`${API_URL}/api/rooms`, roomData);
      setRooms(prev => [...prev, res.data]);
      triggerToast(`Room ${roomData.roomNumber} added to catalog.`);
    } catch (err: any) {
      throw err;
    }
  };

  const handleEditRoom = async (id: string, roomData: Partial<Room>) => {
    try {
      const res = await axios.put(`${API_URL}/api/rooms/${id}`, roomData);
      setRooms(prev => prev.map(r => r.id === id ? res.data : r));
      triggerToast('Room specification updated successfully.');
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/rooms/${id}`);
      setRooms(prev => prev.filter(r => r.id !== id));
      triggerToast('Room removed from index.');
    } catch (err: any) {
      triggerToast(err?.response?.data?.error || 'Failed to delete room record', 'error');
    }
  };

  const handlePostReview = async (review: { roomNumber: string; rating: number; comment: string }) => {
    try {
      const res = await axios.post(`${API_URL}/api/reviews`, review);
      setReviews(prev => [res.data, ...prev]);
      triggerToast('Thank you! Your suite review has been submitted.');
    } catch (err: any) {
      triggerToast(err?.response?.data?.error || 'Failed to submit room review.', 'error');
    }
  };

  // CUSTOMER GUEST ACTIONS
  const handleAddCustomer = async (custData: Omit<Customer, 'id'>) => {
    try {
      const res = await axios.post(`${API_URL}/api/customers`, custData);
      setCustomers(prev => [...prev, res.data]);
      triggerToast(`Guest profile created for ${custData.name}.`);
    } catch (err: any) {
      throw err;
    }
  };

  const handleEditCustomer = async (id: string, custData: Partial<Customer>) => {
    try {
      const res = await axios.put(`${API_URL}/api/customers/${id}`, custData);
      setCustomers(prev => prev.map(c => c.id === id ? res.data : c));
      triggerToast('Guest profile updated.');
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      triggerToast('Guest profile and portal logins deleted.');
    } catch (err: any) {
      triggerToast('Failed to remove customer record.', 'error');
    }
  };

  // BOOKING REGISTRATIONS
  const handleCreateBooking = async (bData: { 
    customerId: string; 
    roomNumber: string; 
    checkInDate: string; 
    checkOutDate: string; 
    partnerName?: string; 
    partnerIdProof?: string; 
  }) => {
    try {
      const res = await axios.post(`${API_URL}/api/bookings`, bData);
      setBookings(prev => [res.data, ...prev]);
      triggerToast('Success! Room successfully reserved.');
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
    try {
      const res = await axios.put(`${API_URL}/api/bookings/${id}/status`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: res.data.status } : b));
      
      // Real-time cascade changes: reload rooms catalog too
      const roomsRes = await axios.get(`${API_URL}/api/rooms`);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);

      triggerToast(`Reservation status updated to: ${status}`);
    } catch (err: any) {
      triggerToast(err?.response?.data?.error || 'Failed to update stay status', 'error');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/bookings/${id}`);
      setBookings(prev => prev.filter(b => b.id !== id));
      triggerToast('Reservation removed from history.');
    } catch (err: any) {
      triggerToast('Failed to remove reservation log.', 'error');
    }
  };

  // RESTAURANT CULINARY ACTIONS
  const handleAddFood = async (foodData: Omit<FoodItem, 'id'>) => {
    try {
      const res = await axios.post(`${API_URL}/api/food-items`, foodData);
      setFoodItems(prev => [...prev, res.data]);
      triggerToast(`"${foodData.foodName}" added to kitchen menu.`);
    } catch (err: any) {
      throw err;
    }
  };

  const handleEditFood = async (id: string, foodData: Partial<FoodItem>) => {
    try {
      const res = await axios.put(`${API_URL}/api/food-items/${id}`, foodData);
      setFoodItems(prev => prev.map(f => f.id === id ? res.data : f));
      triggerToast('Culinary recipe pricing updated.');
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteFood = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/food-items/${id}`);
      setFoodItems(prev => prev.filter(f => f.id !== id));
      triggerToast('Item removed from menu card.');
    } catch (err: any) {
      triggerToast('Failed to delete culinary recipe.', 'error');
    }
  };

  // FOOD TRANSACTIONS
  const handlePlaceOrder = async (orderData: { customerId: string; items: { foodItemId: string; quantity: number }[] }) => {
    try {
      const res = await axios.post(`${API_URL}/api/food-orders`, orderData);
      setFoodOrders(prev => [res.data, ...prev]);
      triggerToast('Success! Room service dispatched order to chef.');
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: FoodOrderStatus) => {
    try {
      const res = await axios.put(`${API_URL}/api/food-orders/${id}/status`, { status });
      setFoodOrders(prev => prev.map(o => o.id === id ? { ...o, status: res.data.status } : o));
      triggerToast(`Dining service updated: ${status}`);
    } catch (err: any) {
      triggerToast('Failed to dispatch status update to kitchen.', 'error');
    }
  };

  // BILL PAYMENTS
  const handlePayBill = async (id: string) => {
    try {
      const res = await axios.put(`${API_URL}/api/bills/${id}/pay`);
      setBills(prev => prev.map(b => b.id === id ? { ...b, status: 'Paid' as const } : b));
      triggerToast('Payment successfully received & archived.');
    } catch (err: any) {
      triggerToast('Failed to log transaction payment.', 'error');
    }
  };

  const renderActiveView = () => {
    if (activeTab === 'dashboard') {
      if (currentUser?.role === 'admin') {
        return dashboardStats && reportsData ? (
          <DashboardView 
            stats={dashboardStats} 
            reports={reportsData} 
            onViewGuest={(name) => {
              setCustomerSearchQuery(name);
              setActiveTab('customers');
            }}
            onNavigateTab={setActiveTab}
          />
        ) : (
          <div className="flex justify-center items-center h-96 text-slate-400 font-medium">Syncing database...</div>
        );
      } else {
        return (
          <GuestDashboardView 
            currentUser={currentUser}
            bookings={bookings}
            bills={bills}
            foodOrders={foodOrders}
            customers={customers}
            rooms={rooms}
            setActiveTab={setActiveTab}
            triggerToast={triggerToast}
          />
        );
      }
    }

    switch (activeTab) {
      case 'rooms':
        return (
          <RoomsView 
            rooms={rooms}
            isAdmin={currentUser?.role === 'admin'}
            onAddRoom={handleAddRoom}
            onEditRoom={handleEditRoom}
            onDeleteRoom={handleDeleteRoom}
            onBookRoom={(roomNumber) => {
              setPreselectedRoomNumber(roomNumber);
              setActiveTab('bookings');
            }}
            reviews={reviews}
            onAddReview={handlePostReview}
          />
        );
      case 'customers':
        return (
          <CustomersView 
            customers={customers}
            isAdmin={currentUser?.role === 'admin'}
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            initialSearch={customerSearchQuery}
            onClearSearch={() => setCustomerSearchQuery('')}
          />
        );
      case 'bookings':
        return (
          <BookingsView 
            bookings={bookings}
            rooms={rooms}
            customers={customers}
            isAdmin={currentUser?.role === 'admin'}
            currentUser={currentUser}
            onCreateBooking={handleCreateBooking}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
            preselectedRoomNumber={preselectedRoomNumber}
            onClearPreselectedRoom={() => setPreselectedRoomNumber(null)}
          />
        );
      case 'restaurant':
        return (
          <RestaurantView 
            foodItems={foodItems}
            isAdmin={currentUser?.role === 'admin'}
            onAddFood={handleAddFood}
            onEditFood={handleEditFood}
            onDeleteFood={handleDeleteFood}
          />
        );
      case 'ordering':
        return (
          <OrderingView 
            foodItems={foodItems}
            foodOrders={foodOrders}
            customers={customers}
            isAdmin={currentUser?.role === 'admin'}
            currentUser={currentUser}
            onPlaceOrder={handlePlaceOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        );
      case 'billing':
        return (
          <BillingView 
            bills={bills}
            customers={customers}
            bookings={bookings}
            isAdmin={currentUser?.role === 'admin'}
            onPayBill={handlePayBill}
            currentUser={currentUser}
            onRefresh={fetchAllApplicationData}
          />
        );
      case 'housekeeping':
        return (
          <HousekeepingView 
            tasks={housekeepingTasks}
            rooms={rooms}
            isAdmin={currentUser?.role === 'admin'}
            onRefresh={fetchAllApplicationData}
            triggerToast={triggerToast}
          />
        );
      case 'complaints':
        return (
          <ComplaintsView 
            complaints={complaints}
            rooms={rooms}
            isAdmin={currentUser?.role === 'admin'}
            currentUser={currentUser}
            onRefresh={fetchAllApplicationData}
            triggerToast={triggerToast}
            bookings={bookings}
          />
        );
      case 'recommendation':
        return (
          <RecommendationView 
            onBookRoom={(roomNumber) => {
              setPreselectedRoomNumber(roomNumber);
              setActiveTab('bookings');
            }}
            triggerToast={triggerToast}
          />
        );
      case 'loyalty':
        return (
          <LoyaltyView 
            currentUser={currentUser}
            customers={customers}
          />
        );
      case 'emergency':
        return (
          <EmergencyView 
            alerts={emergencyAlerts}
            rooms={rooms}
            isAdmin={currentUser?.role === 'admin'}
            currentUser={currentUser}
            onRefresh={fetchAllApplicationData}
            triggerToast={triggerToast}
            bookings={bookings}
          />
        );
      case 'visitors':
        return (
          <VisitorManagementView 
            currentUser={currentUser}
            triggerToast={triggerToast}
          />
        );
      case 'lostfound':
        return (
          <LostFoundView 
            currentUser={currentUser}
            triggerToast={triggerToast}
          />
        );
      case 'feedback':
        return (
          <FeedbackManagementView 
            currentUser={currentUser}
            triggerToast={triggerToast}
          />
        );
      case 'attendance':
        return currentUser?.role === 'admin' ? (
          <AttendanceView 
            currentUser={currentUser}
            triggerToast={triggerToast}
          />
        ) : (
          <div className="flex justify-center items-center h-96 text-slate-400 font-medium">Restricted content area</div>
        );
      case 'inventory':
        return currentUser?.role === 'admin' ? (
          <InventoryView 
            currentUser={currentUser}
            triggerToast={triggerToast}
          />
        ) : (
          <div className="flex justify-center items-center h-96 text-slate-400 font-medium">Restricted content area</div>
        );
      case 'reports':
        return currentUser?.role === 'admin' && dashboardStats && reportsData ? (
          <ReportsView 
            stats={dashboardStats} 
            reports={reportsData} 
            onViewGuest={(name) => {
              setCustomerSearchQuery(name);
              setActiveTab('customers');
            }}
          />
        ) : (
          <div className="flex justify-center items-center h-96 text-slate-400 font-medium">Restricted content area</div>
        );
      case 'staff':
        return currentUser?.role === 'admin' ? (
          <StaffManagementView 
            currentUser={currentUser} 
            triggerToast={triggerToast} 
          />
        ) : (
          <div className="flex justify-center items-center h-96 text-slate-400 font-medium">Restricted content area</div>
        );
      case 'maintenance':
        return (
          <MaintenanceView 
            currentUser={currentUser} 
            rooms={rooms} 
            triggerToast={triggerToast} 
            onRefresh={fetchAllApplicationData} 
          />
        );
      case 'email-logs':
        return currentUser?.role === 'admin' ? (
          <EmailLogsView 
            currentUser={currentUser} 
            triggerToast={triggerToast} 
          />
        ) : (
          <div className="flex justify-center items-center h-96 text-slate-400 font-medium">Restricted content area</div>
        );
      default:
        return <div className="text-slate-400">View not initialized. Choose from menu panel.</div>;
    }
  };

  // AUTHENTICATION LOGIN OVERLAY
  if (!authToken) {
    return <AuthView onLoginSuccess={handleLoginSuccess} triggerToast={triggerToast} />;
  }

  // Define adaptive menus based on role
  const menuItems = currentUser.role === 'admin' ? [
    { id: 'dashboard', label: t('nav.dashboard', 'Overview'), icon: TrendingUp },
    { id: 'rooms', label: t('nav.rooms', 'Rooms Inventory'), icon: Hotel },
    { id: 'customers', label: t('nav.customers', 'Guests File'), icon: Users },
    { id: 'bookings', label: t('nav.bookings', 'Reservations'), icon: CalendarDays },
    { id: 'restaurant', label: t('nav.restaurant', 'Menu Card Manager'), icon: ChefHat },
    { id: 'ordering', label: t('nav.ordering', 'Room Service Deliveries'), icon: Pizza },
    { id: 'housekeeping', label: t('nav.housekeeping', 'Housekeeping Desk'), icon: Sparkles },
    { id: 'complaints', label: t('nav.complaints', 'Helpdesk Tickets'), icon: MessageSquare },
    { id: 'staff', label: t('nav.staff', 'Staff Roster'), icon: UsersRound },
    { id: 'maintenance', label: t('nav.maintenance', 'Room Maintenance'), icon: Hammer },
    { id: 'email-logs', label: t('nav.email-logs', 'Corporate Mail Logs'), icon: Mail },
    { id: 'visitors', label: t('nav.visitors', 'Visitor Register'), icon: UserCheck },
    { id: 'lostfound', label: t('nav.lostfound', 'Lost & Found Logs'), icon: Search },
    { id: 'feedback', label: t('nav.feedback', 'Experience Audit'), icon: Award },
    { id: 'attendance', label: t('nav.attendance', 'Work Attendance'), icon: Clock },
    { id: 'inventory', label: t('nav.inventory', 'Kitchen Inventory'), icon: Package },
    { id: 'emergency', label: t('nav.emergency', 'Distress Signals Desk'), icon: ShieldAlert },
    { id: 'billing', label: t('nav.billing', 'Billing Invoices'), icon: FileText },
    { id: 'reports', label: t('nav.reports', 'Business Audits'), icon: ShieldCheck },
  ] : [
    { id: 'dashboard', label: t('nav.customer_dashboard', 'My Suite Portal'), icon: TrendingUp },
    { id: 'recommendation', label: t('nav.recommendation', 'Smart Cabin Finder'), icon: Compass },
    { id: 'rooms', label: t('nav.browse_rooms', 'Browse Suite Catalog'), icon: Hotel },
    { id: 'bookings', label: t('nav.my_bookings', 'My Reservations'), icon: CalendarDays },
    { id: 'ordering', label: t('nav.ordering_room_service', 'Order Room Service'), icon: Pizza },
    { id: 'billing', label: t('nav.my_invoices', 'My Invoices'), icon: FileText },
    { id: 'complaints', label: t('nav.log_service_ticket', 'Log Service Ticket'), icon: MessageSquare },
    { id: 'visitors', label: t('nav.visitor_clearance', 'Visitor Clearance'), icon: UserCheck },
    { id: 'lostfound', label: t('nav.report_lost_items', 'Report Lost Items'), icon: Search },
    { id: 'feedback', label: t('nav.leave_feedbacks', 'Leave Feedbacks'), icon: Award },
    { id: 'loyalty', label: t('nav.loyalty_club_points', 'Loyalty Club Points'), icon: Award },
    { id: 'emergency', label: t('nav.safety_panic_sos', 'Safety Panic SOS'), icon: ShieldAlert },
  ];

  return (
    <div className="h-screen bg-[#fcfcfd] text-slate-900 flex overflow-hidden" id="master-root-shell">
      {/* Dynamic Action Toasts */}
      {feedbackToast && (
        <div 
          onClick={() => setFeedbackToast(null)}
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer transition-all border animate-fade-in ${
            feedbackToast.type === 'success' 
              ? 'bg-slate-900 text-slate-50 border-slate-800' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <BellRing className={`w-5 h-5 shrink-0 ${feedbackToast.type === 'success' ? 'text-amber-400' : 'text-rose-500'}`} />
          <span className="text-xs font-semibold">{feedbackToast.message}</span>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none py-6 justify-between h-full">
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          {/* Logo brand */}
          <div className="px-6 flex items-center gap-2 shrink-0">
            <Building className="w-6 h-6 text-amber-500 shrink-0 animate-pulse" />
            <div>
              <h2 className="font-black text-sm tracking-tight text-slate-50 uppercase">AMBER ROYALE</h2>
              <span className="text-[9px] text-amber-500/80 font-black tracking-widest uppercase">Admin Terminal</span>
            </div>
          </div>

          {/* User profile widget */}
          <div className="mx-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-50 max-w-[120px] truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5 tracking-wider">{currentUser.role}</p>
            </div>
          </div>

          {/* Tabs Menu List */}
          <nav className="px-3 space-y-1 flex-1 overflow-y-auto sidebar-scrollbar pr-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                    activeTab === item.id 
                      ? 'bg-amber-600 text-white shadow-xs font-black' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout bottom area */}
        <div className="px-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide text-slate-400 hover:bg-slate-850 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            {t('logout', 'Logout Securely')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header navbar */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900 capitalize tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label || t('workspace', 'Workspace')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {dataLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                {t('syncing', 'Syncing..')}
              </div>
            )}
            
            {/* Real-time Notification Bell Center */}
            <NotificationsWidget 
              currentUser={currentUser} 
              triggerToast={triggerToast} 
              onRefresh={fetchAllApplicationData} 
            />

            {/* Language Toggle Segment Switcher */}
            <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 border border-slate-200" id="language_switcher_container">
              <button
                onClick={() => {
                  setLanguage('en');
                  triggerToast('Language swapped to English.', 'success');
                }}
                className={`py-1 px-2.5 rounded text-[10px] font-black tracking-wider transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-slate-950 text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to English"
                id="language_en_toggle"
              >
                EN
              </button>
              <button
                onClick={() => {
                  setLanguage('hi');
                  triggerToast('भाषा बदलकर हिंदी कर दी गई है।', 'success');
                }}
                className={`py-1 px-2.5 rounded text-[10px] font-black tracking-wider transition-all duration-200 ${
                  language === 'hi'
                    ? 'bg-slate-950 text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="हिंदी में बदलें"
                id="language_hi_toggle"
              >
                हिन्दी
              </button>
            </div>

            <div className="text-right hidden sm:block border-l border-slate-100 pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('lobby.time', 'Lobby Local Time')}</span>
              <span className="text-xs font-semibold text-slate-700 font-mono">
                {systemTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} &bull; {systemTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </header>

        {/* View Frame */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Sidebar - Mobile Navigation slide-over panel */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            onClick={() => setMobileSidebarOpen(false)} 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" 
          />
          <aside className="relative flex flex-col w-64 bg-slate-900 p-6 text-slate-200 justify-between shrink-0 h-full">
            <button 
              onClick={() => setMobileSidebarOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              {/* Logo */}
              <div className="flex items-center gap-2 shrink-0 pr-8">
                <Building className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight text-white uppercase">AMBER ROYALE</h2>
                  <span className="text-[9px] text-amber-500 font-bold uppercase">Terminal</span>
                </div>
              </div>

              {/* Menu list */}
              <nav className="space-y-1 flex-1 overflow-y-auto sidebar-scrollbar pr-1">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === item.id 
                          ? 'bg-amber-600 text-white shadow-xs font-black' 
                          : 'text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={() => {
                handleLogout();
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-855 hover:text-rose-455 mt-4 shrink-0"
            >
              <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
              {t('logout', 'Logout Securely')}
            </button>
          </aside>
        </div>
      )}

      {/* Floating AI Roy Assistant */}
      <AiChatbotWidget />
    </div>
  );
}
