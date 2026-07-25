import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { useAuth } from '../context/AuthContext';
import { lessonsApi } from '../services/api';

export default function LessonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const conceptId = location.state?.conceptId || location.state?.concept_id;

  useEffect(() => {
    if (!user) return;
    if (!conceptId) {
      navigate('/student/learning-path');
      return;
    }
    loadLesson();
  }, [user, conceptId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const res = await lessonsApi.getByLevel(user.level || 'Foundational', conceptId);
      const matchedLesson = res.data;
      
      if (!matchedLesson) {
        setLesson(null);
        return;
      }
      
      setLesson(matchedLesson);
      
      const sessionRes = await lessonsApi.startSession(user.student_id, matchedLesson.id || String(conceptId));
      setSessionId(sessionRes.data.session_id);
    } catch (err) {
      console.error(err);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  if (!lesson) {
    return (
      <div className="screen">
        <div className="card card-narrow center-card" style={{padding: '40px', textAlign: 'center'}}>
          <h3>Lesson content not available</h3>
          <p className="muted">This concept does not have generated content for your current level yet.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/student/learning-path')}>Back to Learning Path</button>
        </div>
      </div>
    );
  }

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
        currentStep={2} 
      />
      <div className="card card-narrow paper-texture lesson-card">
        <p className="eyebrow">Micro-lesson</p>
        <h2>{lesson.title}</h2>
        <p className="lesson-p"><strong>{lesson.content.intro}</strong></p>
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: lesson.content.explanation.replace(/\n/g, '<br/>') }} />
        
        {lesson.content.visual_hint && (
          <div className="lesson-example mt-4">
            <p className="lesson-example-title">Visual Hint</p>
            <p>{lesson.content.visual_hint}</p>
          </div>
        )}
        
        {lesson.content.real_world && (
          <div className="lesson-example mt-4" style={{borderLeftColor: 'var(--ocean)'}}>
            <p className="lesson-example-title" style={{color: 'var(--ocean)'}}>Real World Application</p>
            <p>{lesson.content.real_world}</p>
          </div>
        )}

        <div className="lesson-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/student/doubt')}>I have a doubt</button>
          <button className="btn btn-primary" onClick={() => navigate('/student/practice', { state: { lesson, sessionId } })}>I understand — start practice &rarr;</button>
        </div>
      </div>
    </div>
  );
}
