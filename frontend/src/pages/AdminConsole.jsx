import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Settings, Database, Server, Upload } from 'lucide-react';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminConsole() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        adminApi.getCompliance(),
        adminApi.getContentStats()
      ]);
      setCompliance(compRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const res = await adminApi.importContent({});
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error('Failed to import content');
    }
  };

  if (loading || !compliance || !stats) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--sky)] rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
      <div className="mb-8 border-b border-[var(--border)] pb-6 flex justify-between items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">Admin Console</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">System Status</h1>
        </div>
        <button onClick={handleImport} className="flex items-center gap-2 bg-[var(--ink)] text-[var(--paper)] px-4 py-2 rounded-full font-bold text-sm hover:bg-[#2B3350]">
          <Upload size={16} /> Import New Content
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-6 text-center">
          <Shield size={24} className="mx-auto text-[#0A6B44] mb-2" />
          <div className="font-bold text-[#0A6B44] text-lg mb-1">{compliance.status}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">API Status</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-6 text-center">
          <Database size={24} className="mx-auto text-[#2947C4] mb-2" />
          <div className="font-bold text-[#2947C4] text-lg mb-1">{stats.total_questions} Items</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Database Indexed</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-6 text-center">
          <Server size={24} className="mx-auto text-[#8C5C13] mb-2" />
          <div className="font-bold text-[#8C5C13] text-lg mb-1">99.9%</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Uptime</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-6 text-center">
          <Settings size={24} className="mx-auto text-[var(--ink)] mb-2" />
          <div className="font-bold text-[var(--ink)] text-lg mb-1">{compliance.anonymization_status}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Anonymization</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-8">
          <h3 className="text-xl font-serif font-bold mb-6">Compliance & Audit</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--ink-soft)] font-medium">Data Retention Policy</span>
              <span className="font-bold text-[var(--ink)]">{compliance.data_retention_policy}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--ink-soft)] font-medium">Open Violations</span>
              <span className="font-bold text-[var(--ink)]">{compliance.open_violations}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--ink-soft)] font-medium">Last Audit Date</span>
              <span className="font-bold text-[var(--ink)]">{new Date(compliance.last_audit).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--r-lg)] p-8">
          <h3 className="text-xl font-serif font-bold mb-6">Content Repository</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--ink-soft)] font-medium">Total Concepts</span>
              <span className="font-bold text-[var(--ink)]">{stats.total_concepts}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--ink-soft)] font-medium">Total Questions</span>
              <span className="font-bold text-[var(--ink)]">{stats.total_questions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--ink-soft)] font-medium">Items Needing Review</span>
              <span className="font-bold text-[var(--redpen)]">{stats.needs_review}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
