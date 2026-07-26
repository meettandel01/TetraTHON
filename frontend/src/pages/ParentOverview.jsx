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
    <div className="max-w-[800px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Namaste, {user?.name || 'Parent'}</h1>
          <p className="text-[var(--ink-soft)] font-medium">Here's how {data.student_name} is doing in Mathematics.</p>
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

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-6 flex flex-col justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--forest-soft)] rounded-bl-full -z-10 opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-[var(--forest-soft)] text-[var(--forest)] flex items-center justify-center mx-auto mb-3">
            <Target size={24} />
          </div>
          <div className="text-[36px] font-serif mb-1 font-bold text-[var(--ink)]">{Math.round(data.mastery_score)}%</div>
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Overall Mastery</div>
        </div>
        
        <div className="card p-6 flex flex-col justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--sky-soft)] rounded-bl-full -z-10 opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-[var(--sky-soft)] text-[var(--sky)] flex items-center justify-center mx-auto mb-3">
            <Clock size={24} />
          </div>
          <div className="text-[36px] font-serif mb-1 font-bold text-[var(--ink)]">{(data.total_learning_time_seconds / 3600).toFixed(1)} <span className="text-lg font-sans text-[var(--ink-soft)]">hrs</span></div>
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Learning Time (This Week)</div>
        </div>
      </div>

      {data.recent_alerts?.map((alert, i) => (
        <div key={i} className="card border-[var(--redpen)] bg-[var(--redpen-soft)] mb-8 flex items-start gap-4">
          <AlertCircle size={24} className="text-[var(--redpen)] shrink-0 mt-1" />
          <div>
            <h3 className="text-[var(--redpen)] mb-1 text-lg">{alert.title}</h3>
            <p className="text-[var(--redpen)] font-medium text-sm mb-3">{alert.description}</p>
            <button onClick={async () => {
              try {
                const res = await parentApi.getAlertLog(user?.child_id || user?.id, alert.id);
                toast(`Log: ${res.data.log || 'No conversation details available.'}`, { icon: '📝' });
              } catch (e) {
                toast('No conversation log recorded for this event yet', { icon: 'ℹ️' });
              }
            }} className="btn bg-white border border-[var(--redpen)] text-[var(--redpen)] text-[13px] py-1.5 px-4 shadow-sm hover:shadow-md">
              View Conversation Log
            </button>
          </div>
        </div>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="mb-0 flex items-center gap-2"><Activity size={18} className="text-[var(--sky)]"/> Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            {data.recent_activity?.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${activity.type === 'mastered' ? 'bg-[var(--forest-soft)] text-[var(--forest)]' : 'bg-[var(--marigold-soft)] text-[var(--marigold-dark)]'}`}>
                  {activity.type === 'mastered' ? '✓' : '?'}
                </div>
                <div>
                  <div className="font-bold text-[var(--ink)] text-sm mb-0.5">{activity.title}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{activity.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-0 flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2 text-[var(--marigold-dark)]">
              <Calendar size={18} /> <span className="font-bold text-[13px] uppercase tracking-wider">Weekly Report Ready</span>
            </div>
            <h3 className="text-xl mb-2">Current Week Report</h3>
            <p className="text-[14px] text-[var(--ink-soft)] font-medium mb-6 leading-relaxed">Read the AI-generated plain english summary of {data.student_name || 'your child'}'s progress and areas for improvement.</p>
            <button onClick={() => navigate('/parent/digest')} className="btn btn-primary w-full justify-center">Read Digest <ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
