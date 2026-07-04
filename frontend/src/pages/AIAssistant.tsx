import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: "Hello! I am your AI HR Policy Assistant. I can answer questions about leave allocations, carry-forward, attendance timings, and proration policies. What would you like to know today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggestions for user
  const suggestions = [
    "Can I combine casual leave with sick leave?",
    "How many casual leaves do I have left?",
    "What is the grace period for check-in?"
  ];

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Add user message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/v1/ai/chat', { message: textToSend });
      const botMsg: ChatMessage = {
        sender: 'bot',
        text: response.response || "I couldn't process that question. Please try asking again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('AI chat failed', err);
      const errMsg: ChatMessage = {
        sender: 'bot',
        text: "Error connecting to Policy Assistant. Make sure the backend server is running and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Basic formatter to bold **text** in chat bubbles
  const renderMessageText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-indigo-300">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-650/5 blur-3xl pointer-events-none"></div>

      {/* Title Header */}
      <div className="px-6 py-4 bg-slate-850/50 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200">HR Policy Assistant</h2>
            <span className="text-[10px] text-slate-500 font-medium">Virtual Policy Advisor & Balance Calculator</span>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={idx} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-semibold ${
                isUser 
                  ? 'bg-slate-950 border-slate-800 text-slate-400' 
                  : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400'
              }`}>
                {isUser ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              {/* Speech Bubble */}
              <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                isUser
                  ? 'bg-gradient-to-r from-indigo-650 to-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-950 text-slate-250 rounded-tl-none border border-slate-850/80 shadow-md shadow-black/10'
              }`}>
                <div className="whitespace-pre-line">
                  {renderMessageText(msg.text)}
                </div>
                <span className={`text-[8px] block mt-2 text-right ${isUser ? 'text-indigo-200' : 'text-slate-550'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-950/20 border-indigo-500/20 text-indigo-400">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 rounded-tl-none border border-slate-850/80 shadow-md flex items-center gap-2 text-xs text-slate-450">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing policy document and balancing quotas...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggestion list overlay if chat is empty/near-empty */}
      {messages.length === 1 && !loading && (
        <div className="px-6 py-4 bg-slate-950/20 border-t border-slate-850/50 space-y-3">
          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Suggested Questions</span>
          </span>
          <div className="flex flex-wrap gap-2.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 text-[10px] text-slate-350 hover:text-slate-100 transition-all duration-200 flex items-center gap-1.5 cursor-pointer text-left font-medium"
              >
                <span>{s}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Footer */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-850">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2.5"
        >
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about carry-forward, overlaps, check-in grace period..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-gradient-to-tr from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white rounded-xl transition-all duration-300 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
