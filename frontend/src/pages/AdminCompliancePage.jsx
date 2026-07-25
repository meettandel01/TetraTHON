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
    <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Compliance & Privacy</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 card">
          <h3 className="text-xl mb-6">Data Anonymization Engine</h3>
          <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--forest-soft)] border border-[var(--forest)] rounded-[var(--radius-sm)]">
            <CheckCircle size={24} className="text-[var(--forest)] shrink-0" />
            <div>
              <div className="font-bold text-[var(--forest)] text-[15px]">Active & Running</div>
              <div className="text-sm text-[var(--forest)] opacity-90">PII is successfully being stripped from all LLM inputs before processing.</div>
            </div>
          </div>
          
          <h4 className="font-bold mb-3 text-sm">Recent Audit Logs</h4>
          <div className="space-y-3">
            {data.audit_logs?.map((log, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-[var(--border)] rounded-[var(--radius-sm)] bg-[#F9F8F5]">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[var(--ink-soft)]" />
                  <span className="text-sm font-mono text-[var(--ink)]">{log.filename}</span>
                </div>
                <button onClick={() => toast.success(`Downloading ${log.filename}...`)} className="text-[var(--sky)] font-bold text-xs flex items-center gap-1 hover:underline">
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-[var(--ink)] text-white border-none flex flex-col">
          <h3 className="text-white mb-6">Policy Status</h3>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center pb-4 border-b border-[#3E476B]">
              <span className="text-[14px] text-[#A8A4C4]">FERPA Compliance</span>
              <span className={`badge-medium text-white border-none ${data.status === 'Healthy' ? 'bg-[var(--forest)]' : 'bg-[var(--redpen)]'}`}>{data.status}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#3E476B]">
              <span className="text-[14px] text-[#A8A4C4]">COPPA Compliance</span>
              <span className={`badge-medium text-white border-none ${data.coppa_status === 'Verified' ? 'bg-[var(--forest)]' : 'bg-[var(--marigold-dark)]'}`}>{data.coppa_status || 'Verified'}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#3E476B]">
              <span className="text-[14px] text-[#A8A4C4]">Data Retention</span>
              <span className="font-bold text-[14px]">{data.data_retention_policy}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#3E476B]">
              <span className="text-[14px] text-[#A8A4C4]">Guardian Consents</span>
              <span className="font-bold text-[14px]">{data.total_consents} / {data.total_students}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-[#A8A4C4]">Open Violations</span>
              <span className="badge-medium bg-[#3E476B] text-white border-none">{data.open_violations}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
