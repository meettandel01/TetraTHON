import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import ConceptGraph from '../components/ConceptGraph';
import { Play, Lock } from 'lucide-react';

export default function LearningPathPage() {
  const navigate = useNavigate();
  
  const concepts = [
    { id: 'c1', name: 'Integer Operations', short: 'Integers', status: 'mastered', score: 92 },
    { id: 'c2', name: 'Variable & Constant Identification', short: 'Variables', status: 'mastered', score: 85 },
    { id: 'c4', name: 'One-Step Linear Equation', short: 'One-Step', status: 'weak', score: 40, current: true },
    { id: 'c5', name: 'Two-Step Linear Equation', short: 'Two-Step', status: 'locked', score: 0 },
  ];

  return (
    <div className="max-w-[900px] mx-auto animate-fade-in">
      <Stepper 
        steps={[
          { label: 'Diagnostic' },
          { label: 'Path' },
          { label: 'Lesson' },
          { label: 'Practice' },
          { label: 'Summary' }
        ]} 
        currentStep={1} 
      />

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <div className="eyebrow">Your Curriculum</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Learning Path</h1>
          <p className="text-[var(--ink-soft)] font-medium">Class 8 · NCERT Ch 2</p>
        </div>
        <div className="flex gap-2 bg-white rounded-full p-1 border border-[var(--border)] shadow-sm">
          <button className="px-4 py-1.5 rounded-full bg-[var(--ink)] text-white text-[13px] font-bold">CBSE</button>
          <button className="px-4 py-1.5 rounded-full text-[var(--ink-soft)] hover:bg-[#F2EEE1] text-[13px] font-bold transition-colors">ICSE</button>
          <button className="px-4 py-1.5 rounded-full text-[var(--ink-soft)] hover:bg-[#F2EEE1] text-[13px] font-bold transition-colors">State Board</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-8">
        <div className="bg-[#F9F8F5] p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="mb-0 text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] flex items-center gap-2">
            Concept Dependency Graph
          </h3>
          <div className="flex gap-4 text-[12px] font-bold text-[var(--ink-faint)]">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--forest)]" /> Mastered</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--marigold-dark)]" /> Needs Work</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#E4DECD]" /> Locked</span>
          </div>
        </div>
        <ConceptGraph />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concepts.map((c, idx) => (
          <div key={c.id} className={`p-5 rounded-[var(--radius-md)] border flex items-center gap-4 transition-all ${c.current ? 'bg-white border-[var(--sky)] shadow-sm' : 'bg-[#F9F8F5] border-[var(--border)] opacity-80'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
              c.status === 'mastered' ? 'bg-[var(--forest-soft)] text-[var(--forest)]' :
              c.status === 'weak' ? 'bg-[var(--marigold-soft)] text-[var(--marigold-dark)] border-2 border-[var(--marigold-dark)] shadow-[0_0_0_3px_var(--paper)]' :
              'bg-[#E4DECD] text-[#A69F8E]'
            }`}>
              {c.status === 'locked' ? <Lock size={18} /> : `${c.score}%`}
            </div>
            
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase text-[var(--ink-faint)] tracking-wider mb-1">Concept {idx + 1}</div>
              <div className="font-bold text-[var(--ink)] leading-snug">{c.name}</div>
            </div>

            {c.current && (
              <button onClick={() => navigate('/student/lesson')} className="btn btn-primary btn-sm px-4">
                Start <Play size={14} fill="currentColor" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
