import React, { useState, useEffect } from 'react';
import SectionTabs from '../components/SectionTabs';
import { teacherApi } from '../services/api';
import toast from 'react-hot-toast';

export default function HeatmapPage() {
  const [activeSection, setActiveSection] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [data, setData] = useState({ concepts: [], students: [] });
  const [page, setPage] = useState(1);
  const pageSize = 20;

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
    setPage(1);
    teacherApi.getHeatmap(activeSection)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeSection]);

  if (loading || !data) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const { concepts, students } = data;
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const currentStudents = students.slice(startIndex, startIndex + pageSize);

  return (
    <div className="screen" style={{position: 'relative'}}>
      <div className="page-head">
        <div>
          <h1>Mastery Heatmap</h1>
          <p className="page-sub">Curriculum concepts &times; students mastery grid by section.</p>
        </div>
      </div>

      <SectionTabs 
        sections={sections} 
        activeSection={activeSection} 
        onChange={setActiveSection} 
      />

      <div className="card heatmap-card">
        <div className="heatmap-pagination-head">
          <p className="muted small">Showing {students.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, students.length)} of {students.length} students in Section {activeSection}</p>
          <div className="pager">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>&larr; Prev</button>
            <span className="mono small">Page {page} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next &rarr;</button>
          </div>
        </div>
        <div className="heatmap-scroll">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Student</th>
                {concepts.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student) => (
                <tr key={student.id}>
                  <td className="heatmap-name">
                    <div className="avatar" style={{width: '24px', height: '24px', fontSize: '11px'}}>{student.name.charAt(0)}</div>
                    <span>{student.name}</span>
                  </td>
                  {concepts.map((concept, idx) => {
                    const score = student.scores[concept] || 0;
                    const isSelected = selectedCell?.sId === student.id && selectedCell?.cIdx === idx;
                    
                    let bg = '#F2EEE1';
                    let color = 'transparent';
                    if (score > 0) {
                      bg = `hsl(156, ${score}%, ${100 - score/2}%)`;
                      color = `hsl(156, 100%, ${30 - score/4}%)`;
                    }

                    return (
                      <td key={idx}>
                        <button 
                          onClick={() => setSelectedCell({ sId: student.id, cIdx: idx, score, concept: concept })}
                          className={`heat-cell ${isSelected ? 'heat-cell-sel' : ''}`}
                          style={{ background: bg, color: score > 0 ? color : 'var(--ink-faint)' }}
                        >
                          {Math.round(score) || '-'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCell && (() => {
        const student = students.find(s => s.id === selectedCell.sId);
        if (!student) return null;
        return (
          <div className="card detail-card" style={{position: 'absolute', right: '0', top: '150px', width: '320px', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
              <div className="detail-head">
                <div className="avatar" style={{width: '36px', height: '36px', fontSize: '14px'}}>{student.name.charAt(0)}</div>
                <div>
                  <strong>{student.name}</strong><br />
                  <span className="muted small">{student.archetype}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{padding: '0 8px'}} onClick={() => setSelectedCell(null)}>✕</button>
            </div>
            <p><strong>{selectedCell.concept}</strong> — mastery {selectedCell.score}%</p>
            <div className="detail-actions" style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
              <button className="btn btn-ghost btn-sm" onClick={() => { toast.success(`Message sent to ${student.name}`); setSelectedCell(null); }}>Message student</button>
              <button className="btn btn-primary btn-sm" style={{padding: '6px 12px'}} onClick={() => { toast.success(`Practice assigned to ${student.name}`); setSelectedCell(null); }}>Assign practice</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
