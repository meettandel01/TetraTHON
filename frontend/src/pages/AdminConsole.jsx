import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Settings, Database, Server } from 'lucide-react';

export default function AdminConsole() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="eyebrow">Admin Console</div>
        <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">System Status</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <Shield size={24} className="mx-auto text-[var(--forest)] mb-2" />
          <div className="font-bold text-[var(--ink)] text-lg mb-1">Healthy</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">API Status</div>
        </div>
        <div className="card p-6 text-center">
          <Database size={24} className="mx-auto text-[var(--sky)] mb-2" />
          <div className="font-bold text-[var(--ink)] text-lg mb-1">Synced</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Database</div>
        </div>
        <div className="card p-6 text-center">
          <Server size={24} className="mx-auto text-[var(--marigold-dark)] mb-2" />
          <div className="font-bold text-[var(--ink)] text-lg mb-1">99.9%</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Uptime</div>
        </div>
        <div className="card p-6 text-center">
          <Settings size={24} className="mx-auto text-[var(--ink)] mb-2" />
          <div className="font-bold text-[var(--ink)] text-lg mb-1">v1.2.0</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Version</div>
        </div>
      </div>

      <div className="card p-8">
        <h3 className="text-xl mb-6">Recent System Events</h3>
        <div className="divide-y divide-[var(--border)]">
          <div className="py-3 flex justify-between">
            <span className="font-medium text-[var(--ink)]">Database Backup Completed</span>
            <span className="text-sm text-[var(--ink-faint)]">10 mins ago</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="font-medium text-[var(--ink)]">New Concept Node Added (Class 8)</span>
            <span className="text-sm text-[var(--ink-faint)]">1 hr ago</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="font-medium text-[var(--ink)]">Teacher Role Assigned to User #451</span>
            <span className="text-sm text-[var(--ink-faint)]">2 hrs ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
