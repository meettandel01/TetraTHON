import React, { useState, useEffect } from 'react';
import SectionTabs from '../components/SectionTabs';
import { teacherApi } from '../services/api';

export default function ItemAnalysisPage() {
  const [activeSection, setActiveSection] = useState('');
  const [sections, setSections] = useState([]);
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    teacherApi.getItemAnalysis()
      .then(res => {
        setItems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const rows = items.filter(it => tab === 'all' ? true : tab === 'flagged' ? (it.flagged !== undefined ? it.flagged : it.flag) : (it.source || '').toLowerCase() === tab);
  const flaggedCount = items.filter(it => (it.flagged !== undefined ? it.flagged : it.flag)).length;

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Item Analysis</h1>
          <p className="page-sub">Question-level performance across the class — not just per-student mastery.</p>
        </div>
      </div>

      <SectionTabs 
        sections={sections} 
        activeSection={activeSection} 
        onChange={setActiveSection} 
      />

      <div className="tab-row">
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All questions</button>
        <button className={`tab-btn ${tab === 'diagnostic' ? 'active' : ''}`} onClick={() => setTab('diagnostic')}>Diagnostic</button>
        <button className={`tab-btn ${tab === 'practice' ? 'active' : ''}`} onClick={() => setTab('practice')}>Practice</button>
        <button className={`tab-btn ${tab === 'flagged' ? 'active' : ''}`} onClick={() => setTab('flagged')}>Flagged for reteach ({flaggedCount})</button>
      </div>

      <div className="card">
        <table className="item-analysis-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Source</th>
              <th>% correct (class)</th>
              <th>Most common wrong answer</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it, i) => {
              const correctPct = (it.correct_pct !== undefined ? it.correct_pct : it.correctPct) || 0;
              const isFlagged = it.flagged !== undefined ? it.flagged : it.flag;
              const topDistractor = it.top_distractor || it.commonWrong;
              
              let bg = '#F2EEE1';
              if (correctPct > 0) {
                bg = `hsl(156, ${correctPct}%, ${100 - (correctPct / 2)}%)`;
              }
              return (
                <tr key={it.question_id || it.id || i} className={isFlagged ? 'item-row-flag' : ''}>
                  <td>{it.text}</td>
                  <td><span className="chip chip-ncert">{it.source}</span></td>
                  <td>
                    <div className="item-pct-cell">
                      <div className="dist-bar-track item-pct-track">
                        <div className="dist-bar-fill" style={{ width: `${correctPct}%`, background: bg }}></div>
                      </div>
                      <span className="mono">{Math.round(correctPct)}%</span>
                    </div>
                  </td>
                  <td className="muted small">{topDistractor || '-'}</td>
                  <td>{isFlagged && <span className="status-pill status-pending">Reteach</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <p className="eyebrow">Why this matters</p>
        <p className="muted">Per-student mastery (Heatmap) tells you <em>who</em> is struggling. Item analysis tells you <em>which question</em> the whole class is struggling with — e.g. {flaggedCount} question{flaggedCount === 1 ? '' : 's'} below 50% class-wide correctness right now, a strong signal to reteach that specific step before moving on, not just intervene one student at a time.</p>
      </div>
    </div>
  );
}
