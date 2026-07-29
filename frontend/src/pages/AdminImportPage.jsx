import React, { useState } from 'react';
import SectionTabs from '../components/SectionTabs';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminImportPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Import Tool');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [steps, setSteps] = useState([]);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await adminApi.importContent(formData);
      toast.success(res.data.message || 'Import successful');
      if (res.data.steps) setSteps(res.data.steps);
      else if (res.data.pipeline_steps) setSteps(res.data.pipeline_steps);
      setFile(null);
    } catch (e) {
      toast.error('Import failed');
    }
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1>Content Ingestion</h1>
        </div>
      </div>

      <SectionTabs 
        sections={['Dashboard', 'Import Tool', 'Content Repo', 'Compliance']} 
        activeSection={activeTab} 
        onChange={(tab) => {
          if (tab === 'Dashboard') navigate('/admin/dashboard');
          if (tab === 'Content Repo') navigate('/admin/content');
          if (tab === 'Compliance') navigate('/admin/compliance');
        }} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Upload Curriculum</h3>
          <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>Upload PDFs, CSVs, or JSON files containing questions, concepts, and dependency maps.</p>
          
          <div 
            style={{ border: `2px dashed ${dragActive ? 'var(--sky)' : 'var(--border)'}`, background: dragActive ? 'var(--sky-soft)' : '#F9F8F5', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: '0.2s', flex: 1 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={40} color="var(--ink-faint)" style={{ marginBottom: '16px' }} />
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>Drag & Drop files here</div>
            <div className="muted small" style={{ marginBottom: '24px' }}>or click to browse from your computer</div>
            <label className="btn btn-ghost" style={{ background: '#fff', cursor: 'pointer' }}>
              Browse Files
              <input type="file" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
            </label>
          </div>
          
          {file && (
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={20} color="var(--sky)" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{file.name}</span>
              </div>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" style={{ padding: '12px 32px' }} disabled={!file} onClick={handleImport}>Start Processing Pipeline</button>
          </div>
        </div>

        <div className="card" style={{ background: '#F9F8F5' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Processing Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {steps.length > 0 ? steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', opacity: step.status === 'pending' ? 0.5 : 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: step.status === 'completed' ? 'var(--forest)' : '#fff', color: step.status === 'completed' ? '#fff' : 'var(--ink-faint)', border: step.status === 'completed' ? 'none' : '2px solid var(--border)' }}>
                  {step.status === 'completed' ? <CheckCircle size={16}/> : (idx + 1)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{step.title}</div>
                  <div className="muted small">{step.description}</div>
                </div>
              </div>
            )) : (
              <p className="muted small">Waiting for file upload...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
