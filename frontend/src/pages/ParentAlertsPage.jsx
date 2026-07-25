import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTabs from '../components/SectionTabs';
import { Flag, AlertCircle } from 'lucide-react';
import { parentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ParentAlertsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Alerts');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const childId = user?.child_id || user?.id;
      const res = await parentApi.getAlerts(childId);
      setAlerts(res.data);
    } catch (e) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Alerts</h1>
        </div>
      </div>

      <SectionTabs 
        sections={['Overview', 'Weekly Digest', 'Alerts', 'Settings']} 
        activeSection="Alerts" 
        onChange={(tab) => {
          if (tab === 'Overview') navigate('/parent/overview');
          if (tab === 'Weekly Digest') navigate('/parent/digest');
          if (tab === 'Alerts') navigate('/parent/alerts');
          if (tab === 'Settings') navigate('/parent/settings');
        }} 
      />

      <div className="card mb-8">
        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
          <Flag size={20} className="text-[var(--marigold-dark)]" /> Recent Alerts
        </h3>
        
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : alerts.length === 0 ? (
          <p className="text-[var(--ink-soft)]">No new alerts.</p>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 bg-[var(--redpen-soft)] border border-[var(--redpen)] p-4 rounded-[var(--radius-sm)]">
                <AlertCircle size={20} className="text-[var(--redpen)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[14px] font-bold text-[var(--redpen)] mb-1">{alert.message}</h4>
                  <p className="text-[12px] text-[var(--ink-soft)]">{new Date(alert.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
