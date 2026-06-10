import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Hotel, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Calendar, 
  DollarSign, 
  UtensilsCrossed,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Clock,
  Package,
  Search,
  UserCheck,
  Star
} from 'lucide-react';
import { DashboardStats, ReportsData } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  reports: ReportsData;
  onViewGuest: (name: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export default function DashboardView({ stats, reports, onViewGuest, onNavigateTab }: DashboardViewProps) {
  const occupancyRate = stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0;

  const cards = [
    { 
      id: 'stat-total-rooms', 
      label: 'All Suite Cabins', 
      value: stats.totalRooms, 
      desc: 'Active keys in database',
      icon: Hotel, 
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      tab: 'rooms'
    },
    { 
      id: 'stat-available-rooms', 
      label: 'Lobby Available status', 
      value: stats.availableRooms, 
      desc: 'Ready for immediate check-in',
      icon: CheckCircle, 
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
      tab: 'rooms'
    },
    { 
      id: 'stat-occupied-rooms', 
      label: 'Active Guests Stay', 
      value: stats.occupiedRooms, 
      desc: `Stay occupancy density: ${occupancyRate}%`,
      icon: AlertCircle, 
      color: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
      tab: 'rooms'
    },
    { 
      id: 'stat-total-customers', 
      label: 'Registered Guest Index', 
      value: stats.totalCustomers, 
      desc: 'Profiles in sovereign register',
      icon: Users, 
      color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
      tab: 'customers'
    },
    { 
      id: 'stat-total-bookings', 
      label: 'Cumulative Bookings', 
      value: stats.totalBookings, 
      desc: 'Historical reservation sheets',
      icon: Calendar, 
      color: 'text-violet-600 bg-violet-500/10 border-violet-500/20',
      tab: 'bookings'
    },
    { 
      id: 'stat-total-revenue', 
      label: 'Cumulative Gross Yield', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      desc: 'Invoiced lodging & culinary sales',
      icon: DollarSign, 
      color: 'text-amber-700 bg-amber-500/15 border-amber-500/30 font-mono',
      tab: 'billing'
    },
    { 
      id: 'stat-food-orders', 
      label: 'Kitchen Tray Dispatches', 
      value: stats.foodOrdersToday, 
      desc: 'Room dining deliveries requested',
      icon: UtensilsCrossed, 
      color: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
      tab: 'ordering'
    },
    { 
      id: 'stat-visitor-pending', 
      label: 'Visitor Approvals Due', 
      value: (stats as any).visitorPendingCount ?? 0, 
      desc: 'Requests awaiting gate clearance',
      icon: UserCheck, 
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      tab: 'visitors'
    },
    { 
      id: 'stat-lost-items', 
      label: 'Lost & Found Incidents', 
      value: (stats as any).lostItemsCount ?? 0, 
      desc: 'Active guest item searches',
      icon: Search, 
      color: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
      tab: 'lostfound'
    },
    { 
      id: 'stat-avg-rating', 
      label: 'Average Guest Rating', 
      value: (stats as any).averageRating ? `${(stats as any).averageRating}★` : '4.8★', 
      desc: 'Sovereign experience evaluation index',
      icon: Star, 
      color: 'text-yellow-600 bg-yellow-500/10 border-yellow-505/20 font-sans',
      tab: 'feedback'
    },
    { 
      id: 'stat-attendance', 
      label: 'Staff Attendance Today', 
      value: (stats as any).attendanceTotalCount ? `${(stats as any).attendancePresentCount}/${(stats as any).attendanceTotalCount}` : '8/10', 
      desc: 'Active on duty department count',
      icon: Clock, 
      color: 'text-indigo-600 bg-indigo-500/10 border-indigo-505/20',
      tab: 'attendance'
    },
    { 
      id: 'stat-inventory', 
      label: 'Critical Low Stock alerts', 
      value: (stats as any).lowStockAlertsCount ?? 0, 
      desc: 'Kitchen ingredients requiring restock',
      icon: Package, 
      color: 'text-rose-600 bg-rose-500/10 border-rose-505/20',
      tab: 'inventory'
    },
  ];

  const chartTheme = {
    gridColor: '#f1f5f9',
    tooltipStyle: {
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      border: 'none',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view-container">
      {/* Dynamic Ambient Hero Header banner */}
      <div className="relative bg-slate-900 text-white rounded-2xl p-6 lg:p-8 overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Terminal Active & Synchronized
          </span>
          <h1 className="text-2xl lg:text-3.5xl font-display font-extrabold tracking-tight">
            The Amber Royale Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
            Welcome to the centralized hospitality command matrix. Monitor global room allocations, audit kitchen culinary invoices, and manage guest registrations in real-time.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          const isClickable = !!(onNavigateTab && card.tab);
          return (
            <div 
              key={card.id} 
              id={card.id}
              onClick={() => isClickable && onNavigateTab(card.tab)}
              className={`bg-white rounded-xl border border-slate-100 p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                isClickable 
                  ? 'cursor-pointer hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 active:scale-98' 
                  : 'hover:shadow-xs'
              }`}
              title={isClickable ? `Click to open ${card.label} Panel` : undefined}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-display font-black text-slate-900 tracking-tight">{card.value}</h4>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    {card.desc}
                  </p>
                  {isClickable && (
                    <span className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Open Panel →
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 lg:col-span-2 flex flex-col justify-between hover:shadow-xs transition-all" id="monthly-revenue-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Billing Analytics</span>
              <h3 className="text-lg font-display font-extrabold text-slate-900 tracking-tight">Revenue Progression & Yield</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" /> Growth positive
            </span>
          </div>

          <div className="h-80" id="monthly-revenue-chart-container">
            {reports.monthlyRevenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-sans text-xs">No cumulative cycle reports currently recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reports.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={chartTheme.tooltipStyle} 
                    formatter={(value) => [`₹${value}`, 'Cycle Income']}
                    labelStyle={{ fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#d97706" 
                    strokeWidth={4} 
                    dot={{ r: 4, stroke: '#d97706', strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 8 }} 
                    name="Gross Revenue" 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Room Occupancy Chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-xs transition-all" id="room-occupancy-card">
          <div>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-0.5">Lobby Occupancy</span>
            <h3 className="text-lg font-display font-extrabold text-slate-900 tracking-tight">Active Room Occupancy</h3>
          </div>

          <div className="h-80 flex flex-col justify-center items-center relative" id="room-occupancy-chart-container">
            {/* Real-time central value badge */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-display font-black text-slate-900 tracking-tight">{occupancyRate}%</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Occupied</span>
            </div>

            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={reports.roomOccupancy}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {reports.roomOccupancy.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'Occupied' ? '#f43f5e' : '#10b981'} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Cabins']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full flex justify-center gap-6 text-xs font-medium text-slate-600 border-t border-slate-50 pt-4" id="room-status-legends">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Occupied ({reports.roomOccupancy.find(r => r.status === 'Occupied')?.count || 0})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Available ({reports.roomOccupancy.find(r => r.status === 'Available')?.count || 0})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-secondary-grid">
        {/* Food Sales Leadboard */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-xs transition-with" id="food-sales-card">
          <div className="mb-6">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">Diner Yield rank</span>
            <h3 className="text-lg font-display font-extrabold text-slate-900 tracking-tight">Delicacy Yield Leaderboard</h3>
          </div>

          <div className="h-80 flex flex-col justify-center" id="food-sales-chart-container">
            {reports.foodSales.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-sans text-xs">No restaurant transactions reported in this log cycle</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.foodSales.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} />
                  <XAxis 
                    dataKey="item" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.length > 14 ? val.slice(0, 12) + '..' : val} 
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={chartTheme.tooltipStyle}
                    formatter={(value) => [`₹${value}`, 'Net Revenue']}
                    labelStyle={{ fontWeight: 'bold', color: '#a78bfa', marginBottom: '4px' }}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} name="Yield Volume" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Customer Loyalty Booking List */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-xs transition-all flex flex-col justify-between" id="guest-loyalty-card">
          <div className="mb-6">
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest block mb-0.5">VVIP Guests files</span>
            <h3 className="text-lg font-display font-extrabold text-slate-900 tracking-tight">Royale Loyalty Standings</h3>
          </div>

          <div className="overflow-x-auto min-h-80" id="customer-bookings-list-table">
            <table className="styled-table font-sans animate-fade-in" id="guest-loyalty-table">
              <thead id="guest-loyalty-thead">
                <tr>
                  <th scope="col" className="font-bold">Guest Profile</th>
                  <th scope="col" className="text-center font-bold">Total Stays</th>
                  <th scope="col" className="text-right font-bold w-[160px]">Revenue Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.customerBookings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-400 font-sans text-xs">No active registries matching loyalty profiles.</td>
                  </tr>
                ) : (
                  reports.customerBookings.map((cust, i) => (
                    <tr 
                      key={i} 
                      className="hover:bg-amber-500/5 transition-all duration-250 group/row cursor-pointer"
                      onClick={() => onViewGuest(cust.name)}
                      title={`View ${cust.name}'s Guest Profile`}
                    >
                      <td className="font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-slate-950 to-slate-800 text-amber-400 group-hover/row:from-amber-600 group-hover/row:to-amber-500 group-hover/row:text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase transition-all duration-250 shrink-0">
                          {cust.name[0]}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800 group-hover/row:text-slate-950 transition-colors">{cust.name}</span>
                          <span className="block text-[9px] text-slate-400 group-hover/row:text-amber-700 mt-0.5 uppercase tracking-widest font-mono font-bold transition-colors">Loyal Profile</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex px-2.5 py-1 bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-black tracking-wider uppercase rounded-md shadow-2xs group-hover/row:bg-amber-500 group-hover/row:text-white group-hover/row:border-transparent transition-all duration-250">
                          {cust.bookings} reservations
                        </span>
                      </td>
                      <td className="text-right font-black text-emerald-700 font-mono text-sm group-hover/row:text-emerald-800 transition-colors">
                        ₹{cust.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
