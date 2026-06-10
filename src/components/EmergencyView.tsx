import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Check, 
  Volume2, 
  User, 
  MapPin, 
  BellRing, 
  Calendar, 
  History, 
  LifeBuoy, 
  Radio, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Smartphone,
  CheckCircle,
  PlusCircle,
  AlertTriangle,
  Siren
} from 'lucide-react';
import { EmergencyAlert, Room } from '../types';

interface EmergencyViewProps {
  alerts: EmergencyAlert[];
  rooms: Room[];
  isAdmin: boolean;
  currentUser: any;
  onRefresh: () => void;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  bookings?: any[];
}

export default function EmergencyView({ 
  alerts, 
  rooms, 
  isAdmin, 
  currentUser, 
  onRefresh, 
  triggerToast,
  bookings 
}: EmergencyViewProps) {
  const [roomNumber, setRoomNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter alerts based on active vs resolved
  const activeAlerts = alerts.filter(a => a.status === 'Active');
  const resolvedAlerts = alerts.filter(a => a.status === 'Resolved');

  // Dynamically extract checked-in suite numbers for current guest
  const guestRooms = bookings
    ? Array.from(new Set(
        bookings
          .filter(b => b.customerId === currentUser?.customerId)
          .map(b => b.roomNumber)
      ))
    : [];

  // Automatically pre-populate room selection on launch for guests
  useEffect(() => {
    if (!isAdmin && guestRooms.length > 0 && !roomNumber) {
      setRoomNumber(guestRooms[0]);
    }
  }, [isAdmin, guestRooms, roomNumber]);

  const handleBroadcastSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber) {
      triggerToast('Please designate a dispatch suite room number.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${window.location.origin}/api/emergency/alert`, {
        roomNumber,
        description: description || 'Instant Emergency Panic Broadcast - Immediate response required.'
      });
      triggerToast(
        isAdmin 
          ? 'Incident alert manually recorded. Security dispatches notified.' 
          : 'CRITICAL ALARM SENT. Emergency services and our concierge crew are responding.', 
        'success'
      );
      setDescription('');
      // If admin, keep roomNumber. If guest, retain prefilled but empty the description
      if (!isAdmin && guestRooms.length > 0) {
        setRoomNumber(guestRooms[0]);
      } else {
        setRoomNumber('');
      }
      onRefresh();
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Failed to broadcast panic dispatch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await axios.put(`${window.location.origin}/api/emergency/alerts/${id}/resolve`, { status: 'Resolved' });
      triggerToast('Distress trigger settled and logged to administrative archive.', 'success');
      onRefresh();
    } catch (err) {
      triggerToast('Failed to resolve panic alert.', 'error');
    }
  };

  // ==========================================
  // RENDER ADMIN SECURITY COMMAND COCKPIT
  // ==========================================
  const renderAdminConsole = () => {
    return (
      <div className="space-y-8 animate-fade-in text-slate-800" id="admin-security-cockpit">
        
        {/* Admin Command Header */}
        <div className="relative bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 lg:p-8 overflow-hidden shadow-xl" id="admin-emergency-banner">
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-450 border border-rose-500/30 text-[10px] font-black tracking-widest uppercase font-mono animate-pulse">
                  🚨 Central Security Command Hub
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase font-mono">
                  Online
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-display font-black tracking-tight text-white flex items-center gap-2 font-sans">
                Crisis & Dispatch Operations Console
              </h1>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Supervise real-time physical safety triggers, coordinate floor marshals, track resolved hotel anomalies, and document walk-in security journals.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="admin-emergency-stats">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="adm-eq-stat-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activeAlerts.length > 0 ? 'bg-rose-500 text-white animate-bounce shadow-lg shadow-rose-500/30' : 'bg-slate-100 text-slate-600'}`}>
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-sans">Active Distress Cues</span>
              <span className={`text-xl font-black ${activeAlerts.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {activeAlerts.length} Redlined
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="adm-eq-stat-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-sans">Cleared Incidents</span>
              <span className="text-xl font-black text-slate-900">{resolvedAlerts.length} Settled</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="adm-eq-stat-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Radio className="w-6 h-6 text-indigo-600 animate-pulse-slow" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-sans">Guards Active</span>
              <span className="text-xl font-black text-slate-900 font-sans">Standby Patrol</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="adm-eq-stat-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-sans">KPI Target</span>
              <span className="text-xl font-black text-slate-900 font-sans">&lt; 12 Mins</span>
            </div>
          </div>
        </div>

        {/* Console Working Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-emergency-grids">
          
          {/* Active alerts radar column */}
          <div className="lg:col-span-2 space-y-6" id="dispatch-radar">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-[#fcfcfd] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                    Live Alarm Broadcast Feed
                  </h3>
                  <p className="text-xs text-slate-400">Immediate action is mandatory. Settle and clear only after emergency unit on-site checkout.</p>
                </div>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col justify-center items-center space-y-4" id="radar-empty-admin">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 font-sans">System Nominal & Quiet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">No active guest distress cues. All surveillance streams indicators are green.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100" id="active-alert-rows">
                  {activeAlerts.map(a => {
                    const elapsedMin = Math.round((Date.now() - new Date(a.createdAt).getTime()) / 60000);
                    return (
                      <div key={a.id} className="p-6 bg-rose-50/40 hover:bg-rose-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6" id={`alert-row-${a.id}`}>
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-mono font-black text-xs">
                              Suite {a.roomNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {elapsedMin <= 0 ? 'Just now' : `${elapsedMin} mins ago`}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5 font-sans leading-none">
                              {a.description || 'Distress Call Raised'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-xs">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> {a.customerName || 'Anonymous Guest'}
                              </span>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Smartphone className="w-3.5 h-3.5" /> {a.phone || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                          <button
                            onClick={() => handleResolveAlert(a.id)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-rose-200 hover:shadow-lg cursor-pointer"
                            id={`btn-clear-sos-${a.id}`}
                          >
                            <Check className="w-4 h-4" /> Settle Alarm
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Administrative incident logger and quick actions */}
          <div className="space-y-6" id="dispatch-actions">
            
            {/* Safe entry logger */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4" id="incident-logger-card">
              <div>
                <h3 className="font-extrabold text-xs tracking-tight text-slate-900 uppercase flex items-center gap-1.5 font-sans">
                  <PlusCircle className="w-4 h-4 text-slate-500" />
                  Manual Incident Logger
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Report walks-ins, building maintenance alarms, or coordinate fire drills.</p>
              </div>

              <form onSubmit={handleBroadcastSOS} className="space-y-4" id="admin-manual-sos-form">
                <div id="admin-sos-room">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Suite / Facility Area</label>
                  <select
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:outline-hidden focus:border-rose-500 text-slate-700 font-semibold"
                  >
                    <option value="">Select placement...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>Suite {r.roomNumber} ({r.roomType})</option>
                    ))}
                    <option value="Lobby Restroom">Lobby Area / Restrooms</option>
                    <option value="Imperial Restaurant">Royal Restaurant & Kitchen</option>
                    <option value="Spa Annex Room">Boutique Spa & Pool Wellness Deck</option>
                    <option value="Executive Gym">Executive Health Center Gym</option>
                  </select>
                </div>

                <div id="admin-sos-desc">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Incident Report Cues</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Water main burst floor 2, security incident"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 text-slate-700 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-400"
                  id="admin-btn-manual-alert"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  {loading ? 'Dispatched..' : 'Dispatch Patrol & Log Incident'}
                </button>
              </form>
            </div>

            {/* Quick response contacts */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3" id="emergency-admin-contacts">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Auxiliary Responders Hotline</h4>
              <div className="space-y-2 text-xs font-semibold text-slate-600 font-sans">
                <div className="flex justify-between items-center py-1 border-b border-slate-250">
                  <span>911 Dispatch Control</span>
                  <span className="font-mono text-slate-900">9-911</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-250">
                  <span>Elite Medical Center</span>
                  <span className="font-mono text-slate-900">+1 (800) 555-5242</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>County Fire Department</span>
                  <span className="font-mono text-slate-900">+1 (800) 555-FIRE</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Panel: Incident logs table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="historical-archive">
          <div className="p-6 border-b border-slate-100 bg-[#fcfcfd] flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Chronological Emergency Log Ledger</h3>
              <p className="text-xs text-slate-400">Complete historical index of past distress triggers resolved by security marshals.</p>
            </div>
          </div>

          {resolvedAlerts.length === 0 ? (
            <div className="p-12 text-center text-slate-450 text-xs" id="empty-history-admin">
              <p className="font-extrabold text-slate-900 font-sans">Archive Log Ledger is Clear</p>
              <p className="text-[10px] text-slate-450 mt-1">No historical emergency reports have been compiled in this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="styled-table font-sans animate-fade-in" id="resolved-alerts-tbl">
                <thead className="text-[10px] text-amber-800 uppercase tracking-widest bg-amber-500/5 border-b border-amber-500/10">
                  <tr>
                    <th className="py-3.5 px-6 font-bold">Timestamp Raised</th>
                    <th className="py-3.5 px-6 font-bold">Suite Number</th>
                    <th className="py-3.5 px-6 font-bold">Distressed Guest</th>
                    <th className="py-3.5 px-6 font-bold">Report details / description</th>
                    <th className="py-3.5 px-6 text-right font-bold">Operational Registry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resolvedAlerts.map(r => (
                    <tr key={r.id} className="hover:bg-amber-500/5 transition-all duration-200 group/row cursor-pointer">
                      <td className="py-3.5 px-6 text-slate-450 font-medium">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-900 font-mono font-black text-sm">
                        Suite {r.roomNumber}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900 group-hover/row:text-slate-950">{r.customerName || 'Anonymous'}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-bold">{r.phone || 'No registered phone'}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 italic">
                        &ldquo;{r.description || 'Instant panic trigger message'}&rdquo;
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-900 text-[10px] font-black tracking-wider uppercase rounded-md border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 font-black cursor-pointer" /> Resolved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  };

  // ==========================================
  // RENDER GUEST EMERGENCY DISPATCH CENTER
  // ==========================================
  const renderGuestConsole = () => {
    const guestActiveAlerts = activeAlerts;
    const hasActiveGuestAlert = guestActiveAlerts.length > 0;

    return (
      <div className="space-y-8 animate-fade-in text-slate-800" id="guest-panic-console">
        
        {/* Guest Reassurance Emergency Header */}
        <div className="p-6 bg-rose-600 text-slate-100 rounded-2xl border border-rose-700 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden" id="guest-emergency-banner">
          <div className="absolute top-[-30%] right-[-10%] w-[40%] h-[180%] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25 text-[10px] font-black tracking-widest uppercase font-mono animate-pulse">
                🛎️ Priority Room Guard Network
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 animate-pulse text-white" /> Do you require urgent emergency assistance?
            </h2>
            <p className="text-xs text-rose-100 max-w-2xl leading-relaxed font-sans">
              Pressing the broadcast distress dial triggers direct security marshals, medical supervisors, and on-shift building directors straight to your suite number. Response dispatch standard is guaranteed under **12 minutes**.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="guest-emergency-split">
          
          {/* Main Panic Button Workspace */}
          <div className="lg:col-span-2 space-y-6" id="panic-button-container">
            
            <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-xs space-y-6" id="guest-panic-panel">
              {/* Alert Warning Cues */}
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2" id="safety-warning-banner">
                <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider flex items-center gap-1.5 leading-none">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Emergency Guidelines
                </h4>
                <p className="text-[11px] text-rose-700 leading-relaxed font-semibold">
                  This triggers direct floor sirens. Limit usage to physical danger, accidents, fire hazards or medical collapses. For standard engineering questions or queries, please use the Hospitality Helpdesk instead.
                </p>
              </div>

              <form onSubmit={handleBroadcastSOS} className="space-y-8" id="guest-panic-dispatch-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div id="guest-sos-suite-field" className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Distress Location Suite</label>
                    {guestRooms.length > 0 ? (
                      <select
                        required
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-indigo-50/50 focus:outline-hidden focus:border-rose-500 font-extrabold text-slate-800"
                      >
                        {guestRooms.map(rm => (
                          <option key={rm} value={rm}>My Occupied Suite - {rm}</option>
                        ))}
                        <option value="Common Area">Hotel Common Area</option>
                      </select>
                    ) : (
                      <select
                        required
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold focus:outline-hidden focus:border-rose-500 text-slate-700"
                      >
                        <option value="">Select suite...</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.roomNumber}>Suite {r.roomNumber} ({r.roomType})</option>
                        ))}
                        <option value="Common Area">Lobby Area / Common Grounds</option>
                      </select>
                    )}
                  </div>

                  <div id="guest-sos-desc-field" className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Brief Nature of incident (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Medical collapse, active water leak"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 text-slate-700 font-semibold"
                    />
                  </div>
                </div>

                {/* Big Red SOS Circle Trigger */}
                <div className="flex flex-col items-center py-6" id="big-red-sos-dial-trigger">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-40 h-40 bg-rose-600 hover:bg-rose-700 border-4 border-rose-300 hover:border-rose-400 text-white rounded-full flex flex-col justify-center items-center cursor-pointer shadow-red transition-all transform hover:scale-105 active:scale-95 text-center p-4 relative animate-pulse-slow"
                    id="dial-red-disk"
                  >
                    <Siren className="w-10 h-10 mb-1 text-white shrink-0 animate-bounce" />
                    <span className="font-mono text-sm font-black tracking-widest block uppercase text-white font-sans">
                      {loading ? 'Dispatched' : 'BROADCAST'}
                    </span>
                    <span className="font-medium text-[8px] uppercase tracking-wider block text-rose-200 font-sans">SOS Panic Signal</span>
                  </button>
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-6 animate-pulse">
                    Click to dispatch help immediately
                  </span>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column: Signal Radar & Personal reports tracker */}
          <div className="space-y-6" id="guest-signal-radar">
            
            {/* Live active indicator */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4" id="radar-cues-guest">
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Emergency Transmission Link</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Your Broadcast Signal Status
                </p>
              </div>

              {!hasActiveGuestAlert ? (
                <div className="p-8 border border-dashed border-emerald-100 bg-emerald-50/20 text-center rounded-xl space-y-2 flex flex-col justify-center items-center" id="empty-active-sos-guest">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center animate-pulse">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Your Suite Line Secured</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">No registered active threats</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3" id="active-guest-dispatches">
                  {guestActiveAlerts.map(ga => (
                    <div key={ga.id} className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-pulse" id={`guest-active-card-${ga.id}`}>
                      <div className="flex justify-between items-center">
                        <span className="bg-rose-600 text-white text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md">
                          Suite {ga.roomNumber}
                        </span>
                        <span className="text-[9px] text-rose-600 font-bold uppercase tracking-widest animate-pulse">
                          Signal Transmitted
                        </span>
                      </div>
                      <p className="text-xs text-rose-900 italic font-semibold">&ldquo;{ga.description}&rdquo;</p>
                      <div className="pt-2 border-t border-rose-200 text-[10px] text-rose-700 font-medium">
                        Help is being dispatched on-site. Sit tight.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous personal resolved history */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3" id="personal-archive-radar">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">My Settled Emergency Calls</h4>
              
              {resolvedAlerts.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-[11px] font-semibold" id="empty-history-guest">
                  No registered past cleared incidents.
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50 space-y-2.5 max-h-56 overflow-y-auto" id="cleared-sos-guest-scroller">
                  {resolvedAlerts.map(ra => (
                    <div key={ra.id} className="pt-2.5 space-y-1 text-xs" id={`cleared-sos-${ra.id}`}>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Suite {ra.roomNumber}</span>
                        <span>{new Date(ra.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-650 italic font-medium truncate">&ldquo;{ra.description}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    );
  };

  return isAdmin ? renderAdminConsole() : renderGuestConsole();
}
