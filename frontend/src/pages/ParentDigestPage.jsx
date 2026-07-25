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
    <div className="max-w-[800px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Weekly Digest</h1>
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

      <div className="card mb-8">
        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--marigold-dark)]" /> {data.week || 'Current Week'}
        </h3>
        
        <div className="space-y-6 mb-8">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-3">Highlights</h4>
            {data.highlights?.map((h, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-[#F9F8F5] p-3 rounded-[var(--radius-sm)] border border-[var(--border)] mb-2">
                <div className="w-6 h-6 rounded-full bg-[var(--forest-soft)] text-[var(--forest)] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                <p className="text-[14px] font-medium text-[var(--ink)]">{h}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--marigold-soft)] p-5 rounded-[var(--radius-md)] border border-[#d6af7a]">
          <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-[#8C5C13] mb-2 flex items-center gap-2">
            <BookOpen size={14} /> AI Recommendation for Home
          </h4>
          <p className="text-[14px] font-medium text-[#5a3a0b] leading-relaxed">
            {data.recommendation}
          </p>
        </div>
      </div>
      
      <div className="card bg-[#F9F8F5] border-[var(--border)] text-center py-8">
        <MessageSquare size={32} className="text-[var(--sky)] mx-auto mb-4" />
        <h3 className="text-xl mb-2">Have questions about this digest?</h3>
        <p className="text-sm text-[var(--ink-soft)] mb-6">Send a direct message to {data.teacher_name || 'the subject teacher'}.</p>
        <button onClick={() => toast.success('Message sent to teacher')} className="btn btn-primary px-8">Message Teacher</button>
      </div>
    </div>
  );
}
