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
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1>Alerts</h1>
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

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flag size={20} color="var(--marigold-dark)" /> Recent Alerts
        </h3>
        
        {loading ? (
          <div className="center" style={{ padding: '40px 0' }}><div className="spinner"></div></div>
        ) : alerts.length === 0 ? (
          <p className="muted center" style={{ padding: '40px 0' }}>No new alerts.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {alerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--redpen-soft)', border: '1px solid var(--redpen)', padding: '16px', borderRadius: '8px' }}>
                <AlertCircle size={20} color="var(--redpen)" style={{ flex: 'none', marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--redpen)', marginBottom: '4px' }}>{alert.message}</h4>
                  <p className="muted small" style={{ margin: 0 }}>{new Date(alert.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
