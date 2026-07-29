import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Settings, Database, Server, Upload } from 'lucide-react';
import SectionTabs from '../components/SectionTabs';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminConsole() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

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

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminApi.importContent(formData);
      toast.success(res.data.message || 'Import successful');
      fetchData();
    } catch (err) {
      toast.error('Failed to import content');
    }
  };

  if (loading || !compliance || !stats) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--sky)] rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1>System Status</h1>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <Upload size={16} /> Import New Content
          <input type="file" style={{ display: 'none' }} onChange={handleImport} />
        </label>
      </div>

      <SectionTabs 
        sections={['Dashboard', 'Import Tool', 'Content Repo', 'Compliance']} 
        activeSection={activeTab} 
        onChange={(tab) => {
          if (tab === 'Import Tool') navigate('/admin/import');
          if (tab === 'Content Repo') navigate('/admin/content');
          if (tab === 'Compliance') navigate('/admin/compliance');
        }} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card center" style={{ padding: '24px', textAlign: 'center' }}>
          <Shield size={24} color="var(--forest)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--forest)', fontSize: '18px', marginBottom: '4px' }}>{compliance.status}</div>
          <div className="eyebrow">API Status</div>
        </div>
        <div className="card center" style={{ padding: '24px', textAlign: 'center' }}>
          <Database size={24} color="var(--sky)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--sky)', fontSize: '18px', marginBottom: '4px' }}>{stats.total_questions} Items</div>
          <div className="eyebrow">Database Indexed</div>
        </div>
        <div className="card center" style={{ padding: '24px', textAlign: 'center' }}>
          <Server size={24} color="var(--marigold-dark)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--marigold-dark)', fontSize: '18px', marginBottom: '4px' }} title={stats.uptime ? '' : 'Monitoring not configured'}>{stats.uptime || 'N/A'}</div>
          <div className="eyebrow">Uptime</div>
        </div>
        <div className="card center" style={{ padding: '24px', textAlign: 'center' }}>
          <Settings size={24} color="var(--ink)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '18px', marginBottom: '4px' }}>{compliance.anonymization_status}</div>
          <div className="eyebrow">Anonymization</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Compliance & Audit</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ fontWeight: 500 }}>Data Retention Policy</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{compliance.data_retention_policy}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ fontWeight: 500 }}>Open Violations</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{compliance.open_violations}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span className="muted" style={{ fontWeight: 500 }}>Last Audit Date</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{new Date(compliance.last_audit).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Content Repository</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ fontWeight: 500 }}>Total Concepts</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{stats.total_concepts}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ fontWeight: 500 }}>Total Questions</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{stats.total_questions}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span className="muted" style={{ fontWeight: 500 }}>Items Needing Review</span>
              <span style={{ fontWeight: 700, color: 'var(--redpen)' }}>{stats.needs_review}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
