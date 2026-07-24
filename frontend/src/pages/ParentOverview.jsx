import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, TrendingUp, Sparkles, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { parentApi } from '../services/api';
import toast from 'react-hot-toast';

export default function ParentOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [digest, setDigest] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Assuming child_id is 1 for the demo parent
    const childId = 1;
    fetchData(childId);
  }, []);

  const fetchData = async (childId) => {
    setLoading(true);
    try {
      const [overviewRes, digestRes, alertsRes] = await Promise.all([
        parentApi.getOverview(childId),
        parentApi.getDigest(childId),
        parentApi.getAlerts(childId)
      ]);
      setOverview(overviewRes.data);
      setDigest(digestRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      toast.error('Failed to load parent portal data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overview) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--sky)] rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-[800px] mx-auto animate-fade-in p-8">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">Parent Portal</div>
        <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Welcome, {user?.name || 'Parent'}</h1>
        <p className="text-[var(--ink-soft)] font-medium">Here's how {overview.student_name} is doing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-6 flex flex-col justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--forest-soft)] text-[#0A6B44] flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={24} />
          </div>
          <div className="text-[32px] font-serif mb-1 font-bold text-[#0A6B44]">{overview.mastery_score ? (overview.mastery_score * 100).toFixed(0) : 0}%</div>
          <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Overall Mastery</div>
        </div>
        
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-6 flex flex-col justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--sky-soft)] text-[#2947C4] flex items-center justify-center mx-auto mb-3">
            <Clock size={24} />
          </div>
          <div className="text-[32px] font-serif mb-1 font-bold text-[#2947C4]">{(overview.total_learning_time_seconds / 3600).toFixed(1)} hrs</div>
          <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Learning Time</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-8 space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-[var(--redpen-soft)] border border-[var(--redpen)] p-4 rounded-[var(--r-md)] flex items-start gap-3">
              <AlertTriangle className="text-[#A5281F] shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-[#A5281F] text-sm uppercase tracking-wide">{alert.type} Alert</h4>
                <p className="text-sm text-[#A5281F]">{alert.message}</p>
                <p className="text-xs text-[#A5281F] opacity-80 mt-1">{new Date(alert.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-8 mb-8">
        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-[#8C5C13]" /> Weekly Digest: {digest.week}
        </h3>
        <div className="space-y-4 mb-8">
          {digest.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-3 bg-[var(--paper)] p-3 rounded-[var(--r-sm)] border border-[var(--border)]">
              <div className="w-6 h-6 rounded-full bg-[var(--forest-soft)] text-[#0A6B44] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
              <p className="text-[15px] font-medium text-[var(--ink)]">{h}</p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--marigold-soft)] p-5 rounded-[var(--r-md)] border border-[#d6af7a]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#8C5C13] mb-2 flex items-center gap-2">
            <BookOpen size={16} /> Recommendation for {overview.student_name}
          </h4>
          <p className="text-[15px] font-medium text-[#5a3a0b]">{digest.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
