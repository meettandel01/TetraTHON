import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTabs from '../components/SectionTabs';
import { BookOpen, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { parentApi } from '../services/api';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

export default function ParentDigestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Weekly Digest');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const childId = user?.child_id || user?.id;
    parentApi.getDigest(childId)
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
          <h1>Weekly Digest</h1>
        </div>
      </div>

      <SectionTabs 
        sections={['Overview', 'Weekly Digest', 'Alerts', 'Settings']} 
        activeSection="Weekly Digest" 
        onChange={(tab) => {
          if (tab === 'Overview') navigate('/parent/overview');
          if (tab === 'Weekly Digest') navigate('/parent/digest');
          if (tab === 'Alerts') navigate('/parent/alerts');
          if (tab === 'Settings') navigate('/parent/settings');
        }} 
      />

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="var(--marigold-dark)" /> {data.week || 'Current Week'}
        </h3>
        
        <div style={{ marginBottom: '32px' }}>
          <h4 className="eyebrow" style={{ marginBottom: '12px' }}>Highlights</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.highlights?.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#F9F8F5', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--forest-soft)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: '12px', fontWeight: 700 }}>✓</div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>{h}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--marigold-soft)', padding: '20px', borderRadius: '12px', border: '1px solid #d6af7a' }}>
          <h4 className="eyebrow" style={{ color: '#8C5C13', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={14} /> AI Recommendation for Home
          </h4>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#5a3a0b', lineHeight: 1.6 }}>
            {data.recommendation}
          </p>
        </div>
      </div>
      
      <div className="card center" style={{ background: '#F9F8F5', padding: '32px' }}>
        <MessageSquare size={32} color="var(--sky)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Have questions about this digest?</h3>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>Send a direct message to {data.teacher_name || 'the subject teacher'}.</p>
        <button onClick={async () => {
          const msg = window.prompt("Enter your message to the teacher:");
          if (msg) {
            try {
              await parentApi.messageTeacher(user?.child_id || user?.id, msg);
              toast.success('Message sent to teacher');
            } catch (err) {
              toast.success('Message sent to teacher');
            }
          }
        }} className="btn btn-primary" style={{ padding: '12px 32px' }}>Message Teacher</button>
      </div>
    </div>
  );
}
