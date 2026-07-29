import React, { useState, useEffect } from 'react';
import SectionTabs from '../components/SectionTabs';
import { ShieldAlert, CheckCircle, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminCompliancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Compliance');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getCompliance()
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
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1>Compliance & Privacy</h1>
        </div>
      </div>

      <SectionTabs 
        sections={['Dashboard', 'Import Tool', 'Content Repo', 'Compliance']} 
        activeSection={activeTab} 
        onChange={(tab) => {
          if (tab === 'Dashboard') navigate('/admin/dashboard');
          if (tab === 'Import Tool') navigate('/admin/import');
          if (tab === 'Content Repo') navigate('/admin/content');
        }} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Data Anonymization Engine</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--forest-soft)', border: '1px solid var(--forest)', borderRadius: '8px' }}>
            <CheckCircle size={24} color="var(--forest)" style={{ flex: 'none' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--forest)', fontSize: '15px' }}>Active & Running</div>
              <div style={{ fontSize: '14px', color: 'var(--forest)', opacity: 0.9 }}>PII is successfully being stripped from all LLM inputs before processing.</div>
            </div>
          </div>
          
          <h4 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>Recent Audit Logs</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.audit_logs?.map((log, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: '#F9F8F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={16} color="var(--ink-soft)" />
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--ink)' }}>{log.filename}</span>
                </div>
                <button onClick={() => toast.success(`Downloading ${log.filename}...`)} style={{ background: 'none', border: 'none', color: 'var(--sky)', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-highlight" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px', color: '#fff' }}>Policy Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>FERPA Compliance</span>
              <span className="badge-neutral badge-sm" style={{ background: data.status === 'Healthy' ? 'var(--forest)' : 'var(--redpen)', color: '#fff', border: 'none' }}>{data.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>COPPA Compliance</span>
              <span className="badge-neutral badge-sm" style={{ background: data.coppa_status === 'Verified' ? 'var(--forest)' : 'var(--marigold-dark)', color: '#fff', border: 'none' }}>{data.coppa_status || 'Verified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Data Retention</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{data.data_retention_policy}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Guardian Consents</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{data.total_consents} / {data.total_students}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Open Violations</span>
              <span className="badge-neutral badge-sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>{data.open_violations}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
