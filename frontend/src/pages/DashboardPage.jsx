import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, Zap, Clock, ChevronRight, Play } from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const xpRes = await api.get(`/gamification/${user.student_id}`);
      
      setStats({
        xp: xpRes.data.xp,
        level: xpRes.data.level,
        streak: 4 // Mocked for now
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  return (
    <div className="max-w-[900px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="eyebrow">Student Dashboard</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Hi, {user.name.split(' ')[0]}</h1>
          <p className="text-[var(--ink-soft)] font-medium">Ready to continue your math journey?</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="streak-chip flex items-center gap-1.5">
            <Zap size={16} fill="currentColor" />
            {stats.streak} Day Streak
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Main Action Card */}
        <div className="md:col-span-2 card p-0 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--marigold-soft)] rounded-bl-[100px] -z-10 opacity-50"></div>
          
          <div className="p-8 flex-1">
            <div className="badge-foundational mb-4 inline-flex items-center gap-1">
              <Target size={12} /> Up Next
            </div>
            <h2 className="text-2xl font-serif text-[var(--ink)] mb-2">Linear Equations in One Variable</h2>
            <p className="text-[var(--ink-soft)] max-w-[80%] mb-6">Master the basics of variables and constants before moving on to complex equations.</p>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase text-[var(--ink-faint)] tracking-wider">Concept Mastery</span>
              <div className="flex-1 h-1.5 bg-[var(--paper-line)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--marigold)] rounded-full w-[40%]"></div>
              </div>
              <span className="text-xs font-bold text-[var(--ink)]">40%</span>
            </div>
          </div>
          
          <div className="bg-[#F9F8F5] p-5 border-t border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-[var(--ink)]">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-[var(--border)] flex items-center justify-center">
                <Clock size={14} className="text-[var(--ink-soft)]" />
              </div>
              Est. 12 mins
            </div>
            <button onClick={() => navigate('/student/diagnostic')} className="btn btn-primary shadow-sm hover:shadow-md">
              <Play size={16} fill="currentColor" /> Resume Path
            </button>
          </div>
        </div>

        {/* Gamification Stats */}
        <div className="card bg-[var(--ink)] text-white border-none flex flex-col justify-between">
          <div>
            <h3 className="text-white mb-6">Your Progress</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <div className="text-[var(--ink-faint)] text-sm font-medium">Total XP</div>
                <div className="text-3xl font-serif text-[var(--marigold)]">{stats.xp}</div>
              </div>
              <div className="h-2 bg-[#2B3350] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--marigold)] rounded-full w-[65%]"></div>
              </div>
              <div className="text-right text-[10px] text-[var(--ink-faint)] mt-1 uppercase tracking-wider font-bold">Level 4</div>
            </div>
          </div>
          
          <div className="bg-[#2B3350] rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--marigold-soft)] text-[var(--marigold-dark)] flex items-center justify-center font-bold text-lg shrink-0">
              🏆
            </div>
            <div>
              <div className="text-[13px] font-bold text-white mb-0.5">Problem Solver</div>
              <div className="text-[11px] text-[#A8A4C4] leading-snug">Answer 3 more practice questions to unlock.</div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="mb-0">Recent Activity</h3>
            <button className="text-[var(--sky)] text-sm font-bold hover:underline flex items-center">View all <ChevronRight size={14}/></button>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--forest-soft)] text-[var(--forest)] flex items-center justify-center shrink-0 mt-1">✓</div>
              <div>
                <div className="font-bold text-[var(--ink)] text-sm mb-0.5">Mastered "Variable Identification"</div>
                <div className="text-xs text-[var(--ink-soft)]">Yesterday · +50 XP</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--marigold-soft)] text-[var(--marigold-dark)] flex items-center justify-center shrink-0 mt-1">?</div>
              <div>
                <div className="font-bold text-[var(--ink)] text-sm mb-0.5">Asked doubt in "Like Terms"</div>
                <div className="text-xs text-[var(--ink-soft)]">2 days ago · Resolved by Tutor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
