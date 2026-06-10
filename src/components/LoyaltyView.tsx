import React from 'react';
import { 
  Award, 
  TrendingUp, 
  Gift, 
  HelpCircle, 
  ArrowUpRight, 
  ShieldAlert, 
  Pizza, 
  BedDouble,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  YAxis, 
  XAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Customer } from '../types';

interface LoyaltyViewProps {
  currentUser: any;
  customers: Customer[];
}

export default function LoyaltyView({ currentUser, customers }: LoyaltyViewProps) {
  const customerId = currentUser?.customerId;
  const matchCust = customers.find(c => c.id === customerId);

  const loyaltyPoints = matchCust?.loyaltyPoints || 0;
  const potentialSavings = (loyaltyPoints / 10).toFixed(2);
  const loyaltyHistory = matchCust?.loyaltyHistory || [];

  // Compute stats
  const totalEarned = loyaltyHistory
    .filter(h => h.points > 0)
    .reduce((acc, curr) => acc + curr.points, 0);

  const totalRedeemed = Math.abs(loyaltyHistory
    .filter(h => h.points < 0)
    .reduce((acc, curr) => acc + curr.points, 0));

  // Build simple visualization data
  const chartData = [...loyaltyHistory]
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any[], curr) => {
      const prevBal = acc.length > 0 ? acc[acc.length - 1].balance : 0;
      const nextBal = prevBal + curr.points;
      acc.push({
        date: new Date(curr.date).toLocaleDateString([], {month: 'short', day: 'numeric'}),
        balance: Math.max(0, nextBal),
        points: curr.points
      });
      return acc;
    }, []);

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="loyalty-hub-wrapper">
      
      {/* Banner Intro */}
      <div className="relative bg-slate-900 text-white rounded-2xl p-6 lg:p-8 overflow-hidden shadow-lg border border-slate-800" id="loyalty-banner">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Royale Club Loyalty program
          </span>
          <h1 className="text-2xl lg:text-3.5xl font-display font-extrabold tracking-tight text-white font-serif">Amber Royale Fidelity Chamber</h1>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold">
            Track your royalty status, compute available cash conversions, and review historic point logs compiled automatically against stays and orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="loyalty-cards-grid">
        {/* Card 1: Balance */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between" id="balance-loyalty-box">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active points balance</span>
              <h3 className="text-3xl font-black text-slate-900 leading-none font-mono">{loyaltyPoints} POTS</h3>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-4 border-t border-slate-50 font-semibold">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            Equivalent to <strong className="text-slate-800 font-black font-mono">${potentialSavings} USD</strong> immediate discount on bookings
          </div>
        </div>

        {/* Card 2: Cumulative Earned */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col justify-between" id="earned-loyalty-box">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cumulative Crown Points</span>
              <h3 className="text-3xl font-black text-slate-900 leading-none font-mono">{totalEarned} PTS</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <BedDouble className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-slate-400 pt-4 border-t border-slate-50 font-semibold">
            Accrued automatically from stays and kitchen meals
          </div>
        </div>

        {/* Card 3: Redeemed points */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col justify-between" id="redeemed-loyalty-box">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Redeemed Discount Credits</span>
              <h3 className="text-3xl font-black text-rose-800 leading-none font-mono">{totalRedeemed} PTS</h3>
            </div>
            <div className="w-12 h-12 bg-rose-500/10 text-rose-700 rounded-xl flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-slate-400 pt-4 border-t border-slate-50 font-semibold">
            Deducted for direct bill reduction in payments
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="loyalty-body-panel">
        {/* Left column: Ledger table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs flex flex-col" id="history-scroller-panel">
          <div className="p-6 border-b border-slate-100 bg-[#fcfcfd]">
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Loyalty Ledger Statements</h3>
            <p className="text-xs text-slate-400">Statement records outlining reward points deposited or charged off</p>
          </div>

          {loyaltyHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex-1 flex flex-col justify-center items-center" id="empty-history">
              <Clock className="w-12 h-12 text-slate-200 mb-2" />
              <p className="text-xs font-bold">Rewards history ledger empty.</p>
              <p className="text-[11px] text-slate-400">Place hotel food orders or book room stays to commence racking up points!</p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="loyalty-table-container">
              <table className="styled-table font-sans animate-fade-in" id="loyalty-history-table">
                <thead>
                  <tr className="text-[10px] text-amber-800 uppercase tracking-widest bg-amber-500/5 border-b border-amber-500/10">
                    <th className="px-6 py-3.5 font-bold">Fidelity Statement Detail</th>
                    <th className="px-6 py-3.5 font-bold">Date Chronology</th>
                    <th className="px-6 py-3.5 font-bold">Type Action</th>
                    <th className="px-6 py-3.5 text-right font-bold">Points impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[...loyaltyHistory].reverse().map(h => (
                    <tr key={h.id} className="hover:bg-amber-500/5 transition-all duration-200 group/row cursor-pointer font-sans" id={`lh-row-${h.id}`}>
                      <td className="px-6 py-3.5 font-bold text-slate-800 group-hover/row:text-slate-950">
                        {h.description}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-450">
                        {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                          h.points > 0 
                            ? 'bg-emerald-500/10 text-emerald-900 border-emerald-500/30 font-black' 
                            : 'bg-rose-500/10 text-rose-900 border-rose-500/30 font-black'
                        }`}>
                          {h.points > 0 ? 'EARNED' : 'REDEEMED'}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 text-right font-black font-mono text-sm group-hover/row:scale-[1.02] transition-transform duration-200 ${
                        h.points > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {h.points > 0 ? `+${h.points}` : h.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Conversion guide lines and chart */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6" id="guide-coordination">
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Exchange conversion index</h4>
            <p className="text-xs text-slate-400">Standard multiplier algorithms for royalty deposits</p>
          </div>

          <div className="space-y-4" id="index-bullets">
            <div className="flex gap-3 text-xs" id="index-bullet-1">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <BedDouble className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800">Suite Reservations</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Collects <strong className="text-slate-700">10 points per $1 USD</strong> booked upon successful room reservation checkout.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs" id="index-bullet-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
                <Pizza className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800">Restaurant culinary orders</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Collects <strong className="text-slate-700">5 points per $1 USD</strong> spent on kitchen food dispatch menus.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs" id="index-bullet-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-800 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800">Discounts Redemption</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Pay bills at checkout with built-in discount. Conversion is flat: <strong className="text-slate-700">10 points = $1 discount</strong>.</p>
              </div>
            </div>
          </div>

          {/* Points chart */}
          {chartData.length > 0 && (
            <div className="pt-4 border-t border-slate-100" id="rechart-points-container">
              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">My Balance Progression</h5>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafafa" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{fontSize: '9px', fill: '#94a3b8'}} />
                    <YAxis tickLine={false} axisLine={false} style={{fontSize: '9px', fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{fontSize: '10px'}} />
                    <Area type="monotone" dataKey="balance" stroke="#d97706" fill="#fef3c7" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
