import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SectionTabs from '../components/SectionTabs';
import ConceptGraph from '../components/ConceptGraph';
import { teacherApi } from '../services/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [sections, setSections] = useState([]);
  const [data, setData] = useState(null);

  const [syllabusTree, setSyllabusTree] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  useEffect(() => {
    teacherApi.getSections()
      .then(res => {
        if (res.data?.sections?.length > 0) {
          setSections(res.data.sections);
          setActiveSection(res.data.sections[0]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    setLoading(true);
    
    // Also fetch syllabus tree for the graph filters
    import('../services/api').then(({ default: api }) => {
      Promise.all([
        teacherApi.getDashboard(activeSection),
        api.get('/concepts/tree')
      ]).then(([dashRes, treeRes]) => {
        setData(dashRes.data);
        
        const tree = treeRes.data || [];
        setSyllabusTree(tree);
        if (tree.length > 0 && tree[0].children?.length > 0) {
          const subject = tree[0].children[0];
          setSelectedSubject(subject);
          if (subject.children?.length > 0) {
            setSelectedChapter(subject.children[0]);
          }
        }
        
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    });
  }, [activeSection]);

  if (loading || !data) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const { kpis, level_distribution: dist, activity_feed: activity, mastery_map: masteryMap, concept_graph: graphData } = data;
  const maxDist = Math.max(...Object.values(dist), 1);

  const subjects = syllabusTree.length > 0 ? syllabusTree[0].children : [];
  const chapters = selectedSubject ? selectedSubject.children : [];

  let filteredGraphData = null;
  if (graphData && selectedSubject) {
    let validNodeIds = new Set();
    if (selectedChapter) {
      validNodeIds = new Set(selectedChapter.children.map(t => t.id));
    } else {
      validNodeIds = new Set(selectedSubject.children.flatMap(ch => ch.children.map(t => t.id)));
    }
    filteredGraphData = {
      nodes: graphData.nodes.filter(n => validNodeIds.has(n.id)),
      edges: graphData.edges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    };
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Teacher Dashboard</h1>
          <p className="page-sub">{user?.name} &middot; Real-time view across your sections</p>
        </div>
      </div>
      
      <SectionTabs 
        sections={sections} 
        activeSection={activeSection} 
        onChange={setActiveSection} 
      />

      <div className="kpi-row">
        <div className="kpi-card"><span className="kpi-num">{kpis.total_students}</span><span className="kpi-label">Students in section</span></div>
        <div className="kpi-card"><span className="kpi-num">{Math.round(kpis.avg_mastery * 100)}%</span><span className="kpi-label">Avg. mastery</span></div>
        <div className="kpi-card kpi-alert"><span className="kpi-num">{kpis.pending_escalations}</span><span className="kpi-label">Pending escalations</span></div>
        <div className="kpi-card"><span className="kpi-num">{kpis.active_today}</span><span className="kpi-label">Active today</span></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">Level distribution</p>
          <div className="dist-chart">
            {Object.entries(dist).map(([k, v]) => {
              let badgeClass = 'badge-neutral';
              if (k === 'Foundational') badgeClass = 'badge-foundational';
              if (k === 'Grade-Level') badgeClass = 'badge-grade';
              if (k === 'Advanced') badgeClass = 'badge-advanced';

              return (
                <div className="dist-row" key={k}>
                  <span className="dist-label">{k}</span>
                  <div className="dist-bar-track">
                    <div className={`dist-bar-fill ${badgeClass}`} style={{ width: `${(v / maxDist) * 100}%` }}></div>
                  </div>
                  <span className="mono">{v}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Live activity feed</p>
          <div className="activity-list">
            {activity.map((a, i) => (
              <div className="activity-item" key={i}>
                <div className="avatar">{a.student.charAt(0)}</div>
                <div>
                  <strong>{a.student}</strong> {a.action} {a.target}<br />
                  <span className="muted small">{new Date(a.time).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p className="eyebrow" style={{ margin: 0 }}>Concept graph health</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="field-select" 
              style={{ marginBottom: 0, padding: '4px 8px', fontSize: '13px', width: 'auto' }}
              value={selectedSubject?.id || ''}
              onChange={e => {
                const sub = subjects.find(s => s.id === parseInt(e.target.value));
                setSelectedSubject(sub);
                setSelectedChapter(null);
              }}
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {selectedSubject && (
              <select 
                className="field-select" 
                style={{ marginBottom: 0, padding: '4px 8px', fontSize: '13px', width: 'auto' }}
                value={selectedChapter?.id || ''}
                onChange={e => {
                  if (e.target.value === 'all') setSelectedChapter(null);
                  else setSelectedChapter(chapters.find(c => c.id === parseInt(e.target.value)));
                }}
              >
                <option value="all">All Chapters</option>
                {chapters.map(c => <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div style={{ margin: '0 -24px' }}>
          {filteredGraphData?.nodes?.length > 0 ? (
            <ConceptGraph data={filteredGraphData} masteryMap={masteryMap} />
          ) : (
            <div className="center" style={{ padding: '40px', color: 'var(--ink-soft)' }}>No topics mapped for this selection.</div>
          )}
        </div>
      </div>
    </div>
  );
}
