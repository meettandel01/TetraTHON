import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import toast from 'react-hot-toast';
import { Shield, Key, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Hardcoded profiles matching the seed data
  const profiles = [
    { id: '1', name: 'Aditi Sharma', section: '8-A', level: 'Foundational', archetype: 'foundImproving', pin: '1234' },
    { id: '2', name: 'Rohan Verma', section: '8-A', level: 'Advanced', archetype: 'strong', pin: '2345' },
    { id: '3', name: 'Fatima Sheikh', section: '8-B', level: 'Grade-Level', archetype: 'algebraStrong', pin: '3456' },
  ];

  const handlePinInput = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      if (pin.length === 3) {
        // Auto submit on 4th digit
        submitPin(pin + num);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const submitPin = async (finalPin) => {
    setLoading(true);
    try {
      // Mock validation first
      if (selectedProfile.pin !== finalPin) {
        throw new Error('Incorrect PIN');
      }
      // Actual API call
      const res = await authApi.loginPin(parseInt(selectedProfile.id), finalPin);
      login(res.data.access_token, res.data.user);
      navigate('/student/dashboard');
    } catch (e) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      toast.error('Incorrect PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoLogin = async (role) => {
    setLoading(true);
    try {
      const res = await authApi.loginSso(role, 'google');
      login(res.data.access_token, res.data.user);
      navigate(`/${role}/dashboard`);
    } catch (e) {
      toast.error('SSO Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--paper)] p-4 md:p-8">
      {/* Brand Panel */}
      <div className="hidden md:flex flex-1 flex-col justify-between bg-gradient-to-br from-[var(--ink)] to-[var(--ink-2)] rounded-3xl p-12 text-[var(--paper)] relative overflow-hidden shadow-[var(--shadow-main)]">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <svg viewBox="0 0 48 48" className="w-10 h-10 text-[var(--marigold)] fill-current">
              <circle cx="24" cy="10" r="6"/><circle cx="10" cy="34" r="6"/><circle cx="38" cy="34" r="6"/>
              <path d="M20 14 L13 29 M28 14 L35 29 M16 34 H32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
            <h1 className="text-3xl font-serif text-white tracking-tight m-0">Sahaay</h1>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-6">
            Intelligent<br/>Learning Companion
          </h2>
          <p className="text-[#C7C4E0] text-lg max-w-md font-sans">
            Adaptive practice, conceptual mapping, and AI-driven doubt resolution for the modern classroom.
          </p>
        </div>
      </div>

      {/* Login Panel */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-md">
          {!selectedProfile ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-serif text-[var(--ink)] mb-2">Welcome Back</h2>
              <p className="text-[var(--ink-soft)] mb-8">Select your student profile to continue</p>
              
              <div className="grid grid-cols-1 gap-3 mb-10">
                {profiles.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedProfile(p)}
                    className="flex items-center justify-between p-4 bg-white border border-[var(--border)] rounded-2xl hover:border-[var(--sky)] hover:shadow-[0_4px_12px_rgba(52,87,214,0.1)] transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--sky-soft)] text-[var(--sky)] flex items-center justify-center font-bold text-lg">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--ink)]">{p.name}</div>
                        <div className="text-sm text-[var(--ink-faint)]">Section {p.section}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold bg-[var(--paper)] px-3 py-1 rounded-full text-[var(--ink-soft)]">
                      {p.level}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-[var(--border)]">
                <p className="text-xs font-bold uppercase text-[var(--ink-faint)] tracking-wider mb-4">Staff & Faculty Portal</p>
                <div className="flex gap-2">
                  <button onClick={() => handleSsoLogin('parent')} className="flex-1 btn btn-ghost justify-center text-[13px] px-2">
                    <Mail size={14} /> Parent
                  </button>
                  <button onClick={() => handleSsoLogin('teacher')} className="flex-1 btn btn-ghost justify-center text-[13px] px-2">
                    <Mail size={14} /> Teacher
                  </button>
                  <button onClick={() => handleSsoLogin('admin')} className="flex-1 btn btn-ghost justify-center text-[13px] px-2">
                    <Shield size={14} /> Admin
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`animate-fade-in ${shake ? 'shake' : ''}`}>
              <button 
                onClick={() => { setSelectedProfile(null); setPin(''); }}
                className="text-[var(--sky)] text-sm font-bold mb-6 hover:underline"
              >
                ← Back to profiles
              </button>
              
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-[var(--sky-soft)] text-[var(--sky)] flex items-center justify-center font-bold text-3xl mb-4">
                  {selectedProfile.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-serif text-[var(--ink)]">Hi, {selectedProfile.name.split(' ')[0]}</h2>
                <p className="text-[var(--ink-soft)]">Enter your 4-digit PIN</p>
              </div>
              
              <div className="flex justify-center gap-4 mb-10">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-5 h-5 rounded-full transition-colors ${
                      i < pin.length ? 'bg-[var(--ink)]' : 'bg-[var(--border)]'
                    }`}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="h-14 bg-white border border-[var(--border)] rounded-2xl text-xl font-bold font-mono text-[var(--ink)] hover:bg-[var(--paper)] transition-colors active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinInput('0')}
                  className="h-14 bg-white border border-[var(--border)] rounded-2xl text-xl font-bold font-mono text-[var(--ink)] hover:bg-[var(--paper)] transition-colors active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  className="h-14 bg-[var(--paper)] border border-[var(--border)] rounded-2xl flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors active:scale-95"
                >
                  ⌫
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
