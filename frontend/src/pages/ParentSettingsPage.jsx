import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTabs from '../components/SectionTabs';
import { Bell, Mail, Smartphone, Globe } from 'lucide-react';
import { parentApi } from '../services/api';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

export default function ParentSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Settings');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ whatsapp_digest: true, email_alerts: true, digest_frequency: 'weekly' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const childId = user?.child_id || user?.id;
      const res = await parentApi.getSettings?.(childId);
      if (res && res.data) setSettings(res.data);
    } catch (e) {
      console.error('Error fetching settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (parentApi.updateSettings) {
        const childId = user?.child_id || user?.id;
        await parentApi.updateSettings(childId, settings);
        toast.success('Settings saved!');
      }
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1>Settings</h1>
        </div>
      </div>

      <SectionTabs 
        sections={['Overview', 'Weekly Digest', 'Alerts', 'Settings']} 
        activeSection="Settings" 
        onChange={(tab) => {
          if (tab === 'Overview') navigate('/parent/overview');
          if (tab === 'Weekly Digest') navigate('/parent/digest');
          if (tab === 'Alerts') navigate('/parent/alerts');
          if (tab === 'Settings') navigate('/parent/settings');
        }} 
      />

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Notification Preferences</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Mail color="var(--ink-soft)" size={20} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>Email Digest</div>
                <div className="muted small">Receive the weekly AI digest via email</div>
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-flex', items: 'center', cursor: 'pointer' }}>
              <input type="checkbox" style={{ opacity: 0, position: 'absolute' }} checked={settings.email_alerts} onChange={(e) => setSettings({...settings, email_alerts: e.target.checked})} />
              <div style={{ width: '44px', height: '24px', background: settings.email_alerts ? 'var(--forest)' : 'var(--border)', borderRadius: '999px', position: 'relative', transition: '0.2s' }}>
                <div style={{ position: 'absolute', top: '2px', left: settings.email_alerts ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: '0.2s' }}></div>
              </div>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Smartphone color="var(--ink-soft)" size={20} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>SMS Alerts</div>
                <div className="muted small">Get text messages for immediate escalations</div>
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-flex', items: 'center', cursor: 'pointer' }}>
              <input type="checkbox" style={{ opacity: 0, position: 'absolute' }} checked={settings.whatsapp_digest} onChange={(e) => setSettings({...settings, whatsapp_digest: e.target.checked})} />
              <div style={{ width: '44px', height: '24px', background: settings.whatsapp_digest ? 'var(--forest)' : 'var(--border)', borderRadius: '999px', position: 'relative', transition: '0.2s' }}>
                <div style={{ position: 'absolute', top: '2px', left: settings.whatsapp_digest ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: '0.2s' }}></div>
              </div>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Globe color="var(--ink-soft)" size={20} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>Language</div>
                <div className="muted small">Preferred language for digests and alerts</div>
              </div>
            </div>
            <select style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} value={settings.digest_frequency} onChange={(e) => setSettings({...settings, digest_frequency: e.target.value})}>
              <option value="weekly">English</option>
              <option value="daily">Hindi</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ padding: '12px 32px' }} onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}
