import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Stepper from '../components/Stepper';

function getLevelBadgeClass(level) {
  if (level === 'Foundational') return 'badge-foundational';
  if (level === 'Grade-Level') return 'badge-grade';
  if (level === 'Advanced') return 'badge-advanced';
  return 'badge-neutral';
}

export default function DiagnosticResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get real results from quiz submission
  const results = location.state?.results;
  const conceptId = location.state?.concept_id;

  if (!results) {
    return <Navigate to="/student/setup" replace />;
  }

  const score = results.percentage !== undefined ? results.percentage / 100 : 0;
  const correctCount = results.correct_count ?? 0;
  const totalQuestions = results.total_questions ?? 5;
  const level = results.concept_level || results.placement_level || 'Foundational';

  const angle = Math.round(score * 180);
  const x2 = 100 + 80 * Math.cos(Math.PI - (angle * Math.PI / 180));
  const y2 = 100 - 80 * Math.sin(Math.PI - (angle * Math.PI / 180));
  const strokeDashArray = Math.round(score * 283);

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
        currentStep={1} 
      />

      <div className="card card-narrow result-card">
        <p className="eyebrow">Diagnostic complete</p>
        <h2>{correctCount} / {totalQuestions} correct</h2>
        <div className="gauge">
          <svg viewBox="0 0 200 110" className="gauge-svg">
            <path d="M10 100 A90 90 0 0 1 190 100" className="gauge-track"/>
            <path d="M10 100 A90 90 0 0 1 190 100" className="gauge-fill" style={{strokeDasharray: `${strokeDashArray} 283`}}/>
            <line x1="100" y1="100" x2={x2} y2={y2} className="gauge-needle"/>
            <circle cx="100" cy="100" r="5" className="gauge-hub"/>
          </svg>
          <div className="gauge-labels">
            <span>Foundational</span>
            <span>Grade-Level</span>
            <span>Advanced</span>
          </div>
        </div>
        <div className="result-badge-wrap">
          <span className={`${getLevelBadgeClass(level)} badge-lg`}>{level}</span>
        </div>
        <p className="muted center">
          Score {score.toFixed(2)} on a 0.00–1.00 scale &middot; classified using EAP-adjusted thresholds (≤0.40 Foundational &middot; ≤0.70 Grade-Level &middot; &gt;0.70 Advanced).
        </p>
        <div className="result-note">
          <strong>Why this matters:</strong> boundary scores classify conservatively — a student scoring exactly on a threshold is placed in the lower, more supportive track by design.
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <button className="btn btn-primary btn-block" onClick={() => navigate('/student/lesson', { state: { conceptId: conceptId, conceptLevel: level } })}>
            Start lesson &rarr;
          </button>
          <button className="btn btn-ghost btn-block text-sm" onClick={() => navigate('/student/learning-path', { state: { concept_id: conceptId } })}>
            View full learning path
          </button>
        </div>
      </div>
    </div>
  );
}
