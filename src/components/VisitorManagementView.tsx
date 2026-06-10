import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileCheck, Ban, Clock, ShieldCheck, UserCheck, Calendar, Search } from 'lucide-react';
import { VisitorRequest } from '../types';

interface VisitorManagementViewProps {
  currentUser: any;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
}

export default function VisitorManagementView({ currentUser, triggerToast }: VisitorManagementViewProps) {
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guest Request Form Fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [idProofType, setIdProofType] = useState('DL');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/visitors');
      setVisitors(res.data);
    } catch (err) {
      triggerToast('Failed to load visitor requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone || !visitDate) {
      triggerToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/visitors', {
        visitorName,
        visitorPhone,
        idProofType,
        idProofNumber,
        purpose,
        visitDate
      });
      triggerToast('Visitor request submitted successfully!', 'success');
      setVisitors(prev => [res.data, ...prev]);
      
      // Reset form
      setVisitorName('');
      setVisitorPhone('');
      setIdProofNumber('');
      setPurpose('');
      setVisitDate('');
    } catch (err) {
      triggerToast('Failed to submit visitor request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await axios.put(`/api/visitors/${id}/status`, { status });
      triggerToast(`Visitor request successfully ${status.toLowerCase()}!`, 'success');
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, status, approvedAt: status === 'Approved' ? new Date().toISOString() : undefined } : v));
    } catch (err) {
      triggerToast(`Failed to update request to ${status}`, 'error');
    }
  };

  const filteredVisitors = visitors.filter(v =>
    v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.visitorPhone.includes(searchQuery)
  );

  // Admin Analytics calculations
  const pendingCount = visitors.filter(v => v.status === 'Pending').length;
  const approvedCount = visitors.filter(v => v.status === 'Approved').length;
  const rejectedCount = visitors.filter(v => v.status === 'Rejected').length;
  const totalCount = visitors.length;

  return (
    <div className="space-y-6 animate-fade-in" id="visitor-management-view">
      {/* Analytics dashboard overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Visits Today</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{totalCount}</h4>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest animate-pulse">Pending Actions</p>
            <h4 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h4>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Approved Logs</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</h4>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Denied Entry</p>
            <h4 className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</h4>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Submit visitor form (Guest mode) or short summary info (Admin mode) */}
        {!isAdmin ? (
          <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xs lg:col-span-4 space-y-4">
            <div>
              <span className="text-[9px] font-black tracking-widest text-amber-600 uppercase">Guest Services</span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Submit Visitor Request</h3>
              <p className="text-xs text-slate-400 mt-1">Get fast clearance for room visits, friends and corporate associates.</p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Visitor's Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 555-0811"
                  value={visitorPhone}
                  onChange={e => setVisitorPhone(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">ID Proof Type</label>
                  <select
                    value={idProofType}
                    onChange={e => setIdProofType(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                  >
                    <option value="DL">Driver License</option>
                    <option value="Passport">Passport</option>
                    <option value="Aadhar">Aadhar ID</option>
                    <option value="Other">Other Photo ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    placeholder="ID Alpha-Numeric"
                    value={idProofNumber}
                    onChange={e => setIdProofNumber(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Visit Proposed Date *</label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Visit Purpose</label>
                <textarea
                  placeholder="e.g. business documentation discussion or corporate lunch meeting"
                  rows={2}
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg p-2.5 outline-hidden transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 font-bold text-xs text-white p-3 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting Details...' : 'Request Entry Clearance'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 text-slate-100 border border-slate-800 p-6 rounded-xl shadow-xs lg:col-span-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase">System Intelligence</span>
              <h3 className="text-base font-extrabold text-white">Visitor Security Clearance</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                As administrative personnel, enforce real-time guest and property security validation. Always ensure visitors produce valid photographic credentials matching their request log entries prior to validating check-ins.
              </p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 mt-4 text-[11px] font-medium text-slate-400">
                <p>&bull; 📋 Pending requests undergo vetting checks</p>
                <p>&bull; 🔍 Match telephone or travel papers when suspicious</p>
                <p>&bull; 🔒 Refused entrants are cataloged for security records</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-850 mt-6 lg:mt-0 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Entry Gate Clearance</span>
              <span className="text-xs font-black text-emerald-400">Active Vigilance Live</span>
            </div>
          </div>
        )}

        {/* Right column: Visitor entries list/table (Span 8) */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xs lg:col-span-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Visitations & Credentials Directory</h3>
              <p className="text-xs text-slate-450">Track entry logs, gate safety clearances, and host guests validations.</p>
            </div>
            
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search visitor, host name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs font-semibold pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg outline-hidden focus:bg-white w-full md:w-56 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold font-mono text-slate-450">Synchronizing database log files...</p>
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No visitation records found</p>
              <p className="text-[10px] text-slate-400 mt-1">New visitor registrations and gate passes will form here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Visitor</th>
                    {isAdmin && <th className="py-2.5">Resident Host</th>}
                    <th className="py-2.5">Document ID</th>
                    <th className="py-2.5">Date & Purpose</th>
                    <th className="py-2.5 text-center">Status</th>
                    {isAdmin && <th className="py-2.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {filteredVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <p className="font-extrabold text-slate-800">{v.visitorName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{v.visitorPhone}</p>
                      </td>
                      {isAdmin && (
                        <td className="py-3">
                          <p className="font-bold text-slate-705">{v.customerName}</p>
                          <p className="text-[9px] text-slate-400 font-mono">UID: {v.customerId}</p>
                        </td>
                      )}
                      <td className="py-3">
                        <span className="font-bold text-slate-600 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{v.idProofType}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.idProofNumber}</p>
                      </td>
                      <td className="py-3">
                        <p className="font-extrabold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {v.visitDate}
                        </p>
                        <p className="text-[10px] text-slate-405 italic max-w-xs truncate" title={v.purpose}>{v.purpose}</p>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          v.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          v.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {v.status}
                        </span>
                        {v.approvedAt && (
                          <span className="block text-[8px] text-slate-400 mt-1 font-mono">Checked at: {new Date(v.approvedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3 text-right">
                          {v.status === 'Pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(v.id, 'Approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all"
                                title="Approve Entry"
                              >
                                <FileCheck className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(v.id, 'Rejected')}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all"
                                title="Deny Entry"
                              >
                                <Ban className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">Resolved</span>
                          )}
                        </td>
                      )}
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
