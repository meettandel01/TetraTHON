import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { Target, Check, X, ArrowRight, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PracticePage() {
  const navigate = useNavigate();
  
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const question = {
    text: "Identify the variable in the equation: 4m - 7 = 9",
    options: {
      A: "4",
      B: "m",
      C: "7",
      D: "9"
    },
    correct: "B",
    hints: [
      "A variable is a symbol used to represent an unknown value.",
      "Variables are usually represented by letters from the alphabet.",
      "Look for a letter next to a number in the equation."
    ]
  };

  const handleSelect = (k) => {
    if (revealed) return;
    setSelected(k);
  };

  const handleCheck = () => {
    if (!selected) return;
    const isCorrect = selected === question.correct;
    setFeedback({
      isCorrect,
      explanation: isCorrect ? "Excellent! 'm' is the variable because it represents an unknown quantity." : "Not quite. Remember that variables are usually letters representing unknowns."
    });
    setRevealed(true);
  };

  const handleNext = () => {
    navigate('/student/summary');
  };

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
        currentStep={3} 
      />

      <div className="flex justify-between items-center mb-6">
        <div className="badge-grade flex items-center gap-1.5">
          <Target size={12} /> Practice Set
        </div>
        <div className="text-sm font-bold text-[var(--ink-soft)] uppercase tracking-wider">
          Q1 / 5
        </div>
      </div>

      <div className="card p-6 md:p-8 mb-6">
        <h2 className="text-2xl mb-8 leading-snug">{question.text}</h2>
        
        <div className="space-y-3">
          {Object.entries(question.options).map(([k, v]) => {
            const isSelected = selected === k;
            let btnClass = "w-full text-left p-4 rounded-[var(--radius-md)] border-2 transition-all flex items-center gap-4 bg-white text-[var(--ink)] ";
            let iconClass = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ";
            
            if (!revealed) {
              if (isSelected) {
                btnClass += "border-[var(--sky)] shadow-[0_4px_12px_rgba(52,87,214,0.1)]";
                iconClass += "bg-[var(--sky)] text-white";
              } else {
                btnClass += "border-[var(--border)] hover:border-[var(--sky-soft)]";
                iconClass += "bg-[#F2EEE1] text-[var(--ink-soft)]";
              }
            } else {
              if (k === question.correct) {
                btnClass += "border-[var(--forest)] bg-[var(--forest-soft)]";
                iconClass += "bg-[var(--forest)] text-white";
              } else if (isSelected && !feedback.isCorrect) {
                btnClass += "border-[var(--redpen)] bg-[var(--redpen-soft)]";
                iconClass += "bg-[var(--redpen)] text-white";
              } else {
                btnClass += "border-[var(--border)] opacity-60";
                iconClass += "bg-[#F2EEE1] text-[var(--ink-soft)]";
              }
            }

            return (
              <button 
                key={k} 
                onClick={() => handleSelect(k)}
                disabled={revealed}
                className={btnClass}
              >
                <div className={iconClass}>{k}</div>
                <div className="flex-1 font-semibold">{v}</div>
                {revealed && k === question.correct && <Check className="text-[var(--forest)]" />}
                {revealed && isSelected && !feedback.isCorrect && <X className="text-[var(--redpen)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {revealed && (
        <div className={`p-4 rounded-[var(--radius-md)] mb-6 border-2 flex items-start gap-4 animate-fade-in ${feedback.isCorrect ? 'bg-[var(--forest-soft)] border-[var(--forest)]' : 'bg-[var(--redpen-soft)] border-[var(--redpen)]'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${feedback.isCorrect ? 'bg-[var(--forest)] text-white' : 'bg-[var(--redpen)] text-white'}`}>
            {feedback.isCorrect ? <Check size={16} /> : <X size={16} />}
          </div>
          <div className="flex-1">
            <div className={`font-bold mb-1 ${feedback.isCorrect ? 'text-[var(--forest)]' : 'text-[var(--redpen)]'}`}>
              {feedback.isCorrect ? 'Excellent! (+15 XP)' : 'Not Quite'}
            </div>
            <div className="text-sm font-medium text-[var(--ink)]">{feedback.explanation}</div>
          </div>
        </div>
      )}

      {/* Hints System */}
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-md)] p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
            <Lightbulb size={18} className="text-[var(--marigold)]" />
            Need a hint? (-3 XP)
          </div>
          <button 
            onClick={() => setHintsUsed(h => Math.min(h + 1, 3))}
            disabled={hintsUsed >= 3 || revealed}
            className="btn btn-ghost btn-sm"
          >
            Reveal Hint {hintsUsed < 3 ? `(${hintsUsed + 1}/3)` : ''}
          </button>
        </div>
        
        {hintsUsed > 0 && (
          <div className="space-y-2 mt-4 animate-fade-in">
            {question.hints.slice(0, hintsUsed).map((h, i) => (
              <div key={i} className="text-sm font-medium text-[var(--ink-soft)] pl-6 border-l-2 border-[var(--marigold)] py-1">
                <span className="font-bold mr-2 text-[var(--ink)]">Hint {i+1}:</span> {h}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {!revealed ? (
          <button onClick={handleCheck} disabled={!selected} className="btn btn-primary px-8">
            Check Answer
          </button>
        ) : (
          <button onClick={handleNext} className="btn btn-primary px-8">
            Continue <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
