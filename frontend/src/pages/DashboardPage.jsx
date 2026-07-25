import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { dashboardApi } from '../services/api';



function pct(v){ return Math.round(v*100) + '%'; }
function masteryColor(score){
  const hue = Math.max(0, Math.min(1, score)) * 122; // 0=red 122=green
  return `hsl(${hue.toFixed(0)}, 58%, 42%)`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

      const hasActiveSession = dashRes.data.stats.sessions_total > dashRes.data.stats.sessions_completed;

      const concepts = dashRes.data.concept_graph.nodes
        .filter(n => n.status !== 'chapter' && !String(n.id).startsWith('ch_'))
        .map(n => ({
          id: n.id,
          short: n.label || n.id,
          name: n.name || n.label || n.id
        }));

      setStats({
        xp: xpRes.data.xp || 0,
        daily_xp_cap: xpRes.data.daily_xp_cap || 500,
        level: dashRes.data.student.level || null,
        streak: xpRes.data.streak || 0,
        mastery: masteryMap,
        badgesEarned: xpRes.data.badges ? xpRes.data.badges.length : 0,
        resume: hasActiveSession,
        concepts: concepts
      });
    } catch (err) {
      console.error(err);
      setStats({ xp: 0, daily_xp_cap: 500, level: null, streak: 0, mastery: {}, badgesEarned: 0, resume: false, concepts: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const weakest = stats.concepts.length > 0 
    ? stats.concepts.slice().sort((a,b)=>(stats.mastery[a.id]||0)-(stats.mastery[b.id]||0))[0]
    : { name: 'Unknown Concept', id: 'unknown' };
  const resume = stats.resume;
  const badgesEarned = stats.badgesEarned;

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Namaste, {user.name.split(' ')[0]} 👋</h1>
          <p className="page-sub">
            {stats.level ? (
              <>You're on the <strong>{stats.level}</strong> track for Linear Equations.</>
            ) : (
              "You haven't taken a diagnostic yet — let's find your starting point."
            )}
          </p>
        </div>
        <div className="streak-chip">🔥 <strong>{stats.streak}</strong>-day streak</div>
      </div>

      <div className="grid-2">
        <div className="card card-highlight">
          <p className="eyebrow">Chapter 2 · Linear Equations in One Variable</p>
          {resume ? (
            <>
              <h3>Resume where you left off</h3>
              <p className="muted">You're mid-session — pick up right at your next step.</p>
              <button className="btn btn-primary" onClick={() => navigate('/student/setup')}>Continue session →</button>
            </>
          ) : (
            <>
              <h3>Today's session</h3>
              <p className="muted">Select a topic, take a diagnostic, get an adaptive micro-lesson, and practice.</p>
              <button className="btn btn-primary" onClick={() => navigate('/student/setup')}>Start today's session →</button>
            </>
          )}
        </div>
        <div className="card">
          <p className="eyebrow">XP progress</p>
          <div className="xp-row">
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${Math.min(100, (stats.xp / (stats.daily_xp_cap || 500)) * 100)}%` }}></div>
            </div>
            <span className="mono">{stats.xp} XP</span>
          </div>
          <p className="muted small">{stats.daily_xp_cap || 500} XP daily cap · {badgesEarned} badges earned</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/progress')}>View progress &amp; badges →</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">Recommended next</p>
          <h3>{weakest.name}</h3>
          <p className="muted">
            Your weakest concept in this chapter at {pct(stats.mastery[weakest.id] || 0)} mastery. 
            {!stats.level && ' Recommendation will sharpen once your diagnostic is complete.'}
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/learning-path')}>Open learning path →</button>
        </div>
        <div className="card">
          <p className="eyebrow">Concept snapshot</p>
          <div className="mastery-row">
            {stats.concepts.map(c => {
              const score = stats.mastery[c.id] || 0;
              return (
                <div className="mastery-pip" title={`${c.name}: ${pct(score)}`} key={c.id}>
                  <div className="mastery-pip-ring" style={{ '--v': `${score * 100}%`, '--c': masteryColor(score) }}></div>
                  <span>{c.short}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
