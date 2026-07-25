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
    <div className="max-w-[800px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <div className="eyebrow">Parent Portal</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Settings</h1>
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

      <div className="card mb-6">
        <h3 className="text-xl mb-6">Notification Preferences</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
            <div className="flex items-start gap-4">
              <Mail className="text-[var(--ink-soft)] mt-1" size={20} />
              <div>
                <div className="font-bold text-[var(--ink)] text-[15px]">Email Digest</div>
                <div className="text-[13px] text-[var(--ink-soft)]">Receive the weekly AI digest via email</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.email_alerts} onChange={(e) => setSettings({...settings, email_alerts: e.target.checked})} />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--forest)]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
            <div className="flex items-start gap-4">
              <Smartphone className="text-[var(--ink-soft)] mt-1" size={20} />
              <div>
                <div className="font-bold text-[var(--ink)] text-[15px]">SMS Alerts</div>
                <div className="text-[13px] text-[var(--ink-soft)]">Get text messages for immediate escalations</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.whatsapp_digest} onChange={(e) => setSettings({...settings, whatsapp_digest: e.target.checked})} />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--forest)]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <Globe className="text-[var(--ink-soft)] mt-1" size={20} />
              <div>
                <div className="font-bold text-[var(--ink)] text-[15px]">Language</div>
                <div className="text-[13px] text-[var(--ink-soft)]">Preferred language for digests and alerts</div>
              </div>
            </div>
            <select className="field-select w-auto min-w-[120px] mb-0 py-1.5 px-3" value={settings.digest_frequency} onChange={(e) => setSettings({...settings, digest_frequency: e.target.value})}>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="btn btn-primary px-8" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}
