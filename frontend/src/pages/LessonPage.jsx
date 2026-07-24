import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { BookOpen, ArrowRight, HelpCircle } from 'lucide-react';
import api from '../services/api';

export default function LessonPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dummy content matching the mock
  const lesson = {
    title: 'Variables and Constants',
    citation: 'NCERT Class 8 Mathematics, Chapter 2, Section 2.1',
    content: [
      "An algebraic expression is a combination of variables and constants, connected by mathematical operations (+, -, ×, ÷).",
      "A variable is a symbol, usually a letter like x, y, or z, that represents an unknown value. Its value can change or vary.",
      "A constant is a fixed numerical value, like 5, -3, or ½. Its value never changes."
    ],
    example: {
      title: 'Expression: 3x + 5',
      breakdown: [
        'x is the variable',
        '3 is the coefficient of x',
        '5 is the constant'
      ]
    }
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

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
        currentStep={2} 
      />

      <div className="eyebrow flex items-center gap-2 mb-2">
        <BookOpen size={14} /> Concept Focus
      </div>
      <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight mb-8">
        {lesson.title}
      </h1>

      <div className="card paper-texture p-8 md:p-10 mb-8 border-[var(--border)] shadow-sm">
        <div className="inline-block bg-[var(--marigold-soft)] text-[#8C5C13] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
          {lesson.citation}
        </div>

        <div className="space-y-4 mb-8 text-[15.5px] leading-[1.7] text-[var(--ink)] font-medium">
          {lesson.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <div className="bg-white/60 p-6 rounded-[var(--radius-md)] border border-[var(--border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-4">{lesson.example.title}</h3>
          <ul className="list-disc pl-5 space-y-2 text-[var(--ink)] font-medium">
            {lesson.example.breakdown.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-[var(--border)] pt-6">
        <button onClick={() => navigate('/student/doubt')} className="btn btn-ghost">
          <HelpCircle size={16} /> I'm Confused
        </button>
        <button onClick={() => navigate('/student/practice')} className="btn btn-primary px-8">
          Start Practice <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
