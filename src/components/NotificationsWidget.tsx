import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash, CheckSquare, Filter, Inbox, X, RefreshCw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../types';

interface NotificationsWidgetProps {
  currentUser: {
    id: string;
    username: string;
    role: 'admin' | 'customer';
    employeeRole?: string;
    customerId?: string;
  };
  triggerToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  onRefresh?: () => void;
}

export default function NotificationsWidget({ currentUser, triggerToast, onRefresh }: NotificationsWidgetProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Establish WebSocket Connection for Real-Time Instant notifications
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      console.log('Connecting to WebSocket server:', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NOTIFICATION_RECEIVED') {
            const newNotif: AppNotification = payload.data;
            
            // Check if this notification is for this user
            const { role, customerId, id } = currentUser;
            const forThisUser = 
              (role === 'admin' && (newNotif.category === 'admin' || newNotif.recipientId === 'all_admins' || newNotif.recipientId === 'all')) 
              || 
              (role === 'customer' && newNotif.category === 'customer' && (newNotif.recipientId === customerId || newNotif.recipientId === id || newNotif.recipientId === 'all'));

            if (forThisUser) {
              setNotifications(prev => {
                // Avoid duplicate additions (Idempotency)
                if (prev.some(n => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
              });
              
              // Trigger instant toast notification!
              triggerToast(newNotif.title, newNotif.message, 'info');
              
              if (onRefresh) onRefresh();
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed. Retrying in 5 seconds...');
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket?.close();
      };
    }

    connect();

    return () => {
      if (socket) {
        socket.onclose = null; // prevent reconnect callback
        socket.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        triggerToast('Notifications Synced', 'All messages successfully marked as read.', 'success');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const getFilteredNotifications = () => {
    if (filterType === 'all') return notifications;
    if (filterType === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => n.type === filterType);
  };

  // Helper to get visually stunning color tags for notification types
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Booking_Confirmed':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'Booking_Cancelled':
        return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
      case 'Emergency_SOS':
        return { bg: 'bg-red-600/20 animate-pulse', text: 'text-red-400 font-bold', border: 'border-red-600/30' };
      case 'Maintenance_Alert':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
      case 'Food_Order_Accepted':
        return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
      case 'Food_Order_Delivered':
        return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
      case 'Complaint_Resolved':
        return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' };
      case 'Reward_Points_Added':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' };
      default:
        return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
    }
  };

  const unreadCount = getUnreadCount();
  const filteredList = getFilteredNotifications();

  return (
    <div className="relative z-40 font-sans" id="notifications_widget_wrapper" ref={dropdownRef}>
      {/* Target Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-all duration-300 shadow-md flex items-center justify-center focus:outline-none"
        title="Notifications Center"
        id="notification_bell_button"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-slate-950 ring-2 ring-slate-900 animate-bounce-gentle shrink-0"
            id="unread_notifications_badge"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Pop-down Notification Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-96 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 ring-1 ring-black/50"
            id="notifications_panel_dropdown"
          >
            {/* Header Area */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm tracking-tight font-display">Notifications Center</h3>
                {unreadCount > 0 && (
                  <span className="py-0.5 px-2 rounded-full bg-amber-500/10 text-amber-500 text-[11px] font-medium border border-amber-500/20">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchNotifications} 
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                  title="Force Reload"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 transition-colors px-1"
                    title="Mark all read"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Read All
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters category row */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/60 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" />
              {[
                { label: 'All', val: 'all' },
                { label: 'Unread', val: 'unread' },
                { label: 'Emergency', val: 'Emergency_SOS' },
                { label: 'Bookings', val: 'Booking_Confirmed' },
                { label: 'Kitchen', val: 'Food_Order_Accepted' },
                { label: 'Maintenance', val: 'Maintenance_Alert' }
              ].map(f => (
                <button
                  key={f.val}
                  onClick={() => setFilterType(f.val)}
                  className={`py-1 px-2.5 rounded text-[11px] font-medium shrink-0 transition-all ${
                    filterType === f.val 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notifications Scroller view */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/50" id="notifications_list_scroller">
              {filteredList.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                  <Inbox className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
                  <p className="text-xs text-slate-500 font-medium">No system notifications found</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">You are fully up to date!</p>
                </div>
              ) : (
                filteredList.map(n => {
                  const style = getTypeStyles(n.type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      className={`p-4 transition-colors relative flex gap-3 cursor-pointer ${
                        n.isRead ? 'bg-transparent text-slate-400' : 'bg-slate-900/30 hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Left side dot indicators */}
                      {!n.isRead && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}

                      {/* Icon tag placeholder */}
                      <div className={`w-8 h-8 rounded-lg ${style.bg} ${style.text} border ${style.border} flex items-center justify-center shrink-0`}>
                        <Bell className="w-4 h-4" />
                      </div>

                      {/* Content details description */}
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-semibold font-display tracking-tight ${!n.isRead ? 'text-slate-100' : 'text-slate-400'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          {n.message}
                        </p>
                        
                        <div className="flex items-center gap-3 pt-1.5">
                          {/* Display Human Readable Tag Type */}
                          <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono tracking-wide uppercase ${style.bg} ${style.text}`}>
                            {n.type.split('_').join(' ')}
                          </div>
                          
                          {/* Mark single as read */}
                          {!n.isRead && (
                            <button
                              onClick={(e) => markAsRead(n.id, e)}
                              className="text-[10px] text-amber-500/80 hover:text-amber-400 flex items-center gap-0.5"
                              title="Mark read"
                            >
                              <Check className="w-3 h-3" />
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions footer view all or audit logs */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-center text-[11px] text-slate-500">
              Amber Royale Enterprise Audit Center
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
