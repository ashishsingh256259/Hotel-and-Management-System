import React, { useState } from 'react';
import axios from 'axios';
import { 
  Sparkle, 
  User, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Wrench, 
  Briefcase,
  Play,
  RotateCcw,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { HousekeepingTask, Room } from '../types';

interface HousekeepingViewProps {
  tasks: HousekeepingTask[];
  rooms: Room[];
  isAdmin: boolean;
  onRefresh: () => void;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function HousekeepingView({ tasks, rooms, isAdmin, onRefresh, triggerToast }: HousekeepingViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const activeCleaners = Array.from(new Set(tasks.map(t => t.assignedTo))).length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const cleaningRoomsCount = rooms.filter(r => r.status === 'Cleaning').length;
  const maintenanceRoomsCount = rooms.filter(r => r.status === 'Maintenance').length;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber || !taskName || !assignedTo) {
      triggerToast('Please complete all file setup details.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${window.location.origin}/api/housekeeping`, {
        roomNumber,
        task: taskName,
        assignedTo,
        priority
      });
      triggerToast(`Task assigned to ${assignedTo} for Suite ${roomNumber}.`, 'success');
      setRoomNumber('');
      setTaskName('');
      setAssignedTo('');
      setPriority('Medium');
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Failed to submit housekeeping task.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: 'In Progress' | 'Completed' | 'Pending') => {
    try {
      await axios.put(`${window.location.origin}/api/housekeeping/${id}`, { status: nextStatus });
      triggerToast(`Job status dispatch: Room task is now ${nextStatus}.`, 'success');
      onRefresh();
    } catch (err: any) {
      triggerToast('Failed to coordinate state translation.', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to remove this housekeeping task log?')) return;
    try {
      await axios.delete(`${window.location.origin}/api/housekeeping/${id}`);
      triggerToast('Task log purged from database index.', 'success');
      onRefresh();
    } catch (err) {
      triggerToast('Failed to drop chore task entry.', 'error');
    }
  };

  const handleRoomStatusManual = async (num: string, nextStatus: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance') => {
    try {
      const targetRoom = rooms.find(r => r.roomNumber === num);
      if (!targetRoom) return;
      await axios.put(`${window.location.origin}/api/rooms/${targetRoom.id}`, { status: nextStatus });
      triggerToast(`Suite ${num} status modified to: ${nextStatus}.`, 'success');
      onRefresh();
    } catch (err) {
      triggerToast('Failed to modify suite status.', 'error');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesSearch = t.roomNumber.includes(searchTerm) || 
                          t.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.task.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="housekeeping-view-wrapper">
      {/* Overview Analytics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="housekeeping-stats">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="hk-stat-1">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Under Cleaning</span>
            <span className="text-xl font-black">{cleaningRoomsCount} Rooms</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="hk-stat-2">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">In Maintenance</span>
            <span className="text-xl font-black">{maintenanceRoomsCount} Rooms</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="hk-stat-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Completed Duties</span>
            <span className="text-xl font-black">{completedCount} tasks</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs" id="hk-stat-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">On-Duty Agents</span>
            <span className="text-xl font-black">{activeCleaners} Staff</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8" id="housekeeping-body">
        {/* Left pane: Active Chores Task Ledger */}
        <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="tasks-pane">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#fcfcfd]">
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Housekeeping Work Ledger</h3>
              <p className="text-xs text-slate-400">Manage, allocate and dispatch operational staff across suites</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-slate-900 text-slate-50 hover:bg-slate-800 transition-colors cursor-pointer"
                id="toggle-add-task"
              >
                <Plus className="w-4 h-4" /> Add Task Request
              </button>
            )}
          </div>

          {/* Quick inline search/filters */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center" id="hk-filters">
            <div className="flex-1 min-w-[200px]" id="search-input-wrapper">
              <input
                type="text"
                placeholder="Search Room, Staff, Task description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2" id="filter-status-wrapper">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div id="filter-priority-wrapper">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddTask} className="p-6 border-b border-slate-100 bg-amber-50/20 space-y-4 animate-fade-in" id="add-task-form">
              <h4 className="text-xs font-black uppercase text-amber-800 tracking-wide flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-amber-500" /> Create Dispatch Cleaning Request
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div id="form-room-select-wrapper">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Room Selection</label>
                  <select
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                    required
                  >
                    <option value="">Select suite..</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>Suite {r.roomNumber} ({r.roomType} - {r.status})</option>
                    ))}
                  </select>
                </div>

                <div id="form-task-desc-wrapper">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Specific Task</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Deep sweep, replace bed linen"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div id="form-assigned-staff-wrapper">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Assign Cleaner</label>
                  <input
                    type="text"
                    required
                    placeholder="Staff name"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div id="form-task-priority-wrapper">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2" id="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-black uppercase bg-slate-900 border border-slate-800 text-slate-50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {loading ? 'Scheduling..' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          )}

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400" id="empty-tasks">
              <Briefcase className="w-12 h-12 mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-bold">No active housekeeping chores found.</p>
              <p className="text-[11px] text-slate-400">All registered suites are cleaned and maintained according to standards.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="tasks-table-wrapper">
              <table className="styled-table font-sans animate-fade-in" id="hk-tasks-table">
                <thead>
                  <tr className="border-b border-amber-500/10 text-[10px] font-black text-amber-800 uppercase tracking-widest bg-amber-500/5">
                    <th className="px-6 py-4">Suite</th>
                    <th className="px-6 py-4">Operational chores</th>
                    <th className="px-6 py-4">Agent Assigned</th>
                    <th className="px-6 py-4">Rank Priority</th>
                    <th className="px-6 py-4">Stay Status</th>
                    <th className="px-6 py-4 text-right">Job coordination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTasks.map(t => {
                    const roomInfo = rooms.find(r => r.roomNumber === t.roomNumber);
                    return (
                      <tr key={t.id} className="hover:bg-amber-500/5 transition-all duration-200 group/row" id={`task-row-${t.id}`}>
                        <td className="px-6 py-4 font-black text-slate-900 font-mono text-sm">
                          Suite {t.roomNumber}
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="font-bold text-slate-800 group-hover/row:text-slate-950">{t.task}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Created: {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-1.5 mt-3 group-hover/row:text-slate-900">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover/row:text-amber-600 transition-colors" />
                          {t.assignedTo}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase border ${
                            t.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-900 border-rose-500/35' 
                              : t.priority === 'Medium' 
                                ? 'bg-amber-500/10 text-amber-900 border-amber-500/35' 
                                : 'bg-slate-500/10 text-slate-800 border-slate-500/20'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border font-mono ${
                            t.status === 'Completed' 
                              ? 'bg-emerald-500/10 text-emerald-950 border-emerald-500/30' 
                              : t.status === 'In Progress' 
                                ? 'bg-indigo-500/10 text-indigo-950 border-indigo-500/30' 
                                : 'bg-amber-500/10 text-amber-955 border-amber-500/35'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-indigo-500' : 'bg-amber-500'
                            }`} />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 matches">
                            {t.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'In Progress')}
                                title="Set In Progress"
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-md transition-all duration-150 hover:scale-[1.1] active:scale-[0.9] cursor-pointer shadow-2xs"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {t.status === 'In Progress' && (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'Completed')}
                                title="Mark Completed"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-805 border border-emerald-200 rounded-md transition-all duration-150 hover:scale-[1.1] active:scale-[0.9] cursor-pointer shadow-2xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {t.status === 'Completed' && (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'Pending')}
                                title="Reopen Task"
                                className="p-1.5 bg-slate-100 hover:bg-slate-600 hover:text-white text-slate-500 border border-slate-200 rounded-md transition-all duration-150 hover:scale-[1.1] active:scale-[0.9] cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                title="Purge Log"
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-250 rounded-md transition-all duration-150 hover:scale-[1.1] active:scale-[0.9] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right pane: Room Maintenance statuses overview */}
        <div className="w-full xl:w-96 bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-6" id="rooms-coordination-pane">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Operational Stay Index</h3>
            <p className="text-xs text-slate-400">Directly synchronize state indices of suite rooms</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="hk-rooms-scroller">
            {rooms.map(r => {
              const taskList = tasks.filter(t => t.roomNumber === r.roomNumber && t.status !== 'Completed');
              return (
                <div key={r.id} className="p-3 bg-slate-55 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex items-center justify-between gap-3 text-xs" id={`hk-room-card-${r.roomNumber}`}>
                  <div>
                    <h5 className="font-black text-slate-900 font-mono">Suite {r.roomNumber}</h5>
                    <p className="text-[10px] text-slate-400">{r.roomType} &bull; Capacity: {r.capacity}</p>
                    
                    {taskList.length > 0 ? (
                      <span className="inline-flex mt-1 text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm">
                        {taskList.length} active logs
                      </span>
                    ) : (
                      <span className="inline-flex mt-1 text-[9px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded-sm">
                        Clean & Sanitized
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {/* Status badges */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase font-mono ${
                      r.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700'
                        : r.status === 'Occupied'
                          ? 'bg-rose-50 text-rose-700'
                          : r.status === 'Cleaning'
                            ? 'bg-amber-50 text-amber-700 animate-pulse'
                            : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {r.status}
                    </span>

                    {/* Change index actions (Managers Only) */}
                    {isAdmin && (
                      <select
                        value={r.status}
                        onChange={(e) => handleRoomStatusManual(r.roomNumber, e.target.value as any)}
                        className="text-[9px] bg-slate-50 border border-slate-200 px-1 py-0.5 rounded-md text-slate-500 font-bold focus:outline-hidden"
                      >
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
