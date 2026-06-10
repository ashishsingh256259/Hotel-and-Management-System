import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Wifi, 
  Pizza, 
  Key, 
  HelpCircle 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function AiChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      role: 'model',
      text: 'Warm greetings! I am Roy, your Virtual Suite Concierge here at Amber Royale Hotel. How may I elevate your stay comfort today? Ask me about available rooms, room dining menus, high-speed Wi-Fi access or details on boutique spa amenities.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      // Map historical log records to required payload schema (excluding initial greeting to avoid token clutter)
      const chatHistory = messages
        .filter(m => m.id !== 'greeting')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const res = await axios.post(`${window.location.origin}/api/ai/chat`, {
        message: textToSend,
        chatHistory
      });

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'model',
        text: res.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'model',
        text: 'I apologize. I seems to be experiencing a connection latency with the main desk database. Please check your network or try again shortly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const suggestedChips = [
    { label: 'Available Rooms', text: 'Which rooms are currently available to book?', icon: Key },
    { label: 'Hotel Food Menu', text: 'Show me the restaurant menu card details', icon: Pizza },
    { label: 'WiFi Instructions', text: 'What is the guest Wi-Fi details and credentials?', icon: Wifi },
    { label: 'Hotel Services', text: 'Can you list the premium hotel amenities and timings?', icon: HelpCircle }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none font-sans text-slate-800" id="chatbot-component">
      {/* Core Floating triggers bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-slate-900 border border-slate-800 text-slate-50 hover:bg-slate-800 rounded-full flex items-center justify-center cursor-pointer shadow-xl relative animate-bounce-slow"
          id="chatbot-trigger-floating"
        >
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-500/20" />
        </button>
      )}

      {/* Expanded chat dialog card */}
      {isOpen && (
        <div 
          className="w-80 sm:w-96 h-[500px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
          id="chatbot-overlay-card"
        >
          {/* Header banner */}
          <div className="p-4 bg-slate-900 text-slate-50 flex items-center justify-between border-b border-slate-850" id="chatbot-header">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                  Roy Concierge <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                </h4>
                <p className="text-[10px] text-slate-400">Amber Royale AI Ambassador</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              id="close-chatbot-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Chat messages body */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfcfd]" 
            ref={scrollRef}
            id="chatbot-conversation-ledger"
          >
            {messages.map(m => (
              <div 
                key={m.id} 
                className={`flex gap-2 text-xs leading-relaxed max-w-[85%] ${
                  m.role === 'model' ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
                id={`chat-msg-${m.id}`}
              >
                {/* Message author icon */}
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border text-[9px] ${
                  m.role === 'model' 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 font-bold' 
                    : 'bg-slate-900 border-slate-800 text-slate-50'
                }`}>
                  {m.role === 'model' ? 'Roy' : 'Me'}
                </div>

                <div 
                  className={`p-3 rounded-xl border whitespace-pre-wrap ${
                    m.role === 'model' 
                      ? 'bg-white border-slate-200/60 rounded-tl-none font-semibold text-slate-700 shadow-3xs' 
                      : 'bg-amber-600 border-amber-700 text-slate-50 rounded-tr-none font-bold shadow-4xs'
                  }`}
                >
                  {m.text}
                  <span className={`block text-[9px] font-semibold mt-1 tracking-wider text-right ${
                    m.role === 'model' ? 'text-slate-400' : 'text-amber-200'
                  }`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 max-w-[85%] mr-auto" id="msg-loader">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-bold text-[9px]">
                  Roy
                </div>
                <div className="p-3 bg-white border border-slate-200/60 rounded-xl rounded-tl-none flex items-center gap-1 shadow-3xs text-slate-400 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                  Roy is Sourcing desk...
                </div>
              </div>
            )}
          </div>

          {/* Prompt chips suggestions */}
          <div className="px-3.5 py-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto bg-slate-50 border-b no-scrollbar" id="interactive-chips">
            {suggestedChips.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.text)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 rounded-md shadow-4xs hover:border-amber-500 hover:text-amber-700 shrink-0 cursor-pointer transition-colors"
              >
                <chip.icon className="w-3 h-3 text-amber-600" /> {chip.label}
              </button>
            ))}
          </div>

          {/* Core texting formulation input bar */}
          <div className="p-3 border-t border-slate-100 bg-white" id="chatbot-form-input">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask me how to get spa discount..."
                value={inputMessage}
                disabled={loading}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-[#fbfbfc]"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 bg-slate-900 border border-slate-800 text-slate-50 rounded-xl hover:bg-slate-800 disabled:opacity-40 select-none cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                id="send-chat-input-btn"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
