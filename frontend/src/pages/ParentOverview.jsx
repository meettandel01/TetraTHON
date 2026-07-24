import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, TrendingUp, Sparkles, Clock, Calendar } from 'lucide-react';

export default function ParentOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const digest = {
    child: 'Aditi K.',
    period: 'This Week',
    highlights: [
      "Mastered 3 new concepts in Algebra.",
      "Achieved a 4-day learning streak.",
      "Asked 2 great doubts about variables."
    ],
    upcoming: [
      "Unit Test on Chapter 2 next Wednesday.",
      "Recommended: 15 minutes of practice this weekend."
    ]
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  return (
    <div className="max-w-[800px] mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="eyebrow">Parent Portal</div>
        <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Welcome, {user?.name}</h1>
        <p className="text-[var(--ink-soft)] font-medium">Here's how {digest.child} is doing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 bg-[var(--forest-soft)] border-[var(--forest)] text-[var(--forest)] flex flex-col justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--forest)] text-white flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={24} />
          </div>
          <div className="text-[32px] font-serif mb-1">82%</div>
          <div className="text-[13px] font-bold uppercase tracking-wider">Overall Mastery</div>
        </div>
        
        <div className="card p-6 bg-[var(--marigold-soft)] border-[var(--marigold)] text-[#8C5C13] flex flex-col justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--marigold-dark)] text-white flex items-center justify-center mx-auto mb-3">
            <Clock size={24} />
          </div>
          <div className="text-[32px] font-serif mb-1">4.2 hrs</div>
          <div className="text-[13px] font-bold uppercase tracking-wider">Learning Time This Week</div>
        </div>
      </div>

      <div className="card p-8 mb-8 border-[var(--border)] shadow-sm">
        <h3 className="text-xl mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--marigold)]" /> Weekly Digest
        </h3>
        <div className="space-y-3 mb-8">
          {digest.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--forest-soft)] text-[var(--forest)] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
              <p className="text-[15px] font-medium text-[var(--ink)]">{h}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#F9F8F5] p-5 rounded-[var(--radius-md)] border border-[var(--border)]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-3 flex items-center gap-2">
            <Calendar size={16} /> Upcoming
          </h4>
          <ul className="list-disc pl-5 space-y-2 text-[var(--ink)] font-medium text-[14px]">
            {digest.upcoming.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
