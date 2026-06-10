import React, { useState, useEffect } from 'react';
import { MaintenanceRequest, Employee, Room } from '../types';
import { Hammer, Plus, Shield, Search, Filter, AlertTriangle, Check, RefreshCw, Clock, User, X, Trash2 } from 'lucide-react';

interface MaintenanceViewProps {
  currentUser: {
    id: string;
    username: string;
    role: 'admin' | 'customer';
    employeeRole?: string;
  };
  rooms: Room[];
  triggerToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  onRefresh?: () => void;
}

export default function MaintenanceView({ currentUser, rooms, triggerToast, onRefresh }: MaintenanceViewProps) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Form input states
  const [roomNumber, setRoomNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [notes, setNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/maintenance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMaintenance();
    fetchStaff();
  }, []);

  const resetForm = () => {
    setRoomNumber('');
    setIssueDescription('');
    setPriority('Medium');
    setAssignedStaffId('');
    setNotes('');
    setResolveStatus('Pending');
    setSelectedRequest(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber || !issueDescription) {
      triggerToast('Validation Error', 'Please choose a correct room number and describe the problem.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomNumber, issueDescription, priority, assignedStaffId })
      });

      if (res.ok) {
        triggerToast('Request Raised', `Room ${roomNumber} scheduled for maintenance completely.`, 'success');
        setShowAddModal(false);
        resetForm();
        fetchMaintenance();
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        triggerToast('Booking Blocked', err.error || 'Server error', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection Lost', 'Could not save report.', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/maintenance/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: resolveStatus, notes, assignedStaffId, priority })
      });

      if (res.ok) {
        triggerToast('Log Updated', 'Request status and resolver logs successfully updated.', 'success');
        setSelectedRequest(null);
        resetForm();
        fetchMaintenance();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, roomNum: string) => {
    if (!window.confirm(`Are you sure you want to delete the maintenance record for Room ${roomNum}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerToast('Record Removed', 'Maintenance log removed from ledgers.', 'success');
        fetchMaintenance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectForEdit = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setResolveStatus(req.status);
    setNotes(req.notes || '');
    setAssignedStaffId(req.assignedStaffId || '');
    setPriority(req.priority);
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadge = (sta: string) => {
    switch (sta) {
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" id="maintenance_system_view_wrapper">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-900 shadow-md">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <Hammer className="w-6 h-6 text-amber-500" />
            Room Maintenance Scheduling
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            File rooms as Under Maintenance. This prevents reservations, triggers alerts, and supports auto-releasing rooms upon completion.
          </p>
        </div>
        <div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all duration-200 text-xs tracking-wide flex items-center gap-2 shadow-md hover:scale-[1.02] focus:scale-1 cursor-pointer"
            id="raise_maintenance_request_button"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            SCHEDULE REPAIR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="maintenance_panel_layout">
        {/* Left main view lists active jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <h3 className="text-sm font-bold font-display tracking-tight text-slate-300">Outstanding Maintenance Logs ({requests.length})</h3>
            <button 
              onClick={fetchMaintenance} 
              className="p-1 px-2 text-[11px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors bg-slate-900 rounded border border-slate-800"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              RELOAD
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-950/20 rounded-xl border border-slate-900">
              <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-medium">Syncing structural damage repair indexes...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center bg-slate-950/20 rounded-xl border border-slate-900/60 text-slate-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              <p className="text-xs font-bold text-slate-400">All Guest Rooms are Fully Functioning</p>
              <p className="text-[10px] text-slate-600 mt-0.5">No maintenance issues raised or outstanding.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1" id="maintenance_requests_list">
              {requests.map(req => (
                <div 
                  key={req.id}
                  onClick={() => selectForEdit(req)}
                  className={`bg-slate-950/80 border rounded-xl p-4 cursor-pointer hover:border-slate-700/80 transition-all ${
                    selectedRequest?.id === req.id ? 'border-amber-500/80 ring-1 ring-amber-500/20' : 'border-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-display text-white">Room {req.roomNumber}</span>
                        <span className={`text-[9.5px] font-bold py-0.5 px-2 rounded-full border ${getPriorityBadge(req.priority)}`}>
                          {req.priority} PRIORITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 font-medium">{req.issueDescription}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[9.5px] font-bold py-0.5 px-2.5 rounded border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(req.id, req.roomNumber); }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Assignments and completion records */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 border-t border-slate-900 mt-3 pt-2 font-mono">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Repair: <strong className="text-slate-300">{req.assignedStaffName || 'Unassigned'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Raised: {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    {req.notes && (
                      <div className="w-full text-[10px] text-amber-500/80 bg-slate-900/60 border border-slate-800/80 p-2 rounded mt-2 font-sans italic">
                        &quot;{req.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right segment is inspector card details resolver log */}
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 shadow-md h-fit">
          <h3 className="text-sm font-bold font-display tracking-tight text-white pb-3 border-b border-slate-900 flex items-center gap-1.5">
            <Hammer className="w-4 h-4 text-amber-500" />
            Duty Inspector Desk
          </h3>

          {selectedRequest ? (
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Inspecting Room {selectedRequest.roomNumber}</p>
                <p className="text-xs text-white italic font-bold">&quot;{selectedRequest.issueDescription}&quot;</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Current Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e: any) => setResolveStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed (Auto Available)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Assign Maintenance Specialist</label>
                <select
                  value={assignedStaffId || ''}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                >
                  <option value="">-- Unassigned --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Escalate Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Maintenance & Repair Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100 focus:ring-1 focus:ring-amber-500/20"
                  placeholder="Describe parts replaced or housekeeping clearance completion notes..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="w-1/2 py-2 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-400 border border-slate-800 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] tracking-wide flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  COMMIT DUTY
                </button>
              </div>
            </form>
          ) : (
            <div className="py-20 text-center text-slate-600">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-800" />
              <p className="text-xs">Click on any outstanding request card on the left to inspect, allocate staff, or complete the room repair order.</p>
            </div>
          )}
        </div>
      </div>

      {/* Raising a new scheduled maintenance modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
              <h3 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-amber-500" />
                Schedule Room Maintenance
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Select Suite Room</label>
                <select
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>Room {r.roomNumber} ({r.roomType} - {r.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Issue Description</label>
                <textarea
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100 focus:ring-1 focus:ring-amber-500/20"
                  placeholder="Describe mechanical faults, water drainage failures, or paint repairs..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Urgency Level</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Duty Hand</label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  >
                    <option value="">-- Unassigned --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400">
                ⚠️ booking constraints: setting a room to Under Maintenance automatically prevents bookings from customers, frees occupancies, and locks reservation checks.
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  COMMIT ISSUE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
