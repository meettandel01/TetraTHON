import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, Clock, AlertCircle, ChevronRight, Activity, Calendar } from 'lucide-react';
import SectionTabs from '../components/SectionTabs';
import { parentApi } from '../services/api';
import toast from 'react-hot-toast';

export default function ParentOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const childId = user?.child_id || user?.id;
    parentApi.getOverview(childId)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1>Namaste, {user?.name || 'Parent'}</h1>
          <p className="page-sub">Here's how {data.student_name} is doing in Mathematics.</p>
        </div>
      </div>

      <SectionTabs 
        sections={['Overview', 'Weekly Digest', 'Alerts', 'Settings']} 
        activeSection="Overview" 
        onChange={(tab) => {
          if (tab === 'Overview') navigate('/parent/overview');
          if (tab === 'Weekly Digest') navigate('/parent/digest');
          if (tab === 'Alerts') navigate('/parent/alerts');
          if (tab === 'Settings') navigate('/parent/settings');
        }} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="card center" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--forest-soft)', borderBottomLeftRadius: '100px', zIndex: 0, opacity: 0.5 }}></div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--forest-soft)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative', zIndex: 1 }}>
            <Target size={24} />
          </div>
          <div style={{ fontSize: '42px', fontFamily: 'Fraunces', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>{Math.round(data.mastery_score)}%</div>
          <div className="eyebrow">Overall Mastery</div>
        </div>
        
        <div className="card center" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--sky-soft)', borderBottomLeftRadius: '100px', zIndex: 0, opacity: 0.5 }}></div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--sky-soft)', color: 'var(--sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative', zIndex: 1 }}>
            <Clock size={24} />
          </div>
          <div style={{ fontSize: '42px', fontFamily: 'Fraunces', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>{(data.total_learning_time_seconds / 3600).toFixed(1)} <span className="muted" style={{ fontSize: '20px', fontFamily: 'Manrope' }}>hrs</span></div>
          <div className="eyebrow">Learning Time (This Week)</div>
        </div>
      </div>

      {data.recent_alerts?.map((alert, i) => (
        <div key={i} className="card" style={{ border: '1px solid var(--redpen)', background: 'var(--redpen-soft)', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <AlertCircle size={24} color="var(--redpen)" style={{ flex: 'none', marginTop: '4px' }} />
          <div>
            <h3 style={{ color: 'var(--redpen)', marginBottom: '4px', fontSize: '18px' }}>{alert.title}</h3>
            <p style={{ color: 'var(--redpen)', fontWeight: 500, fontSize: '14px', marginBottom: '16px' }}>{alert.description}</p>
            <button onClick={async () => {
              try {
                const res = await parentApi.getAlertLog(user?.child_id || user?.id, alert.id);
                toast(`Log: ${res.data.log || 'No conversation details available.'}`, { icon: '📝' });
              } catch (e) {
                toast('No conversation log recorded for this event yet', { icon: 'ℹ️' });
              }
            }} className="btn btn-sm" style={{ background: '#fff', border: '1px solid var(--redpen)', color: 'var(--redpen)' }}>
              View Conversation Log
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color="var(--sky)"/> Recent Activity</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.recent_activity?.map((activity, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: activity.type === 'mastered' ? 'var(--forest-soft)' : 'var(--marigold-soft)', color: activity.type === 'mastered' ? 'var(--forest)' : 'var(--marigold-dark)' }}>
                  {activity.type === 'mastered' ? '✓' : '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{activity.title}</div>
                  <div className="muted small">{activity.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--marigold-dark)' }}>
              <Calendar size={18} /> <span className="eyebrow" style={{ color: 'inherit', margin: 0 }}>Weekly Report Ready</span>
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Current Week Report</h3>
            <p className="muted" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '24px', lineHeight: 1.6 }}>Read the AI-generated plain english summary of {data.student_name || 'your child'}'s progress and areas for improvement.</p>
            <button onClick={() => navigate('/parent/digest')} className="btn btn-primary btn-block">Read Digest <ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
