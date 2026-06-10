import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HelpCircle, Sparkles, Check, Archive, AlertTriangle, ArrowRight, Save, Search, Calendar, MapPin } from 'lucide-react';
import { LostItemReport } from '../types';

interface LostFoundViewProps {
  currentUser: any;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
}

export default function LostFoundView({ currentUser, triggerToast }: LostFoundViewProps) {
  const [reports, setReports] = useState<LostItemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Reported' | 'Found' | 'Returned'>('All');

  // Submit report state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [lostLocation, setLostLocation] = useState('');
  const [lostDate, setLostDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [reporting, setReporting] = useState(false);

  // Status Change State
  const [activeRemarkId, setActiveRemarkId] = useState<string | null>(null);
  const [statusRemarks, setStatusRemarks] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/lost-found');
      setReports(res.data);
    } catch (err) {
      triggerToast('Failed to retrieve lost item logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReportItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !lostLocation || !lostDate) {
      triggerToast('Item name, location, and date are required fields', 'error');
      return;
    }

    try {
      setReporting(true);
      const res = await axios.post('/api/lost-found', {
        itemName,
        itemDescription,
        lostLocation,
        lostDate,
        roomNumber: roomNumber || undefined,
        reportedByStaff: isAdmin
      });
      triggerToast('Lost item registered with concierge successfully!', 'success');
      setReports(prev => [res.data, ...prev]);

      // Reset Form fields
      setItemName('');
      setItemDescription('');
      setLostLocation('');
      setLostDate('');
      setRoomNumber('');
    } catch (err) {
      triggerToast('Failed to log lost item report', 'error');
    } finally {
      setReporting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Reported' | 'Found' | 'Returned', remarksVal?: string) => {
    try {
      const res = await axios.put(`/api/lost-found/${id}/status`, {
        status,
        remarks: remarksVal || undefined
      });
      triggerToast(`Item status successfully updated to ${status}!`, 'success');
      setReports(prev => prev.map(item => item.id === id ? { ...item, status, remarks: remarksVal || item.remarks } : item));
      setActiveRemarkId(null);
      setStatusRemarks('');
    } catch (err) {
      triggerToast('Failed to update report status', 'error');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.lostLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.customerName && r.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="lost-found-view">
      {/* Header Info Panel */}
      <div className="bg-[#1e293b] text-white border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-[-10%] top-[-30%] w-[45%] h-[150%] bg-linear-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="text-[9px] uppercase font-black text-amber-400 tracking-widest bg-amber-505/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Royale Concierge Hub
          </span>
          <h2 className="text-xl font-display font-extrabold mt-3 text-white">Lost & Found Incident Desk</h2>
          <p className="text-xs text-slate-455 mt-1 sm:mt-1.5 leading-relaxed">
            Report lost devices, traveler documents, jewelry, or dynamic personal baggage. Our dedicated concierge and housekeeping patrol coordinate hourly Sweeps to catalog, verify and return safe possessions to rightful hosts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register Form */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xs lg:col-span-4 space-y-4">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#0ea5e9] uppercase">incident report</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">Log Possession Loss</h3>
            <p className="text-xs text-slate-400">File a secure incident log sheet to dispatch search crews.</p>
          </div>

          <form onSubmit={handleReportItem} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Item Title / Descriptor *</label>
              <input
                type="text"
                required
                placeholder="e.g. Matte Black Apple iPad Air"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Approx Last Seen Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Resto Patio Pool chairs / Suite Bar"
                value={lostLocation}
                onChange={e => setLostLocation(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Date Misplaced *</label>
                <input
                  type="date"
                  required
                  value={lostDate}
                  onChange={e => setLostDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Stay Suite (Opt)</label>
                <input
                  type="text"
                  placeholder="e.g. 402"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Detailed Description</label>
              <textarea
                placeholder="Provide physical details like leather casing, wallpaper, dynamic serial numbers or keychains..."
                rows={3}
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={reporting}
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-slate-300 font-bold text-xs text-white p-3 rounded-lg transition-colors cursor-pointer"
            >
              {reporting ? 'Posting Loss Ledger...' : 'Dispatch Search Report'}
            </button>
          </form>
        </div>

        {/* Right Column: Reports Directory (Span 8) */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xs lg:col-span-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Incident Registers & Ledger</h3>
              <p className="text-xs text-slate-450">Filter searches, verify lost items claim status, and recover packages.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter tabs */}
              {(['All', 'Reported', 'Found', 'Returned'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer ${
                    statusFilter === tab 
                      ? 'bg-slate-900 text-white border-slate-900 font-black' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, locations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs font-semibold pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] rounded-lg outline-hidden focus:bg-white w-full transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <div className="w-8 h-8 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold font-mono text-slate-450">Searching lost packages registry...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No lost & found logs matched</p>
              <p className="text-[10px] text-slate-400 mt-1">Found goods and security dispatch filings will display here.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredReports.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-105 bg-slate-50/30 hover:bg-slate-50 transition-colors space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{item.itemName}</h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          item.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'Found' ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 font-black animate-pulse' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{item.itemDescription}</p>
                    </div>
                    <span className="text-[8px] font-bold font-mono bg-slate-100 rounded text-slate-450 p-1">ID: {item.id}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-slate-450 uppercase font-black text-[8px]">Lost Area</p>
                        <p className="font-bold text-slate-700">{item.lostLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-slate-450 uppercase font-black text-[8px]">Event Date</p>
                        <p className="font-bold text-slate-700">{item.lostDate}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-450 uppercase font-black text-[8px]">Claimant</p>
                      <p className="font-bold text-slate-705 truncate max-w-[120px]" title={item.customerName}>{item.customerName || 'Anonymous'}</p>
                      <p className="text-[9px] text-slate-400">Rm: {item.roomNumber || 'Lobby area'}</p>
                    </div>

                    <div>
                      <p className="text-slate-450 uppercase font-black text-[8px]">Security Status</p>
                      <p className="font-bold text-slate-700">Source: {item.reportedBy?.toUpperCase() || 'GUEST'}</p>
                    </div>
                  </div>

                  {item.remarks && (
                    <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[10px] text-slate-600">
                      <span className="font-extrabold text-amber-800 uppercase text-[8px] tracking-wider mr-1.5">Physical Audit Remark:</span>
                      {item.remarks}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-[9px] text-slate-450 font-bold italic">Custodian Command Console &bull; Status edits</span>
                      <div className="flex items-center gap-1.5">
                        {item.status === 'Reported' && (
                          <button
                            onClick={() => {
                              setActiveRemarkId(item.id);
                              setStatusRemarks('');
                            }}
                            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-[9px] uppercase px-2.5 py-1 rounded cursor-pointer flex items-center gap-1.5"
                          >
                            Mark As Found
                          </button>
                        )}
                        {item.status === 'Found' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Returned', 'Handed over in person to resident')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase px-2.5 py-1 rounded cursor-pointer flex items-center gap-1.5"
                          >
                            Mark Returned
                          </button>
                        )}
                        {item.status === 'Returned' && (
                          <span className="text-[10px] text-slate-400 font-bold italic">Incident successfully archived and resolved</span>
                        )}
                      </div>
                    </div>
                  )}

                  {activeRemarkId === item.id && (
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2 mt-2">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Recovery Remarks (Where was this found?)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Cleared inside Drawer Suite #402 by maids"
                          value={statusRemarks}
                          onChange={e => setStatusRemarks(e.target.value)}
                          className="bg-white border text-xs border-slate-250 p-2 rounded-md flex-1 outline-hidden"
                        />
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Found', statusRemarks)}
                          className="bg-slate-900 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-slate-950"
                        >
                          <Save className="w-3.5 h-3.5" /> Save State
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
