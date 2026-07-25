import React, { useState, useEffect } from 'react';
import SectionTabs from '../components/SectionTabs';
import toast from 'react-hot-toast';
import { escalationsApi, teacherApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EscalationQueuePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('pending');
  const [activeSection, setActiveSection] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drafts, setDrafts] = useState({});
  const [escs, setEscs] = useState([]);

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

  const fetchEscalations = () => {
    setLoading(true);
    escalationsApi.getEscalations(filter)
      .then(res => {
        const mapped = res.data.map(e => ({
          ...e,
          studentName: e.student_name || e.studentName || 'Student',
          concept: e.concept_id || e.concept || 'General',
          time: e.created_at ? new Date(e.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (e.time || 'Just now'),
          auto: e.auto_escalated !== undefined ? e.auto_escalated : e.auto,
          doubt: e.doubt_text || e.doubt || '',
          response: e.response_text || e.response || '',
          claimedBy: e.claimed_by_user_id || e.claimed_by || e.claimedBy
        }));
        setEscs(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEscalations();
  }, [filter, activeSection]);

  const regenerateDraft = (id) => {
    setLoading(true);
    escalationsApi.regenerateDraft(id).then((res) => {
      setDrafts(prev => ({...prev, [id]: res.data.draft}));
      toast.success('Draft regenerated');
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to regenerate draft');
      setLoading(false);
    });
  };

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const list = escs;

  const claimEscalation = (id) => {
    setLoading(true);
    escalationsApi.claimEscalation(id).then(() => {
      fetchEscalations();
      toast('Escalation claimed', { icon: 'ℹ️' });
    }).catch(() => setLoading(false));
  };

  const respondEscalation = (id) => {
    const val = drafts[id];
    if (!val || !val.trim()) {
      toast('Write a response before sending.', { icon: 'ℹ️' });
      return;
    }
    setLoading(true);
    escalationsApi.respondEscalation(id, val).then(() => {
      fetchEscalations();
      toast.success('Response sent to student');
      setDrafts(prev => ({...prev, [id]: ''}));
    }).catch(() => setLoading(false));
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Escalation Queue</h1>
          <p className="page-sub">Doubts the AI tutor couldn't confidently resolve, or the student flagged as unhelpful.</p>
        </div>
      </div>

      <SectionTabs 
        sections={sections} 
        activeSection={activeSection} 
        onChange={setActiveSection} 
      />

      <div className="tab-row">
        <button className={`tab-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
        <button className={`tab-btn ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')}>Resolved</button>
      </div>

      <div className="escalation-list">
        {list.length > 0 ? list.map(e => (
          <div key={e.id} className="card escalation-card">
            <div className="escalation-top">
              <div className="detail-head">
                <div className="avatar" style={{width: '32px', height: '32px', fontSize: '13px'}}>{(e.studentName || 'S').charAt(0)}</div>
                <div>
                  <strong>{e.studentName}</strong><br />
                  <span className="muted small">Sec {activeSection} &middot; {e.concept} &middot; {e.time}</span>
                </div>
              </div>
              <div className="escalation-badges">
                {e.auto && <span className="status-pill status-auto">⚠ Auto (low confidence)</span>}
                {e.status === 'pending' && <span className="status-pill status-pending">Pending</span>}
                {e.status === 'claimed' && <span className="status-pill status-claimed">Claimed</span>}
                {e.status === 'resolved' && <span className="status-pill status-resolved">Resolved</span>}
              </div>
            </div>
            <p className="escalation-doubt">"{e.doubt}"</p>
            
            {e.status === 'resolved' ? (
              <div className="teacher-response">
                <p className="eyebrow">Your response</p>
                <p>{e.response}</p>
              </div>
            ) : e.status === 'claimed' && (e.claimedBy === user?.id || e.claimedBy === user?.teacher_id || !e.claimedBy || e.claimedBy === 't1') ? (
              <>
                <div className="ai-draft-label">🤖 AI-drafted response — read, edit, then send</div>
                <textarea 
                  className="doubt-textarea"
                  value={drafts[e.id] || ''}
                  onChange={(evt) => setDrafts({...drafts, [e.id]: evt.target.value})}
                ></textarea>
                <div className="escalation-actions-row">
                  <button className="btn btn-ghost btn-sm" onClick={() => regenerateDraft(e.id)}>↻ Regenerate draft</button>
                  <button className="btn btn-primary btn-sm" onClick={() => respondEscalation(e.id)}>Send response</button>
                </div>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => claimEscalation(e.id)}>Claim</button>
            )}
          </div>
        )) : (
          <div className="empty-state">
            <p>Nothing here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
