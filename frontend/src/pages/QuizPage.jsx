import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Stepper from '../components/Stepper';
import api, { quizApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Dynamic assessment target
const DEFAULT_TOTAL_QUESTIONS = 5;

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const conceptId = location.state?.concept_id || 1; // Default to 1 if directly accessed
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [conceptId]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/quiz/questions?concept_id=${conceptId}`);
      if (Array.isArray(res.data)) {
        setQuestions(res.data);
      } else {
        throw new Error("Response is not an array");
      }
    } catch (e) {
      console.error('Failed to fetch quiz questions:', e);
      // Show error state instead of fake questions
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx) => {
    setSelected(idx);
  };

  const handleNext = async () => {
    const q = questions[currentIdx];
    const isCorrect = String.fromCharCode(65 + selected) === (typeof q.correct === 'number' ? String.fromCharCode(65 + q.correct) : q.correct);
    const updatedAnswers = [...answers, {
      question_id: q.id,
      selected_option: String.fromCharCode(65 + selected),
      correct_option: typeof q.correct === 'number' ? String.fromCharCode(65 + q.correct) : q.correct,
      is_correct: isCorrect,
      difficulty: q.difficulty,
      concept_tag: q.concept
    }];
    setAnswers(updatedAnswers);

    const totalTarget = q.total_questions || DEFAULT_TOTAL_QUESTIONS;

    if (currentIdx + 1 >= totalTarget) {
      try {
        const res = await quizApi.submit(user.student_id, conceptId, updatedAnswers);
        updateUser({ level: res.data.placement_level, xp: res.data.total_xp });
        navigate('/student/diagnostic-result', { state: { results: res.data, concept_id: conceptId } });
      } catch (err) {
        console.error('Failed to submit quiz:', err);
        toast.error('Failed to submit diagnostic assessment to server. Please check connection and try again.');
      }
    } else {
      try {
        setLoading(true);
        const nextRes = await api.post('/quiz/next', {
          concept_id: conceptId,
          last_question_id: q.id,
          last_was_correct: isCorrect,
          last_difficulty: q.difficulty,
          exclude_ids: updatedAnswers.map(a => a.question_id)
        });
        
        if (nextRes.data && nextRes.data.status !== "complete") {
          setQuestions([...questions, nextRes.data]);
          setCurrentIdx(i => i + 1);
          setSelected(null);
        } else {
          const res = await quizApi.submit(user.student_id, conceptId, updatedAnswers);
          updateUser({ level: res.data.placement_level, xp: res.data.total_xp });
          navigate('/student/diagnostic-result', { state: { results: res.data, concept_id: conceptId } });
        }
      } catch (err) {
        console.error("Failed to fetch next question, submitting completed answers:", err);
        try {
          const res = await quizApi.submit(user.student_id, conceptId, updatedAnswers);
          updateUser({ level: res.data.placement_level, xp: res.data.total_xp });
          navigate('/student/diagnostic-result', { state: { results: res.data, concept_id: conceptId } });
        } catch (submitErr) {
          console.error('Failed to submit quiz after next-question error:', submitErr);
          toast.error('Failed to communicate with server.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="screen">
        <div className="card card-narrow center-card" style={{padding: '40px', textAlign: 'center'}}>
          <h3>Unable to load quiz questions</h3>
          <p className="muted">Please make sure the backend server is running and try again.</p>
          <button className="btn btn-primary" onClick={fetchQuestions}>Retry</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const answered = selected !== null;

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
        currentStep={0} 
      />

      <div className="card card-narrow diagnostic-card">
        <div className="diagnostic-head">
          <p className="eyebrow">Diagnostic Assessment &middot; Question {currentIdx + 1} of {q.total_questions || DEFAULT_TOTAL_QUESTIONS}</p>
          <div className="difficulty-track">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className={`difficulty-pip ${n <= (q?.difficulty || 1) ? 'on' : ''}`}></span>
            ))}
          </div>
        </div>
        <div className="timer-bar" key={q.id}>
          <div className="timer-bar-fill"></div>
        </div>
        
        <h2 className="q-text">{q.text}</h2>
        
        <div className="option-list">
          {(Array.isArray(q.options) ? q.options : Object.values(q.options || {})).map((optText, oi) => {
            const isSelected = selected === oi;
            const optKey = oi;
            return (
              <button 
                key={optKey}
                className={`option-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(optKey)}
              >
                <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                {optText}
              </button>
            );
          })}
        </div>
        
        <div className="diagnostic-foot">
          <button 
            className="btn btn-primary" 
            disabled={!answered} 
            onClick={handleNext}
          >
            {currentIdx + 1 >= (q.total_questions || DEFAULT_TOTAL_QUESTIONS) ? 'Finish diagnostic' : 'Next question'} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
