import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { useAuth } from '../context/AuthContext';
import api, { dashboardApi } from '../services/api';
import toast from 'react-hot-toast';

export default function ResultPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const practiceResults = location.state;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [xpRes, dashRes] = await Promise.all([
        api.get(`/gamification/${user.student_id}`),
        dashboardApi.get(user.student_id)
      ]);
      
      const masteryMap = {};
      dashRes.data.concept_graph.nodes.forEach(n => {
        masteryMap[n.id] = n.mastery !== null ? (n.mastery / 100) : 0;
      });

      setStats({
        xp: xpRes.data.xp || 0,
        streak: xpRes.data.streak || 0,
        mastery: masteryMap,
        badgesEarned: xpRes.data.badges ? xpRes.data.badges.length : 0,
      });
    } catch (err) {
      console.error(err);
      setStats({ xp: 0, streak: 0, mastery: {}, badgesEarned: 0 });
    } finally {
      setLoading(false);
    }
  };

  const endSession = () => {
    toast.success('Session saved. Great progress today!');
    navigate('/student/dashboard');
  };

  if (loading || !stats) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const practiceScore = practiceResults?.practiceScore ?? null;
  const practiceCorrect = practiceResults?.correctCount ?? 0;
  const practiceTotal = practiceResults?.totalAnswered ?? 0;
  const streak = stats.streak;

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
        currentStep={4} 
      />
      <div className="card card-narrow center-card">
        <p className="eyebrow">Session complete</p>
        <h2>Nice work, {user?.name?.split(' ')[0]}!</h2>
        <div className="summary-stats">
          <div><span className="mono big">{practiceScore !== null ? `${Math.round(practiceScore * 100)}%` : '—'}</span><br/><span className="muted small">practice score ({practiceCorrect}/{practiceTotal})</span></div>
          <div><span className="mono big">{stats.xp}</span><br/><span className="muted small">Total XP</span></div>
          <div><span className="mono big">{streak}</span><br/><span className="muted small">day streak</span></div>
        </div>
        {practiceScore !== null && practiceScore >= 0.8 && (
          <div className="badge-unlock">
            <div className="badge-unlock-icon">✎</div>
            <div>
              <strong>Keep it up!</strong>
              <p className="muted small">Your practice questions have been logged.</p>
            </div>
          </div>
        )}
        <p className="eyebrow" style={{ marginTop: '20px' }}>Mastery updated</p>
        
        {/* Compact concept graph row */}
        <div className="mastery-row" style={{ justifyContent: 'center' }}>
          {Object.entries(stats.mastery).filter(([_, v]) => v > 0).slice(0, 5).map(([id, score]) => {
            const shortName = id.length > 15 ? id.substring(0, 12) + '...' : id;
            const hue = Math.max(0, Math.min(1, score)) * 122;
            const color = `hsl(${hue.toFixed(0)}, 58%, 42%)`;
            return (
              <div className="mastery-pip" title={`${shortName}: ${Math.round(score * 100)}%`} key={id}>
                <div className="mastery-pip-ring" style={{ '--v': `${score * 100}%`, '--c': color }}></div>
                <span>{shortName}</span>
              </div>
            );
          })}
        </div>

        <p className="muted small center">Your teacher's dashboard has already refreshed with this activity.</p>
        <div className="summary-actions">
          <button className="btn btn-ghost" onClick={endSession}>Back to dashboard</button>
          <button className="btn btn-primary" onClick={() => navigate('/student/learning-path')}>View learning path &rarr;</button>
        </div>
      </div>
    </div>
  );
}
