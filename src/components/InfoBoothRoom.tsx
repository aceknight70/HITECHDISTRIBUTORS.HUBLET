/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, ArrowRightLeft, ShoppingCart, MessageSquareCode } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface InfoBoothRoomProps {
  onAddToCart: (productId: number, qty: number) => void;
  onAddSolarProduct: (solarId: string, qty: number) => void;
  onNavigateToRoom: (roomId: string) => void;
}

export default function InfoBoothRoom({ onAddToCart, onAddSolarProduct, onNavigateToRoom }: InfoBoothRoomProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! Welcome to HiTech Emporium's Intelligent Info Booth. I can answer specifications, help you choose standard computers, recommend solar power equipment setups, or even directly add components to your invoice list. How may I serve you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    
    // Append user message
    const newMessages = [...messages, { role: 'user' as const, text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Map message history to Gemini API format: [{ role: 'user'|'model', parts: [{ text: ... }]}]
      const contents = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Append model response
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);

      // Check if any function calls are returned
      if (data.functionCalls && Array.isArray(data.functionCalls)) {
        for (const call of data.functionCalls) {
          const { name, args } = call;
          if (name === 'addToCart' && args?.productId) {
            onAddToCart(parseInt(args.productId), 1);
            triggerNotification(`Successfully added product ID #${args.productId} directly to your Standard Cart!`);
          } else if (name === 'addToSolarCart' && args?.solarId) {
            onAddSolarProduct(args.solarId, 1);
            triggerNotification(`Successfully added solar item '${args.solarId}' directly to your Solar Cart!`);
          } else if (name === 'openWhatsAppEnquiry' && args?.message) {
            const role = args.recipientRole || 'sales';
            let waNum = '2348065210611'; // WA_SALES
            if (role === 'inventory') waNum = '2348034832773';
            else if (role === 'gm') waNum = '2348032175552';

            const formattedLink = `https://wa.me/${waNum}?text=${encodeURIComponent(args.message)}`;
            triggerNotification(`Created custom enquiry! Click 'Send' parameters to open on WhatsApp.`);
            
            // Add custom visual link bubble
            setMessages(prev => [...prev, { 
              role: 'model', 
              text: `I have prepared a WhatsApp text for our ${role} division relative to this query. [Click here to open WhatsApp directly](${formattedLink})` 
            }]);
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Forgive me, my server node is experiencing brief updates. Please try again in a few moments, or click 'Contact' to reach us instantly." }]);
    } finally {
      setLoading(false);
    }
  };

  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const clearChat = () => {
    setMessages([
      { role: 'model', text: "Hello! Welcome to HiTech Emporium's Intelligent Info Booth. I can answer specifications, help you choose standard computers, recommend solar power equipment setups, or even directly add components to your invoice list. How may I serve you today?" }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-[#0a0a0a]">
      {/* Header Info */}
      <div className="p-3 bg-[#141414] border-b border-[#262626] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-[#F5C518] w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">HiTech AI Assistant</span>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">GEMINI-3.5</span>
        </div>
        <button 
          onClick={clearChat}
          className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Clear</span>
        </button>
      </div>

      {/* Persistent Notification floating banner */}
      {notification && (
        <div className="bg-zinc-900 border-b border-[#F5C518]/30 px-4 py-2.5 text-xs text-zinc-100 flex items-center gap-2 animate-fade-in shrink-0">
          <ShoppingCart className="text-[#F5C518] w-4 h-4 shrink-0" />
          <span className="flex-1">{notification}</span>
          <button 
            onClick={() => onNavigateToRoom('invoice')}
            className="text-[10px] bg-[#F5C518] text-[#0a0a0a] font-bold uppercase px-2 py-0.5 rounded"
          >
            Go To Cart
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          
          // Render links inside messages as clickable blocks
          const containsLink = m.text.includes('](https://wa.me');
          let textNormal = m.text;
          let linkUrl = '';
          
          if (containsLink) {
            const match = m.text.match(/\[([^\]]+)\]\((https:\/\/wa\.me[^\)]+)\)/);
            if (match) {
              textNormal = m.text.split('[')[0];
              linkUrl = match[2];
            }
          }

          return (
            <div 
              key={idx} 
              className={`flex gap-2 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                isUser ? 'bg-zinc-800 border-zinc-700' : 'bg-[#141414] border-[#262626]'
              }`}>
                {isUser ? <User className="w-3 h-3 text-zinc-400" /> : <Bot className="w-3 h-3 text-[#F5C518]" />}
              </div>
              <div className={`p-3 rounded-lg text-xs leading-relaxed shadow-sm ${
                isUser 
                  ? 'bg-zinc-800 text-zinc-200 rounded-tr-none' 
                  : 'bg-[#141414] text-zinc-300 border border-[#262626] rounded-tl-none'
              }`}>
                <p>{textNormal}</p>
                {linkUrl && (
                  <a 
                    href={linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] uppercase transition-colors"
                  >
                    Open WhatsApp Enquiry →
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2 max-w-[85%] mr-auto">
            <div className="w-6 h-6 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="p-3 bg-[#141414] border border-[#262626] rounded-lg rounded-tl-none text-xs flex items-center gap-1.5 text-zinc-500">
              <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce1"></span>
              <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce2"></span>
              <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce3"></span>
            </div>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {/* Input Form footer bar */}
      <div className="p-3 border-t border-[#262626] bg-[#141414] shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask AI (e.g. 'Add HP ProBook', 'What solar size for freezer?')"
            className="flex-1 bg-[#0a0a0a] border border-[#262626] text-xs text-[#f5f5f5] rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-[#F5C518] rounded-lg disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-zinc-500 text-center mt-1.5">
          Ask to "add to invoice" to directly configure carts automatically.
        </p>
      </div>
    </div>
  );
}
