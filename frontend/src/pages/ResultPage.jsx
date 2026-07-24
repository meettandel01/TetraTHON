import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import confetti from 'canvas-confetti';
import { ArrowRight, Star, Target, Zap, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ResultPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#047857', '#F0A23A', '#D93A3A', '#3457D6'] });
  }, []);

  return (
    <div className="max-w-[720px] mx-auto animate-fade-in">
      <Stepper 
        steps={[
          { label: 'Diagnostic' },
          { label: 'Path' },
          { label: 'Lesson' },
          { label: 'Practice' },
          { label: 'Summary' }
        ]} 
        currentStep={4} 
      />

      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-[var(--forest-soft)] text-[var(--forest)] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          🎉
        </div>
        <h1 className="text-4xl font-serif text-[var(--ink)] mb-2">Session Complete!</h1>
        <p className="text-[var(--ink-soft)] font-medium">Great work, {user?.name?.split(' ')[0]}. You've made solid progress today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center p-6">
          <div className="text-[var(--ink-faint)] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><Target size={14} /> Score</div>
          <div className="text-3xl font-bold text-[var(--ink)]">4/5</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-[var(--ink-faint)] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><Star size={14} /> XP Earned</div>
          <div className="text-3xl font-bold text-[var(--marigold-dark)]">+60</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-[var(--ink-faint)] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><Zap size={14} /> Streak</div>
          <div className="text-3xl font-bold text-[var(--sky)]">4 Days</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-[var(--ink-faint)] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><TrendingUp size={14} /> Mastery</div>
          <div className="text-3xl font-bold text-[var(--forest)]">+12%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-[var(--ink)] to-[var(--ink-2)] text-white border-none flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[var(--marigold-soft)] flex items-center justify-center text-3xl shrink-0 shadow-[0_0_20px_rgba(240,162,58,0.4)]">
            🌟
          </div>
          <div>
            <div className="text-[var(--marigold-soft)] text-[11px] font-bold uppercase tracking-wider mb-1">Badge Unlocked</div>
            <h3 className="text-white text-xl mb-1">Problem Solver</h3>
            <p className="text-[#C7C4E0] text-sm">Answered 10 practice questions correctly across sessions.</p>
          </div>
        </div>

        <div className="card p-6 border-[var(--forest)] bg-[var(--forest-soft)] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--forest)] text-white flex items-center justify-center font-bold">↑</div>
            <div className="font-bold text-[var(--forest)] text-lg">Concept Mastered!</div>
          </div>
          <p className="text-[var(--forest)] font-medium text-sm pl-11">
            "Variable & Constant Identification" moved from <strong>Needs Work</strong> to <strong>Mastered</strong>.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary px-8 py-3 text-lg">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
