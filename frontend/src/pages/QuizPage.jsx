import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Stepper from '../components/Stepper';
import toast from 'react-hot-toast';
import { Target, Check, X, ArrowRight, Clock } from 'lucide-react';
import api from '../services/api';

const TOTAL_QUESTIONS = 5;

export default function QuizPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      // Fetch quiz questions. Using the existing /api/quiz/questions endpoint.
      const res = await api.get('/quiz/questions');
      setQuestions(res.data);
    } catch (e) {
      console.error(e);
      // Fallback dummy data for demo
      setQuestions([
        { id: '1', text: 'Which of the following is a linear equation in one variable?', concept: 'Variables', difficulty: 'easy', options: { A: 'x + y = 5', B: 'x² + 2 = 6', C: '2x - 3 = 7', D: 'x³ = 8' }, correct: 'C' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (key) => {
    if (revealed || checking) return;
    setSelected(key);
  };

  const handleCheck = async () => {
    if (!selected || checking) return;
    setChecking(true);
    try {
      const q = questions[currentIdx];
      // Simulated check for demo
      const isCorrect = selected === q.correct;
      setFeedback({
        isCorrect,
        correct_option: q.correct,
        explanation: isCorrect ? "Great job! That's correct." : "Not quite. Remember that a linear equation in one variable has only one variable with a maximum power of 1."
      });
      setRevealed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length || currentIdx + 1 >= TOTAL_QUESTIONS) {
      // Simulate analysis delay
      navigate('/student/summary'); // Navigate to result page
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
      setFeedback(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  const q = questions[currentIdx];
  if (!q) return null;

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
        currentStep={0} 
      />

      <div className="card">
        <div className="flex justify-between items-center mb-8 border-b border-[var(--border)] pb-4">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[var(--sky)]' : 'border border-[var(--sky)] bg-transparent'}`} />
            ))}
          </div>
          <div className="text-sm font-bold text-[var(--ink-soft)] flex items-center gap-2">
            <Clock size={16} /> 00:54
          </div>
        </div>

        <h2 className="text-2xl mb-8 leading-snug">{q.text}</h2>

        <div className="space-y-3 mb-8">
          {Object.entries(q.options || {}).map(([k, v]) => {
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
              if (k === feedback.correct_option) {
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
                {revealed && k === feedback.correct_option && <Check className="text-[var(--forest)]" />}
                {revealed && isSelected && !feedback.isCorrect && <X className="text-[var(--redpen)]" />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={`p-4 rounded-[var(--radius-sm)] mb-8 border ${feedback.isCorrect ? 'bg-[var(--forest-soft)] border-[var(--forest)] text-[var(--forest)]' : 'bg-[var(--redpen-soft)] border-[var(--redpen)] text-[var(--redpen)]'}`}>
            <div className="font-bold mb-1 flex items-center gap-2">
              {feedback.isCorrect ? <Check size={18} /> : <X size={18} />}
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            <div className="text-sm text-[var(--ink)] font-medium">{feedback.explanation}</div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-[13px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
            {currentIdx + 1} of {TOTAL_QUESTIONS}
          </div>
          {!revealed ? (
            <button 
              onClick={handleCheck}
              disabled={!selected || checking}
              className="btn btn-primary"
            >
              Check Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn btn-primary">
              {currentIdx + 1 >= TOTAL_QUESTIONS ? 'Finish Diagnostic' : 'Next Question'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
