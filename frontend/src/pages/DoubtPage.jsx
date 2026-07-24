import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, User, Camera, Send, X, Lightbulb, Zap } from 'lucide-react';
import api from '../services/api';

export default function DoubtPage() {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || ''}! I'm your AI tutor. Ask me any math question, upload a photo of a problem, or ask for a hint.`
    }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('socratic'); 
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Simulate API call for now
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: mode === 'socratic' 
            ? "That's a good question! What do you think the first step should be when isolating the variable?" 
            : "To solve for x in 2x = 10, you divide both sides by 2, which gives x = 5."
        }]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] max-w-[800px] mx-auto flex flex-col animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div>
          <div className="eyebrow flex items-center gap-1.5"><Bot size={14}/> AI Assistant</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Ask a Doubt</h1>
        </div>

        <div className="flex p-1 bg-white border border-[var(--border)] rounded-full shadow-sm">
          <button
            onClick={() => setMode('socratic')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors ${
              mode === 'socratic' ? 'bg-[var(--sky)] text-white' : 'text-[var(--ink-soft)] hover:bg-[#F2EEE1]'
            }`}
          >
            <Lightbulb size={14}/> Guide Me
          </button>
          <button
            onClick={() => setMode('direct')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors ${
              mode === 'direct' ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:bg-[#F2EEE1]'
            }`}
          >
            <Zap size={14}/> Direct Answer
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card p-0 flex flex-col overflow-hidden mb-6 shadow-sm border-[var(--border)]">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9F8F5]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'user' 
                  ? 'bg-[var(--marigold-soft)] text-[var(--marigold-dark)]' 
                  : 'bg-[var(--sky)] text-white shadow-[0_4px_10px_rgba(52,87,214,0.3)]'
              }`}>
                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              
              <div className={`p-4 rounded-[var(--radius-md)] text-[15px] font-medium leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white border border-[var(--border)] text-[var(--ink)] rounded-tr-sm shadow-sm'
                  : 'bg-[var(--ink)] text-white rounded-tl-sm shadow-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-[var(--sky)] text-white shadow-[0_4px_10px_rgba(52,87,214,0.3)] flex items-center justify-center shrink-0 mt-1">
                <Bot size={16}/>
              </div>
              <div className="p-4 rounded-[var(--radius-md)] rounded-tl-sm bg-[var(--ink)] text-[var(--ink-faint)] flex items-center gap-2">
                <div className="spinner w-4 h-4 border-2 border-[var(--ink-faint)] border-t-[var(--sky)]"></div> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-[var(--border)]">
          <form onSubmit={handleSend} className="flex gap-3">
            <button type="button" className="p-3 rounded-full bg-[#F2EEE1] text-[var(--ink-soft)] hover:bg-[var(--border)] transition-colors shrink-0">
              <Camera size={20}/>
            </button>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question here..."
              className="flex-1 bg-[#F9F8F5] border border-[var(--border)] rounded-full px-5 py-3 focus:outline-none focus:border-[var(--sky)] focus:ring-1 focus:ring-[var(--sky)] text-[var(--ink)] font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-full bg-[var(--sky)] text-white flex items-center justify-center hover:bg-[#2846B8] transition-colors disabled:opacity-50 shrink-0"
            >
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
