import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Users, AlertCircle, ArrowRight, Check } from 'lucide-react';
import api from '../services/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Mock Data
  const escalations = [
    {
      id: 1,
      student: 'Rahul V.',
      avatar: 'R',
      type: 'Concept Gap',
      message: 'Failed diagnostic for "Like Terms" despite mastering prerequisites.',
      time: '10 mins ago',
      color: 'marigold'
    },
    {
      id: 2,
      student: 'Maya S.',
      avatar: 'M',
      type: 'High Failure Rate',
      message: 'Failed 3 practice sets in a row on "Two-Step Equations". Needs intervention.',
      time: '1 hr ago',
      color: 'redpen'
    }
  ];

  const roster = [
    { name: 'Aditi K.', status: 'on-track', progress: [1, 1, 1, 0, 0] },
    { name: 'Rahul V.', status: 'stuck', progress: [1, 1, 0, -1, 0] },
    { name: 'Maya S.', status: 'stuck', progress: [1, 0, -1, -1, 0] },
    { name: 'Kabir D.', status: 'on-track', progress: [1, 1, 1, 1, 0] },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <div className="eyebrow">Teacher Dashboard</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Hi, {user?.name || 'Teacher'}</h1>
          <p className="text-[var(--ink-soft)] font-medium">Class 8-A Mathematics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--forest-soft)] text-[var(--forest)] flex items-center justify-center">
              <Target size={20} />
            </div>
          </div>
          <div className="text-[32px] font-serif text-[var(--ink)] mb-1">78%</div>
          <div className="text-[13px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Avg Class Mastery</div>
        </div>
        
        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#E4DECD] text-[#A69F8E] flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-[32px] font-serif text-[var(--ink)] mb-1">32 / 35</div>
          <div className="text-[13px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Active Students</div>
        </div>

        <div className="card p-6 bg-[var(--redpen)] text-white border-none">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="text-[32px] font-serif text-white mb-1">2</div>
          <div className="text-[13px] font-bold text-white/80 uppercase tracking-wider">Pending Interventions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Escalation Inbox */}
        <div className="lg:col-span-2">
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-[var(--redpen)]" /> Escalation Inbox
          </h3>
          
          <div className="space-y-4">
            {escalations.map((esc) => (
              <div key={esc.id} className="card p-5 border-l-4" style={{ borderLeftColor: `var(--${esc.color})` }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--${esc.color}-soft)] text-[var(--${esc.color}-dark)]`}>
                      {esc.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--ink)]">{esc.student}</div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">{esc.time}</div>
                    </div>
                  </div>
                  <div className={`badge-${esc.color === 'redpen' ? 'hard' : 'medium'}`}>
                    {esc.type}
                  </div>
                </div>
                <p className="text-[14px] text-[var(--ink-soft)] font-medium mb-4 ml-11">
                  {esc.message}
                </p>
                <div className="flex justify-end gap-2">
                  <button className="btn btn-ghost btn-sm">Mark Resolved</button>
                  <button className="btn btn-primary btn-sm px-4">Intervene <ArrowRight size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Roster */}
        <div>
          <h3 className="text-xl mb-4">Class Roster</h3>
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {roster.map((s, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F9F8F5] transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold text-[var(--ink)] text-sm mb-1">{s.name}</div>
                    <div className="flex gap-1">
                      {s.progress.map((p, idx) => (
                        <div key={idx} className={`w-4 h-1.5 rounded-full ${
                          p === 1 ? 'bg-[var(--forest)]' : 
                          p === -1 ? 'bg-[var(--redpen)]' : 
                          'bg-[#E4DECD]'
                        }`} />
                      ))}
                    </div>
                  </div>
                  {s.status === 'stuck' ? (
                    <AlertCircle size={16} className="text-[var(--redpen)]" />
                  ) : (
                    <Check size={16} className="text-[var(--forest)]" />
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#F9F8F5] text-center border-t border-[var(--border)]">
              <button className="text-[var(--sky)] text-sm font-bold hover:underline">View All Students</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
