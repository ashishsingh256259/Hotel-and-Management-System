import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar, 
  Coffee, 
  DollarSign, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  BellRing,
  Hotel,
  Activity,
  UtensilsCrossed,
  FileText
} from 'lucide-react';
import { Booking, Bill, FoodOrder, Customer, Room } from '../types';

interface GuestDashboardViewProps {
  currentUser: any;
  bookings: Booking[];
  bills: Bill[];
  foodOrders: FoodOrder[];
  customers: Customer[];
  rooms: Room[];
  setActiveTab: (tab: string) => void;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
}

interface ConciergeRequest {
  id: string;
  type: string;
  timestamp: string;
  status: 'Pending' | 'Dispatched' | 'Completed';
  icon: any;
}

export default function GuestDashboardView({
  currentUser,
  bookings,
  bills,
  foodOrders,
  customers,
  rooms,
  setActiveTab,
  triggerToast
}: GuestDashboardViewProps) {
  const [greeting, setGreeting] = useState('Welcome');
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [requestProgress, setRequestProgress] = useState(0);
  const [localRequests, setLocalRequests] = useState<ConciergeRequest[]>([]);

  // Calculate dynamic greeting on load
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Customer calculations
  const guestProfile = customers.find(c => c.id === currentUser.customerId);
  const myBookings = bookings.filter(b => b.customerId === currentUser.customerId);
  const myInvoices = bills.filter(b => b.customerId === currentUser.customerId);
  const myOrders = foodOrders.filter(o => o.customerId === currentUser.customerId);

  // Active or upcoming stay calculation
  const currentCheckedInStay = myBookings.find(b => b.status === 'Checked-In');
  const upcomingStay = myBookings.find(b => b.status === 'Booked');
  
  const featuredStay = currentCheckedInStay || upcomingStay;
  const stayRoom = featuredStay ? rooms.find(r => r.roomNumber === featuredStay.roomNumber) : null;

  // Invoice calculations
  const outstandingInvoices = myInvoices.filter(b => b.status === 'Unpaid');
  const outstandingAmount = outstandingInvoices.reduce((sum, b) => sum + b.grandTotal, 0);

  // Active food orders
  const activeOrders = myOrders.filter(o => o.status === 'Pending');

  // Trigger quick concierge request simulated flows
  const handleConciergeRequest = (requestName: string, icon: any) => {
    if (activeRequest) {
      triggerToast('A concierge service is currently already en route, please stand by!', 'error');
      return;
    }

    setActiveRequest(requestName);
    setRequestProgress(0);
    triggerToast(`Submitting request for "${requestName}" to front lobby desk...`, 'success');

    // Simulate concierge dispatch sequence
    const interval = setInterval(() => {
      setRequestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setActiveRequest(null);
            
            // Add to simulated local request queue
            const newReq: ConciergeRequest = {
              id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
              type: requestName,
              timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              status: 'Dispatched',
              icon
            };
            setLocalRequests(prevList => [newReq, ...prevList]);
            
            triggerToast(`The lobby dispatch has completed. "${requestName}" is en route to Suite #${featuredStay?.roomNumber || 'Lobby'}!`, 'success');
          }, 1000);
          return 1000;
        }
        return prev + 25;
      });
    }, 450);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="guest-dashboard-view">
      {/* 1. WARM DYNAMIC HERO HEADER */}
      <div className="relative bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 lg:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-[-40%] right-[-10%] w-[50%] h-[180%] bg-linear-to-bl from-amber-500/20 to-transparent rounded-full blur-[110px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Royale Sovereign Tier &bull; Private Portal
            </span>
            <h1 className="text-2xl lg:text-3.5xl font-display font-extrabold tracking-tight">
              {greeting}, {guestProfile?.name || currentUser.username}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
              Experience personalized luxury at The Amber Royale. Monitor your reserved suites, order elite room dining, view statements, and interface directly with our dedicated lobby digital butler.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm border border-amber-500/20">
              {featuredStay ? `#${featuredStay.roomNumber}` : 'G'}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Current Residence</p>
              <p className="text-xs font-bold text-slate-200">
                {featuredStay ? `Suite Cabin ${featuredStay.roomNumber}` : 'No Active Room Checked-In'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="guest-stats-grid">
        {/* Metric 1 */}
        <div 
          onClick={() => setActiveTab('bookings')}
          className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer relative group overflow-hidden"
          title="Click to view reservations"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Booked Stays</span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-display font-black text-slate-900">{myBookings.length}</h4>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                Historical reservations saved
              </p>
              <span className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Open Panel →
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => setActiveTab('rooms')}
          className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-355 hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer relative group overflow-hidden"
          title="Click to browse suites"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Stay Status</span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-display font-bold text-slate-900">
              {currentCheckedInStay ? 'Checked In' : upcomingStay ? 'Confirmed Booked' : 'No Active Stay'}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentCheckedInStay ? 'bg-emerald-500' : 'bg-slate-350'}`} />
                {currentCheckedInStay ? 'Residence active' : 'Waiting at lobby pool'}
              </p>
              <span className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Open Panel →
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setActiveTab('ordering')}
          className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-355 hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer relative group overflow-hidden"
          title="Click to order room service"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tray Orders</span>
            <div className="p-2 rounded-lg bg-pink-50 border border-pink-100 text-pink-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-display font-black text-slate-900">{activeOrders.length}</h4>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeOrders.length > 0 ? 'bg-pink-500 animate-ping' : 'bg-slate-355'}`} />
                Orders culinary process queue
              </p>
              <span className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Open Panel →
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => setActiveTab('billing')}
          className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-355 hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer relative group overflow-hidden"
          title="Click to view payments invoices"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Bill</span>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-display font-black text-amber-700 font-mono">₹{outstandingAmount.toFixed(2)}</h4>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${outstandingAmount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {outstandingAmount > 0 ? `${outstandingInvoices.length} unpaid bill cycle` : 'Perfect credit summary'}
              </p>
              <span className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Open Panel →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL GRID: RESIDENCE TIMELINE & CONCIERGE BUTLER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Stay Residence Info */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 lg:col-span-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Your Reservation</span>
                <h3 className="text-lg font-display font-extrabold text-slate-905">Suite & Stay Chronology</h3>
              </div>
              <Compass className="w-5 h-5 text-slate-300 shrink-0" />
            </div>

            {featuredStay ? (
              <div className="space-y-6">
                {/* Visual Cards details */}
                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {stayRoom?.imageUrl ? (
                    <img 
                      src={stayRoom.imageUrl} 
                      alt="Reserved Suite Cabin" 
                      className="w-16 h-16 rounded-lg object-cover shrink-0 shadow-xs border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                      #{featuredStay.roomNumber}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900">Suite Cabin #{featuredStay.roomNumber}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                        featuredStay.status === 'Checked-In' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {featuredStay.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Type: <span className="font-semibold text-slate-700">{stayRoom?.roomType || 'Deluxe Royale Unit'}</span> &bull; {stayRoom?.capacity} Guests Allowed
                    </p>
                    <p className="text-xs font-mono font-bold text-amber-600">₹{stayRoom?.pricePerNight} / Nightly rent</p>
                    {featuredStay.partnerName && (
                      <div className="text-xs text-amber-900 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1 max-w-fit mt-1 flex items-center gap-1.5 font-medium">
                        <span className="text-[10px] uppercase font-black text-amber-800">Companion:</span>
                        <span className="font-bold text-slate-800">{featuredStay.partnerName}</span>
                        {featuredStay.partnerIdProof && (
                          <span className="text-[9px] text-slate-500 font-mono">({featuredStay.partnerIdProof})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline display */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-450 uppercase tracking-wider">Lobby Arrival</span>
                      <span className="text-slate-800 text-sm mt-1">{featuredStay.checkInDate}</span>
                    </div>
                    
                    <div className="flex-1 flex items-center px-4">
                      <div className="w-full relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full bg-amber-600 rounded-full ${
                            featuredStay.status === 'Checked-In' ? 'w-2/3' : 'w-1/6 animate-pulse'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-slate-450 uppercase tracking-wider">Departure Departure</span>
                      <span className="text-slate-800 text-sm mt-1">{featuredStay.checkOutDate}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-500/10 flex items-start gap-3">
                    <Clock className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Chronology Stay Summary</p>
                      <p className="text-xs text-amber-805 mt-0.5 leading-relaxed font-medium">
                        Total {featuredStay.numberOfDays} stays registered. {featuredStay.status === 'Checked-In' ? 'You are successfully checked in. Have an absolute lovely stay with us.' : 'Your reservation has been locked in database registry. Check-in starts at 14:00.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-4">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <p className="font-bold text-slate-700 text-sm">No Active Registrations Saved</p>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
                    You do not currently have any rooms rented or upcoming bookings queued.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors inline-block"
                >
                  Configure New Reservation
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-4" id="home-shortcuts-row">
            <button
              onClick={() => setActiveTab('rooms')}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all text-left"
            >
              Browse Catalog <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('ordering')}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all text-left"
            >
              Order Room Service <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className="px-4 py-2 bg-slate-550/10 hover:bg-slate-550/20 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all text-left"
            >
              View My Invoices <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Side: Concierge Butler & Simulator Request panel */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 lg:col-span-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div>
                <span className="text-[10px] font-black text-rose-605 uppercase tracking-widest block mb-0.5">Concierge Requests</span>
                <h3 className="text-lg font-display font-extrabold text-slate-900">Virtual Butler Dispatch</h3>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            </div>

            {/* Simulated request progress bar */}
            {activeRequest && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 animate-pulse space-y-2">
                <div className="flex justify-between items-center text-xs text-amber-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 animate-spin" /> Dispatching: {activeRequest}
                  </span>
                  <span>{requestProgress}%</span>
                </div>
                <div className="w-full bg-amber-100/60 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full transition-all duration-300" style={{ width: `${requestProgress}%` }} />
                </div>
                <p className="text-[10px] text-amber-700">Lobby coordinator registering suite demand. Dispatching butler...</p>
              </div>
            )}

            {/* Quick action buttons matrix */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Instant Butler Paging</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleConciergeRequest('Extra Clean Towels', BellRing)}
                  disabled={!featuredStay}
                  className="bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 p-3 rounded-lg text-left text-xs font-semibold flex flex-col items-start gap-1 justify-between transition-all group disabled:cursor-not-allowed group"
                >
                  <BellRing className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-800 font-bold mt-2">Extra Towels</span>
                  <span className="text-[9px] text-slate-400 font-medium">Delivered to Suite</span>
                </button>

                <button
                  onClick={() => handleConciergeRequest('Morning Coffee Set', Coffee)}
                  disabled={!featuredStay}
                  className="bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 p-3 rounded-lg text-left text-xs font-semibold flex flex-col items-start gap-1 justify-between transition-all group disabled:cursor-not-allowed group"
                >
                  <Coffee className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-800 font-bold mt-2">Morning Coffee</span>
                  <span className="text-[9px] text-slate-400 font-medium">Lobby barista brew</span>
                </button>

                <button
                  onClick={() => handleConciergeRequest('Housekeeping Cleanup', Sparkles)}
                  disabled={!featuredStay}
                  className="bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 p-3 rounded-lg text-left text-xs font-semibold flex flex-col items-start gap-1 justify-between transition-all group disabled:cursor-not-allowed group"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-800 font-bold mt-2">Suite Cleaning</span>
                  <span className="text-[9px] text-slate-400 font-medium">Immediate vacuum</span>
                </button>

                <button
                  onClick={() => handleConciergeRequest('Late Departure Request', Calendar)}
                  disabled={!featuredStay}
                  className="bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 p-3 rounded-lg text-left text-xs font-semibold flex flex-col items-start gap-1 justify-between transition-all group disabled:cursor-not-allowed group"
                >
                  <Calendar className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-800 font-bold mt-2">Late Checkout</span>
                  <span className="text-[9px] text-slate-400 font-medium">Extension to 14:00</span>
                </button>
              </div>

              {!featuredStay && (
                <p className="text-[10px] text-rose-600 mt-3 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> Checkout dispatcher requires an active suite reservation first.
                </p>
              )}
            </div>

            {/* History of Local Requests */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Dispatch Log</span>
              <div className="space-y-2 pr-1 max-h-40 overflow-y-auto">
                {localRequests.length === 0 ? (
                  <p className="text-center text-[11px] py-4 text-slate-405 border border-dashed border-slate-100 rounded-lg">
                    Butler pager history clears automatically on refresh
                  </p>
                ) : (
                  localRequests.map(r => {
                    const ReqIcon = r.icon;
                    return (
                      <div key={r.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-amber-50 text-amber-600">
                            <ReqIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{r.type}</p>
                            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wide">{r.id} &bull; {r.timestamp}</span>
                          </div>
                        </div>
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-150 gap-1 items-center">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Complete
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
