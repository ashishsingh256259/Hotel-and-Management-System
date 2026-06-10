import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Megaphone, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  HelpCircle,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  Search,
  Check
} from 'lucide-react';
import { Complaint, Room } from '../types';

interface ComplaintsViewProps {
  complaints: Complaint[];
  rooms: Room[];
  isAdmin: boolean;
  currentUser: any;
  onRefresh: () => void;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  bookings?: any[];
}

export default function ComplaintsView({ complaints, rooms, isAdmin, currentUser, onRefresh, triggerToast, bookings }: ComplaintsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [loading, setLoading] = useState(false);

  // Resolution state
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'In Progress' | 'Resolved'>('Resolved');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Live filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Computing stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  // Extract checked-in guest suite room numbers dynamically
  const guestRooms = bookings
    ? Array.from(new Set(
        bookings
          .filter(b => b.customerId === currentUser?.customerId)
          .map(b => b.roomNumber)
      ))
    : [];

  useEffect(() => {
    if (!isAdmin && guestRooms.length > 0 && !roomNumber) {
      setRoomNumber(guestRooms[0]);
    }
  }, [isAdmin, guestRooms, roomNumber]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !roomNumber) {
      triggerToast('Please complete all complaint requirements.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${window.location.origin}/api/complaints`, {
        title,
        description,
        roomNumber,
        priority
      });
      triggerToast('Your issue log has been submitted. Maintenance will coordinate shortly.', 'success');
      setTitle('');
      setDescription('');
      setRoomNumber('');
      setPriority('Low');
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Failed to file issue report.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await axios.put(`${window.location.origin}/api/complaints/${id}/status`, {
        status,
        resolutionNotes: notes
      });
      triggerToast(`Filing updated: Issue is now ${status}.`, 'success');
      setSelectedComplaintId(null);
      setResolutionNotes('');
      onRefresh();
    } catch (err) {
      triggerToast('Failed to modify file status.', 'error');
    }
  };

  const submitResolutionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    setSubmittingResolution(true);
    try {
      await handleUpdateStatus(selectedComplaintId, resolutionStatus, resolutionNotes);
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!confirm('Are you sure you want to remove this complaint record from database?')) return;
    try {
      await axios.delete(`${window.location.origin}/api/complaints/${id}`);
      triggerToast('Complaint archived and removed from workspace.', 'success');
      onRefresh();
    } catch (err) {
      triggerToast('Failed to delete query record.', 'error');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="complaints-view-wrapper">
      
      {/* Metrics board (Admin) or Welcome banner (Guest) */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="complaints-stats">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="cp-stat-1">
            <div className="w-12 h-12 rounded-xl bg-slate-900/5 text-slate-900 flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Reported Issues</span>
              <span className="text-xl font-black">{totalCount} files</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="cp-stat-2">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-sans">Pending Action</span>
              <span className="text-xl font-black text-rose-600">{pendingCount} alerts</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="cp-stat-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">In Mitigation</span>
              <span className="text-xl font-black text-amber-600">{inProgressCount} active</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="cp-stat-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Resolved Cases</span>
              <span className="text-xl font-black text-emerald-600">{resolvedCount} settled</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="guest-concierge-banner">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black tracking-widest uppercase font-mono">
                🛎️ Guest Concierge Helpdesk
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white font-sans">How may we enhance your stay, {currentUser?.name || 'Valued Guest'}?</h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed font-sans">
              Our 24/7 dedicated suite operations and engineering crew are on standby. Lodge service logs, tech breakdowns, or request customized amenities. Standard dispatch response time is under **12 minutes**.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 font-black text-[10px] uppercase tracking-wider text-white rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            id="guest-trigger-new-ticket"
          >
            <Plus className="w-4 h-4" /> Log Service Ticket
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8" id="complaints-body">
        
        {/* Left section: Complaints index tracker */}
        <div className="flex-1 space-y-4" id="complaints-list-pane">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#fcfcfd]">
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                  {isAdmin ? 'Staff Dispatch Control Center' : 'My Active Concierge Requests'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAdmin 
                    ? 'Manage guest service requests, engineer assignments, and resolution updates' 
                    : 'Real-time status updates of your reported suite tickets'}
                </p>
              </div>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-slate-900 border border-slate-800 text-slate-50 hover:bg-slate-800 transition-colors cursor-pointer"
                  id="toggle-report-form"
                >
                  <Plus className="w-4 h-4" /> File Help Request
                </button>
              )}
            </div>

            {/* Quick search panel */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center" id="cp-search-filters">
              <div className="flex-1 min-w-[200px] flex items-center bg-white border border-slate-200 rounded-lg px-2" id="search-input-box">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-1.5" />
                <input
                  type="text"
                  placeholder={isAdmin ? "Identify suite, guest name, keyword..." : "Search my reported issues..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-1.5 text-xs focus:outline-hidden"
                />
              </div>

              <div id="status-filter-wrapper">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                >
                  <option value="All">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400" id="empty-complaints">
                <FileText className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-bold">No registered feedback files match. </p>
                <p className="text-[11px] text-slate-400">Everything is running smoothly on our physical footprint.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100" id="complaints-scroller">
                {filteredComplaints.map(c => {
                  const isActiveResolve = selectedComplaintId === c.id;
                  return (
                    <div key={c.id} className="p-6 hover:bg-slate-50/40 transition-colors space-y-4" id={`cp-item-${c.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                            Suite {c.roomNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.priority === 'High' 
                              ? 'bg-rose-50 text-rose-700' 
                              : c.priority === 'Medium' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {c.priority} Priority
                          </span>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase font-mono ${
                          c.status === 'Resolved' 
                            ? 'bg-emerald-50 text-emerald-700 font-black' 
                            : c.status === 'In Progress' 
                              ? 'bg-amber-50 text-amber-800 font-bold' 
                              : 'bg-rose-50 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'Resolved' ? 'bg-emerald-500' : c.status === 'In Progress' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {c.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">{c.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.description}</p>
                      </div>

                      {/* Guest context */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-2">
                        <span>Reported by: <strong className="text-slate-600 font-bold">{c.customerName}</strong></span>
                        <span>{new Date(c.createdAt).toLocaleDateString()} &bull; {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>

                      {/* Resolution Log displays */}
                      {c.resolutionNotes && (
                        <div className="p-3.5 bg-slate-50 border-l-2 border-slate-300 rounded-r-xl space-y-1 text-xs" id={`cp-notes-${c.id}`}>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Service resolution notes</span>
                          <p className="text-slate-700 italic font-semibold">&ldquo;{c.resolutionNotes}&rdquo;</p>
                        </div>
                      )}

                      {/* Administrative actions */}
                      {isAdmin && (
                        <div className="flex justify-end gap-1.5 border-t border-slate-50 pt-3" id="admin-actions">
                          {c.status !== 'Resolved' && !isActiveResolve && (
                            <button
                              onClick={() => {
                                setSelectedComplaintId(c.id);
                                setResolutionStatus(c.status === 'Pending' ? 'In Progress' : 'Resolved');
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              id={`coordinate-btn-${c.id}`}
                            >
                              Coordinate Status
                            </button>
                          )}

                          {c.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'In Progress')}
                              className="px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              id={`mitigate-btn-${c.id}`}
                            >
                              Mark In Progress
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteComplaint(c.id)}
                            className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-all cursor-pointer"
                            id={`delete-btn-${c.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Interactive inline resolution form (Admin only) */}
                      {isActiveResolve && (
                        <form onSubmit={submitResolutionForm} className="p-4 bg-amber-50/20 border border-amber-500/10 rounded-xl space-y-3 animate-fade-in" id="resolution-notes-form">
                          <h5 className="text-[11px] text-amber-800 font-black uppercase tracking-wide">Coordinate helpdesk status</h5>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div id="res-status-wrapper">
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Status Target</label>
                              <select
                                value={resolutionStatus}
                                onChange={(e) => setResolutionStatus(e.target.value as any)}
                                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden"
                              >
                                <option value="In Progress">In Progress (Mitigation)</option>
                                <option value="Resolved">Resolved (Settled)</option>
                              </select>
                            </div>

                            <div id="res-notes-input-wrapper">
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Resolution Explanation</label>
                              <input
                                type="text"
                                required
                                placeholder="Details of repair action / refund..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2" id="res-form-actions">
                            <button
                              type="button"
                              onClick={() => setSelectedComplaintId(null)}
                              className="px-3 py-1.5 text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submittingResolution}
                              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              {submittingResolution ? 'Updating..' : 'Submit Dispatch'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right section: Submission complaint form in drawer layout */}
        {showForm && (
          <div className="w-full lg:w-96 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 shrink-0 animate-fade-in" id="complaint-submission-form-wrapper">
            <div className="flex justify-between items-center" id="form-header">
              <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Log Helpdesk Ticket</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Close
              </button>
            </div>
            
            <p className="text-xs text-slate-400">Specify details about service inconsistencies or physical repair breakdowns. Staff will immediately be notified</p>

            <form onSubmit={handleSubmitComplaint} className="space-y-4" id="feedback-post-form">
              <div id="form-title-wrapper">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Brief Title summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Balcony lock is stuck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 font-medium text-slate-700"
                />
              </div>

              <div id="form-room-wrapper" className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400">Target Suite</label>
                {isAdmin ? (
                  <select
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-amber-500 text-slate-700 font-semibold"
                  >
                    <option value="">Choose room..</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>Suite {r.roomNumber} ({r.roomType})</option>
                    ))}
                    <option value="Common Area">Lobby / Garden area</option>
                  </select>
                ) : (
                  <div>
                    {guestRooms.length > 0 ? (
                      <select
                        required
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-indigo-50/50 focus:outline-hidden focus:border-amber-500 font-extrabold text-slate-800"
                      >
                        {guestRooms.map(rm => (
                          <option key={rm} value={rm}>My Occupied Suite - {rm}</option>
                        ))}
                        <option value="Common Area">Hotel Common Area</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="e.g. Suite 101 or Garden"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-500 font-semibold text-slate-700"
                      />
                    )}
                  </div>
                )}
              </div>

              <div id="form-priority-wrapper">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filing Severity LEVEL</label>
                <div className="grid grid-cols-3 gap-2" id="priority-choices">
                  {(['Low', 'Medium', 'High'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 text-[10px] font-black uppercase border rounded-lg transition-colors cursor-pointer ${
                        priority === p 
                          ? 'border-amber-500 bg-amber-50 text-amber-700 font-black' 
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div id="form-description-wrapper">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description detail</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain details of the issue. Be descriptive so engineers can source exact replacement components."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 font-normal leading-relaxed text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="submit-form-btn"
              >
                <Send className="w-3.5 h-3.5" /> {loading ? 'Filing Report..' : 'Submit Help Ticket'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
