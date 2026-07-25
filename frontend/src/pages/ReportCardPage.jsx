import React, { useState, useEffect } from 'react';
import { reportCardApi } from '../services/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ReportCardPage() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToFetch = studentId || user?.student_id; 
    if (idToFetch) {
      fetchReport(idToFetch);
    }
  }, [studentId, user]);

  const fetchReport = async (id) => {
    setLoading(true);
    try {
      const res = await reportCardApi.getReportCard(id);
      setReport(res.data);
    } catch (err) {
      toast.error('Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  if (!report) {
    return (
      <div className="screen">
        <div className="card center-card">
          <h2>Report Card not available</h2>
        </div>
      </div>
    );
  }

  const { student_name, grade, section, mastery_percentage, overall_grade, doubt_stats, concept_status, strengths, weaknesses, remarks } = report;

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Student Report Card</h1>
          <p className="page-sub">Sahaay Adaptive Learning Platform</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2>{student_name}</h2>
          <p className="muted small">Grade: {grade} &middot; Section: {section}</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--forest-soft)', borderColor: '#a3d9c1' }}>
          <span className="eyebrow" style={{ color: '#0A6B44' }}>Overall Grade</span>
          <span style={{ fontSize: '4rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold', color: '#0A6B44' }}>{overall_grade}</span>
        </div>
        <div className="grid-2">
          <div className="card" style={{ backgroundColor: '#F0ECDF' }}>
            <span className="eyebrow">Mastery Score</span>
            <span className="mono" style={{ fontSize: '2rem' }}>{mastery_percentage}%</span>
          </div>
          <div className="card" style={{ backgroundColor: '#F0ECDF' }}>
            <span className="eyebrow">Doubts Asked</span>
            <span className="mono" style={{ fontSize: '2rem' }}>{doubt_stats.total}</span>
          </div>
          <div className="card" style={{ backgroundColor: '#F0ECDF' }}>
            <span className="eyebrow">Resolved Doubts</span>
            <span className="mono" style={{ fontSize: '2rem' }}>{doubt_stats.resolved}</span>
          </div>
          <div className="card" style={{ backgroundColor: '#F0ECDF' }}>
            <span className="eyebrow">Unresolved</span>
            <span className="mono" style={{ fontSize: '2rem' }}>{doubt_stats.unresolved}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Concept Breakdown</p>
        <div className="grid-2" style={{ marginTop: '16px' }}>
          {Object.entries(concept_status).map(([concept, status]) => {
            let badgeClass = 'badge-neutral';
            if (status === 'Mastered') badgeClass = 'badge-grade'; // Grade-Level (greenish) or we can use custom color
            if (status === 'In Progress') badgeClass = 'badge-advanced';
            if (status === 'Needs Work') badgeClass = 'badge-foundational';

            return (
              <div key={concept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{concept}</span>
                <span className={`badge-sm ${badgeClass}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ color: '#0A6B44' }}>Strengths</h3>
          {strengths.length > 0 ? (
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              {strengths.map(s => <li key={s} className="muted small" style={{ fontSize: '14px', marginBottom: '4px' }}>{s}</li>)}
            </ul>
          ) : (
            <p className="muted small italic">No specific strengths identified yet.</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--redpen)' }}>Areas for Improvement</h3>
          {weaknesses.length > 0 ? (
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              {weaknesses.map(w => <li key={w} className="muted small" style={{ fontSize: '14px', marginBottom: '4px' }}>{w}</li>)}
            </ul>
          ) : (
            <p className="muted small italic">No major weaknesses identified.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ backgroundColor: 'var(--marigold-soft)', borderColor: '#d6af7a' }}>
        <p className="eyebrow" style={{ color: '#8C5C13' }}>Teacher's Remarks</p>
        <p style={{ color: '#5a3a0b', fontStyle: 'italic', marginTop: '8px' }}>"{remarks}"</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print Report Card
        </button>
      </div>
    </div>
  );
}
