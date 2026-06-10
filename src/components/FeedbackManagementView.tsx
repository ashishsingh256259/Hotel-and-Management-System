import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquare, Sparkles, Send, Award, Smile, TrendingUp, HelpCircle } from 'lucide-react';
import { Feedback } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FeedbackManagementViewProps {
  currentUser: any;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
}

export default function FeedbackManagementView({ currentUser, triggerToast }: FeedbackManagementViewProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Guest submission form attributes
  const [roomRating, setRoomRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      // Try to load reviews or feedback
      const res = await axios.get('/api/feedbacks');
      setFeedbacks(res.data);
    } catch (err) {
      // If endpoint only visible for admin, guest might fail, which is caught or handled gracefully
      if (isAdmin) {
        triggerToast('Failed to pull employee or customer feedbacks.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFeedbacks();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post('/api/feedbacks', {
        roomRating,
        foodRating,
        staffRating,
        comments
      });
      triggerToast('Thank you! Your ratings have been submitted to general manager.', 'success');
      
      // Reset State
      setRoomRating(5);
      setFoodRating(5);
      setStaffRating(5);
      setComments('');

      if (isAdmin) {
        setFeedbacks(prev => [res.data, ...prev]);
      }
    } catch (err) {
      triggerToast('Failed to archive feedback scores.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute analytics from feedback
  const roomAvg = feedbacks.length > 0 ? parseFloat((feedbacks.reduce((sum, f) => sum + f.roomRating, 0) / feedbacks.length).toFixed(2)) : 4.6;
  const foodAvg = feedbacks.length > 0 ? parseFloat((feedbacks.reduce((sum, f) => sum + f.foodRating, 0) / feedbacks.length).toFixed(2)) : 4.4;
  const staffAvg = feedbacks.length > 0 ? parseFloat((feedbacks.reduce((sum, f) => sum + f.staffRating, 0) / feedbacks.length).toFixed(2)) : 4.8;

  const totalPoints = feedbacks.length * 15; // 5 points max * 3 vectors
  const currentPoints = feedbacks.reduce((sum, f) => sum + f.roomRating + f.foodRating + f.staffRating, 0);
  const satisfactionIndex = totalPoints > 0 ? Math.round((currentPoints / totalPoints) * 100) : 92;

  // Recharts Chart Data
  const chartData = [
    { name: 'Room Quality', Average: roomAvg, Benchmark: 4.5 },
    { name: 'Culinary Craft', Average: foodAvg, Benchmark: 4.5 },
    { name: 'Lobby & Staff Support', Average: staffAvg, Benchmark: 4.5 }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="feedback-management-view">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] bg-gradient-to-l from-pink-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">
          General Audit Office
        </span>
        <h2 className="text-xl font-display font-extrabold text-white mt-3">Quality Assurance & Ratings</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          We process customer experiences across three structural vectors to refine guest services and reward top-tier hotel operations staff.
        </p>
      </div>

      {/* 2. Rating submission (Customer Mode) */}
      {!isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xs lg:col-span-6 space-y-6">
            <div>
              <span className="text-[9px] font-black text-[#ec4899] uppercase tracking-wider">Leave review</span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Hotel Experience Audit</h3>
              <p className="text-xs text-slate-400">Your opinion dictates employee reward cycles and daily operations.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              {/* Star Vector 1: Room Suite */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Room Suite Quality & Luxury</span>
                  <span className="text-xs font-mono font-bold text-amber-500">{roomRating} / 5.0</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRoomRating(star)}
                      className="p-1.5 focus:outline-hidden cursor-pointer"
                    >
                      <Star className={`w-6 h-6 transition-colors ${star <= roomRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Vector 2: Culinary Craft */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Culinary Food & Dining Craft</span>
                  <span className="text-xs font-mono font-bold text-amber-500">{foodRating} / 5.0</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFoodRating(star)}
                      className="p-1.5 focus:outline-hidden cursor-pointer"
                    >
                      <Star className={`w-6 h-6 transition-colors ${star <= foodRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Vector 3: Lobby Staff */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Staff Professionalism & Warmth</span>
                  <span className="text-xs font-mono font-bold text-amber-500">{staffRating} / 5.0</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStaffRating(star)}
                      className="p-1.5 focus:outline-hidden cursor-pointer"
                    >
                      <Star className={`w-6 h-6 transition-colors ${star <= staffRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentary */}
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Additional Commentary</label>
                <textarea
                  placeholder="Tell us what impressed you or where we can polish suite details..."
                  rows={3}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ec4899] hover:bg-[#db2777] disabled:bg-slate-300 font-bold text-xs text-white p-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> {submitting ? 'Archiving ratings...' : 'Submit Experience Audit'}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 lg:col-span-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[9px] font-black tracking-widest text-[#ec4899] uppercase">Loyalty benefits</span>
              <h3 className="text-base font-extrabold text-slate-900">Your voice matters</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                By participating in general quality review assessments, earn up to <span className="text-amber-600 font-bold">50 Royale Experience Points</span> creditable toward your customer account. Experience points can be redeemed for restaurant dining discounts, lobby spa passes or room category updates.
              </p>
              <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Room Satisfaction Index</span>
                  <span className="text-emerald-600">98% Positive</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[98%]" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">A</div>
              <p className="text-[10px] text-slate-450 leading-tight">Amber Royale general office coordinates compliance reviews to guarantee pristine hotel luxury.</p>
            </div>
          </div>
        </div>
      ) : (
        // Admin View (Full analytic dashboard)
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Average Room Quality</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                {roomAvg} <span className="text-xs text-slate-400">/ 5.0</span>
              </h4>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Food Menu Satisfactory</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                {foodAvg} <span className="text-xs text-slate-400">/ 5.0</span>
              </h4>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Lobby Staff Evaluation</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                {staffAvg} <span className="text-xs text-slate-400">/ 5.0</span>
              </h4>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs">
              <p className="text-[10px] text-pink-600 font-black uppercase tracking-widest">Satisfaction Score</p>
              <h4 className="text-3xl font-black text-slate-850 mt-1 font-mono">
                {satisfactionIndex}%
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Area */}
            <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-xs lg:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Compliance & Experience Vectors</h3>
                <p className="text-xs text-slate-450 mt-0.5">Visual ratings benchmarked against local 4.5 operational standards.</p>
              </div>

              {/* Responsive Container Bar Chart */}
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Bar dataKey="Average" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Benchmark" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comments List */}
            <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-xs lg:col-span-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Recent Customer Reviews</h3>
                <p className="text-xs text-slate-455 mt-0.5 mb-4">Verbatim feedback commentary logs.</p>
              </div>

              <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
                {feedbacks.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50/50 rounded-lg text-slate-400">
                    <MessageSquare className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <p className="text-[10px] font-bold">No feedback commentary filed yet.</p>
                  </div>
                ) : (
                  feedbacks.map(f => (
                    <div key={f.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[10px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">{f.customerName}</span>
                        <span className="text-[8px] font-mono font-bold text-slate-400">{f.id}</span>
                      </div>
                      <div className="flex gap-2 font-bold text-slate-500 font-mono text-[9px]">
                        <span>Suite: {f.roomRating}★</span>
                        <span>Food: {f.foodRating}★</span>
                        <span>Service: {f.staffRating}★</span>
                      </div>
                      <p className="text-[10px] text-slate-600 italic">"{f.comments || 'No comment text shared'}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
