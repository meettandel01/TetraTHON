import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { useAuth } from '../context/AuthContext';
import { lessonsApi } from '../services/api';
import { XCircle } from 'lucide-react';

export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  
  const lesson = location.state?.lesson;
  const sessionId = location.state?.sessionId;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // If accessed directly without lesson state, redirect
  if (!lesson) {
    return <Navigate to="/student/learning-path" replace />;
  }

  const q = lesson.practice_questions[currentIdx];

  const handleCheck = async () => {
    if (!selected) return;
    setSubmitting(true);
    
    try {
      const isCorrect = selected === q.correct;
      
      const res = await lessonsApi.submitPractice({
        student_id: user.student_id,
        lesson_id: String(lesson.id || '1'),
        question_id: String(q.id || '1'),
        selected_option: selected,
        correct_option: q.correct,
        concept: q.concept || lesson.concept || 'Mathematics'
      });
      
      const xpReward = res?.data?.xp_reward || (isCorrect ? 15 : 5);
      if (res?.data?.total_xp) {
        updateUser({ xp: res.data.total_xp });
      }
      
      setFeedback({
        isCorrect,
        xpReward,
        explanation: q.explanation
      });
      setTotalAnswered(prev => prev + 1);
      if (isCorrect) setCorrectCount(prev => prev + 1);
      setRevealed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIdx < lesson.practice_questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelected('');
      setRevealed(false);
      setFeedback(null);
    } else {
      // Mark session complete
      setSubmitting(true);
      try {
        const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
        const res = await lessonsApi.completeSession(user.student_id, lesson.id, timeSpent);
        if (res?.data?.total_xp) {
            updateUser({ xp: res.data.total_xp });
        }
        navigate('/student/summary', { state: { practiceScore: totalAnswered > 0 ? correctCount / totalAnswered : 0, correctCount, totalAnswered } });
      } catch (err) {
        console.error(err);
        navigate('/student/summary', { state: { practiceScore: totalAnswered > 0 ? correctCount / totalAnswered : 0, correctCount, totalAnswered } });
      }
    }
  };

  return (
    <div className="screen">
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
      <div className="card card-narrow">
        <div className="practice-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="eyebrow" style={{ margin: 0 }}>Practice &middot; Question {currentIdx + 1} of {lesson.practice_questions.length}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/setup')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={16} /> Switch Topic
          </button>
        </div>
        <h2 className="q-text">{q.text}</h2>
        
        <div className="options-grid" style={{ marginTop: '24px' }}>
          {Object.entries(q.options).map(([optKey, optVal]) => {
            let className = "option-card";
            if (selected === optKey) className += " selected";
            if (revealed) {
              if (optKey === q.correct) className += " correct";
              else if (selected === optKey && optKey !== q.correct) className += " incorrect";
            }

            return (
              <button 
                key={optKey} 
                className={className}
                onClick={() => !revealed && setSelected(optKey)}
                disabled={revealed || submitting}
              >
                <div className="option-label">{optKey}</div>
                <div className="option-content">{optVal}</div>
              </button>
            );
          })}
        </div>

        {revealed ? (
          <>
            <div className={`feedback-panel ${feedback.isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
              <p className="feedback-headline">
                {feedback.isCorrect ? '✓ Correct!' : '✕ Not quite'} <span className="xp-pill">+{feedback.xpReward} XP</span>
              </p>
              <p className="muted">{feedback.explanation}</p>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleNext} disabled={submitting}>
              {currentIdx < lesson.practice_questions.length - 1 ? 'Next question &rarr;' : 'Finish practice &rarr;'}
            </button>
          </>
        ) : (
          <button 
            className="btn btn-primary btn-block mt-4" 
            disabled={!selected || submitting} 
            onClick={handleCheck}
            style={{ marginTop: '24px' }}
          >
            {submitting ? 'Checking...' : 'Check answer'}
          </button>
        )}
      </div>
    </div>
  );
}
