import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, LogIn, LogOut, CheckCircle, ShieldCheck, UserPlus, Search, Calendar, Users, Briefcase } from 'lucide-react';
import { EmployeeAttendance } from '../types';

interface AttendanceViewProps {
  currentUser: any;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
}

export default function AttendanceView({ currentUser, triggerToast }: AttendanceViewProps) {
  const [attendance, setAttendance] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Employee terminal state
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Front Desk');
  const [submitting, setSubmitting] = useState(false);

  // Custom logging form
  const [logEmpId, setLogEmpId] = useState('');
  const [logEmpName, setLogEmpName] = useState('');
  const [logEmpRole, setLogEmpRole] = useState('Kitchen Chef');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState<'Present' | 'Absent'>('Present');
  const [logInTime, setLogInTime] = useState('');
  const [logOutTime, setLogOutTime] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/attendance');
      setAttendance(res.data);
    } catch (err) {
      triggerToast('Failed to pull attendance roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !empName) {
      triggerToast('Employee ID and Full Name are required to check-in', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/attendance/check-in', {
        employeeId: empId,
        employeeName: empName,
        role: empRole
      });
      triggerToast(`Welcome ${empName}! Your clock-in has been validated at ${res.data.checkInTime}.`, 'success');
      
      // Refresh list
      setAttendance(prev => [res.data, ...prev]);
      setEmpId('');
      setEmpName('');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to check-in';
      triggerToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) {
      triggerToast('Employee ID is required to register clock-out', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/attendance/check-out', {
        employeeId: empId
      });
      triggerToast(`Goodbye! Checked-out successful at ${res.data.checkOutTime}.`, 'success');
      
      // Update local list
      setAttendance(prev => prev.map(a => (a.employeeId === empId && a.date === res.data.date) ? res.data : a));
      setEmpId('');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to clock-out';
      triggerToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logEmpId || !logEmpName || !logDate) {
      triggerToast('Please complete required parameters', 'error');
      return;
    }

    try {
      const res = await axios.post('/api/attendance/log', {
        employeeId: logEmpId,
        employeeName: logEmpName,
        role: logEmpRole,
        date: logDate,
        status: logStatus,
        checkInTime: logInTime || undefined,
        checkOutTime: logOutTime || undefined
      });

      triggerToast('Attendance record logged successfully into administrative files', 'success');
      setAttendance(prev => [res.data, ...prev]);
      
      // Clear manual logging fields
      setLogEmpId('');
      setLogEmpName('');
      setLogInTime('');
      setLogOutTime('');
    } catch (err) {
      triggerToast('Failed to insert custom attendance record', 'error');
    }
  };

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = a.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const activeOnDutyCount = attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Present' && !a.checkOutTime).length;

  return (
    <div className="space-y-6 animate-fade-in" id="attendance-view">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-150 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active On-Duty Staff</p>
            <h4 className="text-2xl font-black text-indigo-600 mt-1">{activeOnDutyCount} Employees</h4>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5 mx-auto" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-150 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Roster Filter Date</p>
            <h4 className="text-xl font-extrabold text-slate-800 mt-1">{dateFilter}</h4>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar className="w-5 h-5 mx-auto" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-150 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Roster Records Count</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{filteredAttendance.length} Checked</h4>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Clock className="w-5 h-5 mx-auto" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clock Punch-in Terminal */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Clock terminal Punch */}
          <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-xs space-y-4">
            <div>
              <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">Workforce terminal</span>
              <h3 className="text-sm font-extrabold text-slate-900 mt-1">Lobby Time Clock</h3>
              <p className="text-xs text-slate-450">Punch-in when commencing shift or punch-out upon checkout.</p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Employee ID Codes *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP001"
                  value={empId}
                  onChange={e => setEmpId(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Full Name * (For Check-In)</label>
                <input
                  type="text"
                  placeholder="e.g. Rachel Adams"
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Designated Role Department</label>
                <select
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all text-slate-705"
                >
                  <option value="Front Desk Receptionist">Front Desk Receptionist</option>
                  <option value="Lobby Conciege Butler">Lobby Conciege Butler</option>
                  <option value="Kitchen Chef Executive">Kitchen Chef Executive</option>
                  <option value="Housekeeping Sweeper">Housekeeping Sweeper</option>
                  <option value="System Audit Analyst">System Audit Analyst</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCheckIn}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 font-bold text-xs text-white py-3 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" /> Clock-In
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCheckOut}
                  className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-355 font-bold text-xs text-white py-3 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" /> Clock-Out
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Admin manual overrides */}
          {isAdmin && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#6366f1] uppercase">Audit override</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">Manual Sheet Entry</h3>
                <p className="text-xs text-slate-450">Overwrite clockings, record sick leaves, or missed punches.</p>
              </div>

              <form onSubmit={handleAddManualLog} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Emp ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="EMP44"
                      value={logEmpId}
                      onChange={e => setLogEmpId(e.target.value.toUpperCase())}
                      className="w-full text-xs font-semibold bg-white border border-slate-250 rounded-lg p-2 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Role Dept *</label>
                    <select
                      value={logEmpRole}
                      onChange={e => setLogEmpRole(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-250 rounded-lg p-2 outline-hidden text-[#6366f1]"
                    >
                      <option value="Front Desk">Front Desk</option>
                      <option value="Butler">Butler</option>
                      <option value="Kitchen Chef">Kitchen Chef</option>
                      <option value="Housekeeping">Housekeeping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rachel Green"
                    value={logEmpName}
                    onChange={e => setLogEmpName(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-250 rounded-lg p-2 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Target Date *</label>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={e => setLogDate(e.target.value)}
                      className="w-full text-xs font-semibold bg-white border border-slate-250 rounded-lg p-2 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Shift Status</label>
                    <select
                      value={logStatus}
                      onChange={e => setLogStatus(e.target.value as any)}
                      className="w-full text-xs font-bold bg-white border border-slate-250 rounded-lg p-2 outline-hidden text-emerald-600"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                </div>

                {logStatus === 'Present' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Clock In</label>
                      <input
                        type="text"
                        placeholder="09:00 AM"
                        value={logInTime}
                        onChange={e => setLogInTime(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-250 rounded-lg p-2 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Clock Out</label>
                      <input
                        type="text"
                        placeholder="05:00 PM"
                        value={logOutTime}
                        onChange={e => setLogOutTime(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-250 rounded-lg p-2 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs py-2 px-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Back-date Logs Sheet
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Attendance lists (Span 8) */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xs lg:col-span-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4 animate-fade-in">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Workforce Punch Cards Ledger</h3>
              <p className="text-xs text-slate-450">Review clock logs, dates, and active Receptionist/Butler schedules.</p>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Roster Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="text-xs font-bold px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg outline-hidden text-[#6366f1]"
                />
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Employee ID, name, or role department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs font-semibold pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#6366f1] rounded-lg outline-hidden focus:bg-white w-full transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold font-mono text-slate-450">Loading rosters...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-505">Roster sheet empty for this date</p>
              <p className="text-[10px] text-slate-400 mt-1">No personnel punched in or logged attendance records on {dateFilter} yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Staff Employee</th>
                    <th className="py-2.5">Department</th>
                    <th className="py-2.5">Date Sheet</th>
                    <th className="py-2.5">Punch-In</th>
                    <th className="py-2.5">Punch-Out</th>
                    <th className="py-2.5 text-center">Roster Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {filteredAttendance.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase font-mono">
                          {a.employeeName[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{a.employeeName}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Code: {a.employeeId}</p>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-slate-600">
                        <div className="flex items-center gap-1 text-slate-650">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {a.role}
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-500 font-semibold">{a.date}</td>
                      <td className="py-3 text-emerald-600 font-extrabold font-mono text-xs">{a.checkInTime || '--:--'}</td>
                      <td className="py-3 text-indigo-600 font-extrabold font-mono text-xs">{a.checkOutTime || '--:--'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {a.status}
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
    </div>
  );
}
