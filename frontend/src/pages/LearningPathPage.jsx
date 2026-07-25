import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import Stepper from '../components/Stepper';
import ConceptGraph from '../components/ConceptGraph';

function masteryColor(score) {
  const hue = Math.max(0, Math.min(1, score)) * 122;
  return `hsl(${hue.toFixed(0)}, 58%, 42%)`;
}

export default function LearningPathPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [level, setLevel] = useState(null);
  const [masteryMap, setMasteryMap] = useState({});
  const [lessonConcept, setLessonConcept] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [inSession, setInSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.get(user.student_id);
      setLevel(res.data.student.level || 'Foundational');
      
      const mMap = {};
      res.data.concept_graph.nodes.forEach(n => {
        mMap[n.id] = n.mastery !== null ? (n.mastery / 100) : 0;
      });
      setMasteryMap(mMap);
      setGraphData(res.data.concept_graph);

      if (res.data.chapters && res.data.chapters.length > 0) {
        setChapters(res.data.chapters);
        setActiveChapter(res.data.chapters[0].id);
      }

      // Build concepts from API graph data
      const apiConcepts = res.data.concept_graph.nodes
        .filter(n => n.status !== 'chapter' && !String(n.id).startsWith('ch_'))
        .map(n => ({
          id: n.id,
          short: n.name.length > 12 ? n.name.substring(0, 10) + '..' : n.name,
          name: n.name,
          ncert: '',
        }));
      setConcepts(apiConcepts);

      const hasActiveSession = res.data.stats.sessions_total > res.data.stats.sessions_completed;
      setInSession(hasActiveSession);

      let nextConcept = null;
      for (let i = 0; i < apiConcepts.length; i++) {
        const c = apiConcepts[i];
        const score = mMap[c.id] || 0;
        const unlocked = i === 0 || (mMap[apiConcepts[i-1].id] || 0) >= 0.4;
        if (unlocked && score < 0.8) {
          nextConcept = c.id;
          break;
        }
      }
      setLessonConcept(nextConcept || (apiConcepts.length > 0 ? apiConcepts[apiConcepts.length-1].id : null));
    } catch (err) {
      console.error(err);
      setMasteryMap({});
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  return (
    <div className="screen">
      {inSession ? (
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
      ) : (
        <div className="card curriculum-picker">
          <p className="eyebrow">Curriculum scope</p>
          <div className="curr-row">
            <div className="curr-group">
              <span className="curr-label">Board</span>
              <div className="curr-chip-row">
                <button className="curr-chip active">NCERT</button>
                <button className="curr-chip planned">State Boards <span className="soon-tag">soon</span></button>
              </div>
            </div>
            <div className="curr-group">
              <span className="curr-label">Subject</span>
              <div className="curr-chip-row">
                <button className="curr-chip active">Mathematics</button>
                <button className="curr-chip planned">Science <span className="soon-tag">soon</span></button>
              </div>
            </div>
          </div>
          <div className="curr-group">
            <span className="curr-label">Chapter</span>
            <div className="curr-chip-row">
              {chapters.length > 0 ? chapters.map((ch, idx) => (
                <button 
                  key={ch.id} 
                  className={`curr-chip ${activeChapter === ch.id ? 'active' : ''}`}
                  onClick={() => setActiveChapter(ch.id)}
                >
                  Ch {ch.number || idx + 1} &middot; {ch.name}
                </button>
              )) : (
                <button className="curr-chip active">Ch 2 &middot; Linear Equations in One Variable</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <h1>Your Learning Path</h1>
          <p className="page-sub">
            Track: <span className="badge-advanced badge-sm">{level}</span> &middot; {chapters.find(c => c.id === activeChapter)?.name || 'Linear Equations in One Variable'}
          </p>
        </div>
      </div>

      <div className="grid-graph-list">
        <div className="card">
          <p className="eyebrow">Prerequisite concept graph</p>
          <ConceptGraph data={graphData} masteryMap={masteryMap} currentId={lessonConcept} />
          <p className="muted small">Each node is validated against the concept DAG on the backend.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Concepts in this chapter</p>
          {concepts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-faint)' }}>
              No concepts available for this track yet. Please ask an admin to add concepts.
            </div>
          ) : (
            <div className="path-list">
              {concepts.map((c, i) => {
                const unlocked = i === 0 || (masteryMap[concepts[i-1]?.id] || 0) >= 0.4;
                const score = masteryMap[c.id] || 0;
                
                return (
                  <div key={c.id} className={`path-row ${unlocked ? '' : 'locked'}`}>
                    <div className="path-row-ring" style={{ '--v': `${score*100}%`, '--c': unlocked ? masteryColor(score) : '#C7C2B3' }}>
                      <span>{unlocked ? Math.round(score*100) : '🔒'}</span>
                    </div>
                    <div className="path-row-mid">
                      <div className="path-row-title">{c.name}</div>
                      <div className="path-row-ncert">{c.ncert}</div>
                    </div>
                    {!unlocked ? (
                      <span className="muted small">Locked — reach 40% on the prior concept</span>
                    ) : c.id === lessonConcept ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/lesson', { state: { conceptId: c.id } })}>Start lesson &rarr;</button>
                    ) : (
                      <span className="muted small">{score >= 0.7 ? 'Mastered' : 'Available'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
