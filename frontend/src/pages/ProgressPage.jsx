import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConceptGraph from '../components/ConceptGraph';
import { useAuth } from '../context/AuthContext';
import api, { dashboardApi } from '../services/api';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [masteryMap, setMasteryMap] = useState({});
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.student_id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, badgesRes, dashRes] = await Promise.all([
          api.get(`/gamification/${user.student_id}`),
          api.get(`/gamification/badges/${user.student_id}`),
          dashboardApi.get(user.student_id)
        ]);

        setStats({
          xp: statsRes.data.xp || 0,
          daily_xp_cap: statsRes.data.daily_xp_cap || 500,
          streak: statsRes.data.streak || 0
        });

        setBadges(badgesRes.data || []);

        const mMap = {};
        if (dashRes.data?.concept_graph?.nodes) {
          dashRes.data.concept_graph.nodes.forEach(n => {
            mMap[n.id] = n.mastery !== null ? (n.mastery / 100) : 0;
          });
        }
        setMasteryMap(mMap);
        setGraphData(dashRes.data?.concept_graph || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading || !stats) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Progress &amp; Badges</h1>
          <p className="page-sub">Track your XP, streaks, and concept mastery.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">Daily Goal</p>
          <div className="xp-row" style={{ marginTop: '10px' }}>
            <div className="xp-bar" style={{ flex: 1, height: '12px' }}>
              <div className="xp-bar-fill" style={{ width: `${Math.min(100, (stats.xp / (stats.daily_xp_cap || 500)) * 100)}%` }}></div>
            </div>
            <span className="mono" style={{ fontSize: '1.2rem' }}>{stats.xp} / {stats.daily_xp_cap || 500} XP</span>
          </div>
          <p className="muted small" style={{ marginTop: '10px' }}>
            *Daily XP is capped at {stats.daily_xp_cap || 500} to encourage consistent, healthy learning habits.
          </p>
        </div>

        <div className="card">
          <p className="eyebrow">Active Streak</p>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <h2 style={{ color: 'var(--sky)', fontSize: '2rem' }}>{stats.streak} Days</h2>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="muted small">Keep coming back every day to maintain your streak!</p>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Achievements</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {badges.length > 0 ? badges.map(b => (
            <div key={b.id || b.badge_id} style={{
              padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              textAlign: 'center', opacity: b.earned ? 1 : 0.6,
              background: b.earned ? 'var(--paper)' : 'transparent',
              borderColor: b.earned ? 'var(--sky-soft)' : 'var(--border)'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                background: b.earned ? 'var(--sky-soft)' : '#EAE8E0', filter: b.earned ? 'none' : 'grayscale(100%)'
              }}>
                {b.icon}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--ink)' }}>{b.name || b.title}</div>
              <div className="muted small" style={{ marginTop: '4px' }}>{b.description || b.desc}</div>
            </div>
          )) : (
            <div className="muted small italic">No badges found.</div>
          )}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Concept Mastery Map (Ch 2)</p>
        <div style={{ margin: '0 -24px' }}>
          <ConceptGraph data={graphData} masteryMap={masteryMap} />
        </div>
      </div>
    </div>
  );
}
