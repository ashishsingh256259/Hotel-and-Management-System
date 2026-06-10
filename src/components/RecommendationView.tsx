import React, { useState } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  DollarSign, 
  Users, 
  Compass, 
  Check, 
  HelpCircle,
  Wind,
  Layers,
  ArrowRight,
  Bookmark,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { RoomType } from '../types';

interface RecommendationViewProps {
  onBookRoom: (roomNumber: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function RecommendationView({ onBookRoom, triggerToast }: RecommendationViewProps) {
  const [budget, setBudget] = useState<number>(15000);
  const [guests, setGuests] = useState<number>(2);
  const [roomType, setRoomType] = useState<string>('Any');
  const [acPreference, setAcPreference] = useState<'AC' | 'Non-AC' | 'Any'>('Any');

  const [loading, setLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFetchRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendationResult(null);
    setMessage(null);

    try {
      const res = await axios.post(`${window.location.origin}/api/rooms/recommend`, {
        budget,
        guests,
        roomType,
        acPreference
      });

      if (res.data.success && res.data.recommendation) {
        setRecommendationResult(res.data.recommendation);
      } else {
        setMessage(res.data.message || 'No direct matches found. Try relaxing your filters.');
      }
    } catch (err) {
      triggerToast('AI Concierge matching service failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="recommendation-wizard-frame">
      <div className="relative bg-slate-900 text-white rounded-2xl p-6 lg:p-8 overflow-hidden shadow-lg border border-slate-800" id="recommendation-hero bg">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Intelligent Matching Engine
          </span>
          <h1 className="text-2xl lg:text-3.5xl font-display font-extrabold tracking-tight">Smart Room Advisor</h1>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Avoid manual inventory digging. Specify your lodging preferences, and our neural model or fallback filter matrix will pinpoint the precise available suite alongside an elegant match report.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="recommendation-grid">
        {/* Left pane: Recommendation Controls */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6" id="controls-section">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Preference Specifications</h3>
            <p className="text-xs text-slate-400">Tweak budget boundaries and comfortable room setups</p>
          </div>

          <form onSubmit={handleFetchRecommendation} className="space-y-6" id="preference-form">
            
            {/* Sliding budget setting */}
            <div id="budget-pref-wrapper">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Nightly Budget Ceiling</label>
                <span className="text-xs font-black text-amber-600 font-mono">₹ {budget.toLocaleString('en-IN')} / night</span>
              </div>
              <input
                type="range"
                min="3000"
                max="50000"
                step="500"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 px-1 font-semibold">
                <span>₹ 3,000</span>
                <span>₹ 26,500</span>
                <span>₹ 50,000</span>
              </div>
            </div>

            {/* Guest capacity choices */}
            <div id="guests-pref-wrapper">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Lodging Guest Sleepers</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGuests(g)}
                    className={`py-2 text-xs font-black uppercase border rounded-lg transition-colors cursor-pointer ${
                      guests === g 
                        ? 'border-amber-500 bg-amber-50 text-amber-700' 
                        : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold'
                    }`}
                  >
                    {g} {g === 1 ? 'Sleeper' : 'Sleepers'}
                  </button>
                ))}
              </div>
            </div>

            {/* Room type specifications */}
            <div id="roomtype-pref-wrapper">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Class Tier Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Any', 'Standard', 'Deluxe', 'Suite'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRoomType(t)}
                    className={`py-2.5 text-[10px] font-black uppercase border rounded-lg transition-colors cursor-pointer ${
                      roomType === t 
                        ? 'border-amber-500 bg-amber-50 text-amber-700 font-black' 
                        : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* AC preferences */}
            <div id="ac-pref-wrapper">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Air-Conditioning cooling</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Any', 'AC', 'Non-AC'] as const).map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAcPreference(a)}
                    className={`py-2 text-[10px] font-black uppercase border rounded-lg transition-colors cursor-pointer ${
                      acPreference === a 
                        ? 'border-amber-500 bg-amber-50 text-amber-700 font-black' 
                        : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold'
                    }`}
                  >
                    {a === 'Any' ? 'Any' : a === 'AC' ? 'AC Only' : 'Non-AC Fan'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-50 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              id="submit-recommendation-wizard"
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              {loading ? 'Evaluating Model..' : 'Evaluate Recommended Cabin'}
            </button>

          </form>
        </div>

        {/* Right pane: Results output display */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col justify-center min-h-[400px]" id="results-pane">
          {loading ? (
            <div className="text-center space-y-4 py-8" id="loader-results">
              <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Sourcing Real-time Rooms</p>
                <p className="text-[11px] text-slate-400">Evaluating capacity constraints with current booking logs...</p>
              </div>
            </div>
          ) : recommendationResult ? (
            <div className="space-y-6 animate-fade-in" id="recommendation-outcome">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Best Available Match Found
              </span>

              {/* Recommendation card */}
              <div className="bg-white border border-slate-200/65 rounded-xl shadow-xs overflow-hidden" id="recomendee-card">
                {recommendationResult.imageUrl && (
                  <img 
                    src={recommendationResult.imageUrl} 
                    alt="Recommended royal suite"
                    className="w-full h-44 object-cover object-center bg-slate-100 border-b"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg tracking-tight">Suite {recommendationResult.roomNumber}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
                        {recommendationResult.roomType} Room &bull; Max {recommendationResult.capacity} Guests &bull; {recommendationResult.hasAC ? 'AC cooling' : 'Non-AC Fan'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900 font-mono">₹{recommendationResult.pricePerNight.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 block font-bold">/ night excl. GST</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/20 border border-amber-500/10 rounded-xl space-y-1 text-xs" id="outcome-notes">
                    <div className="flex items-center gap-1.5 font-black text-amber-800 text-[10px] uppercase tracking-wide mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Concierge Matching Rationale
                    </div>
                    <p className="text-slate-600 leading-relaxed font-normal text-slate-700">{recommendationResult.reason}</p>
                  </div>

                  {/* Trigger direct Book Now modal */}
                  <button
                    onClick={() => {
                      onBookRoom(recommendationResult.roomNumber);
                      triggerToast(`Bridged to reservation manager for Room ${recommendationResult.roomNumber}!`, 'success');
                    }}
                    className="w-full py-2.5 bg-amber-600 border border-amber-700 hover:bg-amber-700 text-slate-50 text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    id="book-recommended-room"
                  >
                    Confirm & Reserve Now <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          ) : message ? (
            <div className="text-center space-y-3 py-8" id="fallback-message">
              <AlertCircle className="w-12 h-12 mx-auto text-rose-500 opacity-80" />
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-700">Preference Limit Exceeded</p>
                <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">{message}</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 py-8" id="awaiting-input">
              <Compass className="w-12 h-12 mx-auto text-slate-200" />
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-500">Advisory Feed Empty</p>
                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">Adjust preferences on the left side and request evaluation index.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
