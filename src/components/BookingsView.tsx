import React, { useState } from 'react';
import { Search, Plus, Calendar, ShieldCheck, ShieldAlert, X, AlertOctagon, RefreshCw, KeyRound, ArrowRightLeft, Sparkles } from 'lucide-react';
import { Booking, Room, Customer, BookingStatus } from '../types';

interface BookingsViewProps {
  bookings: Booking[];
  rooms: Room[];
  customers: Customer[];
  isAdmin: boolean;
  currentUser: any;
  onCreateBooking: (booking: { 
    customerId: string; 
    roomNumber: string; 
    checkInDate: string; 
    checkOutDate: string;
    partnerName?: string;
    partnerIdProof?: string;
  }) => Promise<void>;
  onUpdateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  preselectedRoomNumber?: string | null;
  onClearPreselectedRoom?: () => void;
}

export default function BookingsView({ 
  bookings, 
  rooms, 
  customers, 
  isAdmin, 
  currentUser,
  onCreateBooking, 
  onUpdateBookingStatus,
  onDeleteBooking,
  preselectedRoomNumber,
  onClearPreselectedRoom
}: BookingsViewProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form bounds
  const [customerId, setCustomerId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  // Partner/Companion states
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerIdProof, setPartnerIdProof] = useState('');

  // Auto-booking preselection trigger
  React.useEffect(() => {
    if (preselectedRoomNumber) {
      setCustomerId(currentUser.role === 'customer' ? currentUser.customerId || '' : '');
      setRoomNumber(preselectedRoomNumber);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 3);
      
      setCheckInDate(tomorrow.toISOString().split('T')[0]);
      setCheckOutDate(dayAfter.toISOString().split('T')[0]);
      setError('');
      setIsModalOpen(true);
      
      if (onClearPreselectedRoom) {
        onClearPreselectedRoom();
      }
    }
  }, [preselectedRoomNumber, currentUser, onClearPreselectedRoom]);

  // Calculate stats dynamically on client for preview
  const selectedRoom = rooms.find(r => r.roomNumber === roomNumber);
  let computedDays = 0;
  let estimatedTotal = 0;

  if (checkInDate && checkOutDate) {
    const s = new Date(checkInDate);
    const e = new Date(checkOutDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
      const diffTime = Math.abs(e.getTime() - s.getTime());
      computedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (selectedRoom) {
        estimatedTotal = computedDays * selectedRoom.pricePerNight;
      }
    }
  }

  const openReserveModal = () => {
    // If customer, pre-assign their customer id
    setCustomerId(currentUser.role === 'customer' ? currentUser.customerId || '' : '');
    
    // Choose first available room by default if exists
    const firstAvail = rooms.find(r => r.status === 'Available');
    setRoomNumber(firstAvail ? firstAvail.roomNumber : '');
    
    // Setting dates for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    
    setCheckInDate(tomorrow.toISOString().split('T')[0]);
    setCheckOutDate(dayAfter.toISOString().split('T')[0]);
    setHasPartner(false);
    setPartnerName('');
    setPartnerIdProof('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetCustomerId = currentUser.role === 'customer' ? currentUser.customerId : customerId;

    if (!targetCustomerId) {
      setError('Please select a customer profile');
      return;
    }
    if (!roomNumber) {
      setError('Please select a room');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError('Check-in and check-out dates are required');
      return;
    }

    try {
      await onCreateBooking({
        customerId: targetCustomerId,
        roomNumber,
        checkInDate,
        checkOutDate,
        partnerName: hasPartner ? partnerName : undefined,
        partnerIdProof: hasPartner ? partnerIdProof : undefined
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to complete room reservation');
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'Booked': return 'bg-amber-500/10 text-amber-900 border-amber-500/30';
      case 'Checked-In': return 'bg-rose-500/10 text-rose-900 border-rose-500/30';
      case 'Checked-Out': return 'bg-emerald-500/10 text-emerald-900 border-emerald-500/30';
      case 'Cancelled': return 'bg-slate-500/10 text-slate-800 border-slate-500/20';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const filteredBookings = bookings.filter(b => {
    // Safety privacy check for guests
    if (!isAdmin && b.customerId !== currentUser?.customerId) {
      return false;
    }
    const custName = (customers.find(c => c.id === b.customerId)?.name || '').toLowerCase();
    const matchesSearch = custName.includes(search.toLowerCase()) || b.roomNumber.includes(search) || b.id.includes(search);
    return matchesSearch;
  });

  return (
    <div className="space-y-6" id="bookings-view-container">
      {/* Banner Controllers */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="bookings-controls">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings by Guest, Room, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          onClick={openReserveModal}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Reserve Room
        </button>
      </div>

      {/* Bookings List Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden" id="bookings-list-panel">
        <div className="overflow-x-auto">
          <table className="styled-table font-sans animate-fade-in">
            <thead className="text-[10px] text-amber-800 uppercase tracking-widest bg-amber-500/5 border-b border-amber-500/10">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-bold">Booking ID</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Guest Info</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Room No.</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Dates</th>
                <th scope="col" className="px-6 py-3.5 text-center font-bold">Duration</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold text-slate-500">Rent Charged</th>
                <th scope="col" className="px-6 py-3.5 text-center font-bold">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No matching room bookings located.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const cust = customers.find(c => c.id === b.customerId);
                  return (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-amber-500/5 text-slate-600 text-sm transition-all duration-200 group/row">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-800 text-xs">
                        {b.id}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 group-hover/row:text-slate-950">{cust ? cust.name : 'Unknown Guest'}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">{cust ? cust.email : ''}</div>
                        {b.partnerName && (
                          <div className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5 max-w-fit">
                            <span className="text-[10px] uppercase font-black tracking-wider text-amber-800">Partner:</span>
                            <span className="font-semibold text-slate-800">{b.partnerName}</span>
                            {b.partnerIdProof && (
                              <span className="text-[9px] text-slate-500 font-mono">({b.partnerIdProof})</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md text-xs">#{b.roomNumber}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-slate-700">{b.checkInDate}</span>
                          <span className="text-amber-500 font-bold">→</span>
                          <span className="font-semibold text-slate-700">{b.checkOutDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-slate-800">
                        {b.numberOfDays} {b.numberOfDays === 1 ? 'Night' : 'Nights'}
                      </td>
                      <td className="px-6 py-3.5 text-right font-black text-amber-600">
                        ₹{b.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md border ${getStatusColor(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs font-medium">
                          {b.status === 'Booked' && isAdmin && (
                            <button
                              onClick={() => onUpdateBookingStatus(b.id, 'Checked-In')}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-md inline-flex items-center gap-1 transition-all duration-150 border border-rose-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-2xs"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Check-In
                            </button>
                          )}
                          {b.status === 'Checked-In' && isAdmin && (
                            <button
                              onClick={() => onUpdateBookingStatus(b.id, 'Checked-Out')}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-md inline-flex items-center gap-1 transition-all duration-150 border border-emerald-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-2xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Serve & Check-Out
                            </button>
                          )}
                          {(b.status === 'Booked' || b.status === 'Checked-In') && (
                            <button
                              onClick={() => {
                                if(confirm('Are you sure you want to cancel this booking?')) {
                                  onUpdateBookingStatus(b.id, 'Cancelled');
                                }
                              }}
                              className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-md inline-flex items-center gap-1 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          )}
                          {b.status === 'Cancelled' && isAdmin && (
                            <button
                              onClick={() => {
                                if(confirm('Are you sure you want to delete this booking history point?')) {
                                  onDeleteBooking(b.id);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-900 px-2 py-1 transition-colors hover:underline cursor-pointer"
                            >
                              Hard Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Form Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Create Room Reservation
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Guest Profile selector (only for Administrator) */}
              {currentUser.role === 'admin' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Select Guest / Customer *
                  </label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="">-- Choose registered customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="block text-xs font-medium text-slate-400 uppercase">Reserving For</span>
                    <span className="font-bold text-slate-800">{customers.find(c => c.id === currentUser.customerId)?.name || 'Guest'}</span>
                  </div>
                  <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-semibold">Customer Account</span>
                </div>
              )}

              {/* Room selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Assign Room *
                </label>
                <select
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="">-- Select Room Number --</option>
                  {rooms.map(r => (
                    <option 
                      key={r.id} 
                      value={r.roomNumber}
                      disabled={r.status === 'Occupied'}
                    >
                      Room {r.roomNumber} - {r.roomType} (₹{r.pricePerNight} / night) {r.status === 'Occupied' ? '[Occupied]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Companion Toggle & Form Fields */}
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasPartner}
                    onChange={(e) => setHasPartner(e.target.checked)}
                    className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-xs font-semibold text-slate-700">Add Companion / Partner Details</span>
                </label>

                {hasPartner && (
                  <div className="mt-3 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Partner Full Name *
                      </label>
                      <input
                        type="text"
                        required={hasPartner}
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="e.g. Sanjay Kumar"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Partner ID Proof or Contact (Optional)
                      </label>
                      <input
                        type="text"
                        value={partnerIdProof}
                        onChange={(e) => setPartnerIdProof(e.target.value)}
                        placeholder="e.g. Aadhaar, Passport, or Phone Number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Instant Quotation Panel */}
              {selectedRoom && computedDays > 0 && (
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl space-y-2 animate-fade-in" id="price-quote-widget">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Instant reservation quote
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Base Room Rate:</span>
                    <span>₹{selectedRoom.pricePerNight} / night ({selectedRoom.roomType})</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Selected Nights:</span>
                    <span>{computedDays} nights</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-bold text-slate-900 border-t border-amber-200/55 pt-2">
                    <span>Total Estimated Rent:</span>
                    <span className="text-amber-700">₹{estimatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={computedDays <= 0}
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
