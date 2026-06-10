import React, { useRef } from 'react';
import { Printer, TrendingUp, Hotel, Pizza, Users, CalendarDays, Award } from 'lucide-react';
import { ReportsData, DashboardStats } from '../types';

interface ReportsViewProps {
  stats: DashboardStats;
  reports: ReportsData;
  onViewGuest?: (name: string) => void;
}

export default function ReportsView({ stats, reports, onViewGuest }: ReportsViewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const triggerPrintReport = () => {
    if (!printAreaRef.current) return;
    const reportHTML = printAreaRef.current.innerHTML;
    const bodyBackup = document.body.innerHTML;

    document.body.innerHTML = reportHTML;
    window.print();
    document.body.innerHTML = bodyBackup;
    window.location.reload();
  };

  return (
    <div className="space-y-6" id="reports-view-container">
      {/* Banner Controllers */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center" id="reports-controllers">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hospitality & Business Audits</h3>
          <p className="text-xs text-slate-400 mt-1">Generate and print professional real-time management reports</p>
        </div>
        <button
          onClick={triggerPrintReport}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" /> Export / Print Report
        </button>
      </div>

      {/* Audit Sheets */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-8 space-y-8" ref={printAreaRef} id="printable-report-area">
        {/* Printable Banner */}
        <div className="border-b-2 border-slate-950 pb-6 flex justify-between items-baseline">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">THE AMBER ROYALE</h1>
            <p className="text-xs text-slate-450 tracking-widest uppercase font-mono mt-1">Management Performance Report</p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500">
            <p>Executed: {new Date().toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' })}</p>
            <p>Time: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* High level counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-b border-dashed border-slate-200 pb-6">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="block text-slate-400 font-bold text-[10px] uppercase">ESTIMATED REVENUE</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">₹{stats.totalRevenue.toLocaleString()}</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="block text-slate-400 font-bold text-[10px] uppercase">OCCUPANCY RATE</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.totalRooms ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="block text-slate-400 font-bold text-[10px] uppercase">TOTAL ROOM BOOKINGS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalBookings} stays</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="block text-slate-400 font-bold text-[10px] uppercase">RESTAURANT INVOICE ITEMS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{reports.foodSales.reduce((acc, f) => acc + f.count, 0)} plates</span>
          </div>
        </div>

        {/* Breakdown divisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Daily financial ledger */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5 text-amber-700">
              <TrendingUp className="w-4 h-4 shrink-0" /> Daily Revenue Ledger
            </h4>
            <table className="styled-table font-mono animate-fade-in">
              <thead>
                <tr>
                  <th className="font-bold">Transaction Date</th>
                  <th className="text-right font-bold">Sum Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {reports.dailyRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center text-slate-400 font-sans">No daily ledger items</td>
                  </tr>
                ) : (
                  reports.dailyRevenue.map((d, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-slate-700">{d.date}</td>
                      <td className="text-right font-black text-emerald-600">₹{d.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Monthly cumulative metrics summary */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5 text-amber-700">
              <CalendarDays className="w-4 h-4 shrink-0" /> Monthly Revenue Recap
            </h4>
            <table className="styled-table font-mono animate-fade-in">
              <thead>
                <tr>
                  <th className="font-bold">Billing Cycle</th>
                  <th className="text-right font-bold">Cumulative Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {reports.monthlyRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center text-slate-400 font-sans">No cycles processed</td>
                  </tr>
                ) : (
                  reports.monthlyRevenue.map((m, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-slate-700">{m.month}</td>
                      <td className="text-right font-black text-emerald-600">₹{m.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm pt-6 border-t border-slate-100">
          {/* Food items leaders */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5 text-amber-700">
              <Pizza className="w-4 h-4 shrink-0" /> Restaraunt Product Report
            </h4>
            <table className="styled-table font-mono animate-fade-in">
              <thead>
                <tr>
                  <th className="font-bold">Delicacy Item Name</th>
                  <th className="text-center font-bold">Quantity</th>
                  <th className="text-right font-bold w-[130px]">Yield Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {reports.foodSales.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-slate-400 font-sans">No restaurant sales recorded</td>
                  </tr>
                ) : (
                  reports.foodSales.map((f, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-slate-700 font-sans">{f.item}</td>
                      <td className="text-center font-bold text-slate-650">{f.count} qty</td>
                      <td className="text-right font-black text-violet-600">₹{f.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Guest loyalty stay rankings */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5 text-amber-700">
              <Award className="w-4 h-4 shrink-0" /> Guest Bookings Loyalty Ledger
            </h4>
            <table className="styled-table animate-fade-in">
              <thead>
                <tr>
                  <th className="font-bold">Guest Profile</th>
                  <th className="text-center font-bold">Total Reservations</th>
                  <th className="text-right font-bold w-[150px]">Yield Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10 font-mono">
                {reports.customerBookings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-slate-400 font-sans">No customer histories</td>
                  </tr>
                ) : (
                  reports.customerBookings.map((c, idx) => (
                    <tr 
                      key={idx}
                      className="hover:bg-amber-500/5 transition-all duration-200 group/row cursor-pointer"
                      onClick={() => onViewGuest && onViewGuest(c.name)}
                      title={`View ${c.name}'s Guest Profile`}
                    >
                      <td className="font-sans font-semibold text-slate-700">{c.name}</td>
                      <td className="text-center font-bold text-slate-755">{c.bookings} stays</td>
                      <td className="text-right font-black text-emerald-600">₹{c.revenue.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Ledger Footer */}
        <div className="border-t-2 border-slate-950 pt-6 text-center text-[10px] text-slate-400 font-mono uppercase tracking-widest">
          End of Amber Royale Corporate Performance Audit — Confidential Internal Document Only
        </div>
      </div>
    </div>
  );
}
