import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, conceptsApi } from '../services/api';
import Stepper from '../components/Stepper';
import ConceptGraph from '../components/ConceptGraph';

function masteryColor(score) {
  const hue = Math.max(0, Math.min(1, score)) * 122;
  return `hsl(${hue.toFixed(0)}, 58%, 42%)`;
}

function getLevelBadgeClass(level) {
  if (level === 'Foundational') return 'badge-foundational';
  if (level === 'Grade-Level') return 'badge-grade';
  if (level === 'Advanced') return 'badge-advanced';
  return 'badge-neutral';
}

export default function LearningPathPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [level, setLevel] = useState(null);
  const [masteryMap, setMasteryMap] = useState({});
  const [lessonConcept, setLessonConcept] = useState(null);
  
  const [allGraphNodes, setAllGraphNodes] = useState([]);
  const [allGraphEdges, setAllGraphEdges] = useState([]);
  
  const [concepts, setConcepts] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [activeSubject, setActiveSubject] = useState(null);
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
      const [res, treeRes] = await Promise.all([
        dashboardApi.get(user.student_id),
        conceptsApi.getTree()
      ]);
      
      setLevel(res.data.student.level || 'Foundational');
      
      const mMap = {};
      const cLevelMap = {};
      res.data.concept_graph.nodes.forEach(n => {
        mMap[n.id] = n.mastery !== null ? (n.mastery / 100) : 0;
        if (n.concept_level) cLevelMap[n.id] = n.concept_level;
      });
      setMasteryMap(mMap);
      
      setAllGraphNodes(res.data.concept_graph.nodes.map(n => ({ ...n, concept_level: cLevelMap[n.id] })));
      setAllGraphEdges(res.data.concept_graph.edges);

      // Process tree for subjects
      let subjs = [];
      if (treeRes.data && treeRes.data.length > 0) {
        subjs = treeRes.data[0].children; // Assuming first standard
        setSubjects(subjs);
        if (subjs.length > 0) {
          setActiveSubject(subjs[0].id);
        }
      }

      if (res.data.chapters && res.data.chapters.length > 0) {
        setChapters(res.data.chapters);
        if (!activeChapter) setActiveChapter(res.data.chapters[0].id);
      }

      const hasActiveSession = res.data.stats.sessions_total > res.data.stats.sessions_completed;
      setInSession(hasActiveSession);

    } catch (err) {
      console.error(err);
      setMasteryMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSubject || !activeChapter || allGraphNodes.length === 0) return;

    // Filter chapters based on active subject (if we had subject_id in chapters, but we rely on tree)
    const currentSubject = subjects.find(s => s.id === activeSubject);
    if (currentSubject && currentSubject.children) {
      setChapters(currentSubject.children.map(ch => ({
        id: ch.id,
        name: ch.name,
        number: ch.chapter_number || ch.id
      })));
      
      // Auto-select first chapter of new subject if current isn't in it
      if (!currentSubject.children.find(c => c.id === activeChapter)) {
        if (currentSubject.children.length > 0) {
          setActiveChapter(currentSubject.children[0].id);
          return; // Will re-trigger this effect
        }
      }
    }

    // Filter concepts to the active chapter
    const chapterNodeId = `ch_${activeChapter}`;
    const chapterConcepts = allGraphNodes
      .filter(n => n.status !== 'chapter' && n.parent_id === chapterNodeId)
      .map(n => ({
        id: n.id,
        short: n.name.length > 12 ? n.name.substring(0, 10) + '..' : n.name,
        name: n.name,
        concept_level: n.concept_level,
        ncert: '',
      }));
      
    setConcepts(chapterConcepts);

    // Filter graph to only show this chapter's nodes + the chapter node itself
    const filteredNodes = allGraphNodes.filter(n => 
      n.id === chapterNodeId || n.parent_id === chapterNodeId
    );
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = allGraphEdges.filter(e => 
      filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
    
    setGraphData({ nodes: filteredNodes, edges: filteredEdges });

    // Determine next concept
    let nextConcept = null;
    for (let i = 0; i < chapterConcepts.length; i++) {
      const c = chapterConcepts[i];
      const score = masteryMap[c.id] || 0;
      const unlocked = i === 0 || (masteryMap[chapterConcepts[i-1].id] || 0) >= 0.4;
      if (unlocked && score < 0.8) {
        nextConcept = c.id;
        break;
      }
    }
    setLessonConcept(nextConcept || (chapterConcepts.length > 0 ? chapterConcepts[chapterConcepts.length-1].id : null));
    
  }, [activeSubject, activeChapter, allGraphNodes, subjects]);

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  return (
    <div className="screen">
      {inSession ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
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
          </div>
          <button className="btn btn-ghost" onClick={() => { setInSession(false); navigate('/student/setup'); }} style={{ marginLeft: '16px' }}>Switch Topic</button>
        </div>
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
                {subjects.map(sub => (
                  <button 
                    key={sub.id}
                    className={`curr-chip ${activeSubject === sub.id ? 'active' : ''}`}
                    onClick={() => setActiveSubject(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="curr-group">
            <span className="curr-label">Chapter</span>
            <div className="curr-chip-row" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
              {chapters.length > 0 ? chapters.map((ch, idx) => {
                // Calculate chapter progress
                const chConcepts = allGraphNodes.filter(n => n.parent_id === `ch_${ch.id}`);
                const mastered = chConcepts.filter(c => (masteryMap[c.id] || 0) >= 0.8).length;
                const total = chConcepts.length;
                const progressPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

                return (
                  <button 
                    key={ch.id} 
                    className={`curr-chip flex flex-col items-start gap-1 ${activeChapter === ch.id ? 'active' : ''}`}
                    onClick={() => setActiveChapter(ch.id)}
                  >
                    <div className="flex justify-between w-full gap-4">
                      <span>Ch {ch.number || idx + 1} &middot; {ch.name}</span>
                      <span className="text-xs opacity-70">{mastered}/{total}</span>
                    </div>
                    <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-current opacity-50" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </button>
                );
              }) : (
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
                const conceptLevel = c.concept_level || level;
                
                return (
                  <div key={c.id} className={`path-row ${unlocked ? '' : 'locked'}`}>
                    <div className="path-row-ring" style={{ '--v': `${score*100}%`, '--c': unlocked ? masteryColor(score) : '#C7C2B3' }}>
                      <span>{unlocked ? Math.round(score*100) : '🔒'}</span>
                    </div>
                    <div className="path-row-mid flex-1">
                      <div className="flex items-center gap-2">
                        <div className="path-row-title">{c.name}</div>
                        {unlocked && <span className={`${getLevelBadgeClass(conceptLevel)} px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>{conceptLevel}</span>}
                      </div>
                      <div className="path-row-ncert">{c.ncert}</div>
                    </div>
                    {!unlocked ? (
                      <span className="muted small">Locked — reach 40% on the prior concept</span>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/lesson', { state: { conceptId: c.id, conceptLevel } })}>
                        {score >= 0.7 ? 'Review lesson' : 'Start lesson'} &rarr;
                      </button>
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
