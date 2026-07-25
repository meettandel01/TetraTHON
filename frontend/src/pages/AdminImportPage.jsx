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
    <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Content Ingestion</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card h-full">
          <h3 className="text-xl mb-4">Upload Curriculum</h3>
          <p className="text-sm text-[var(--ink-soft)] mb-6">Upload PDFs, CSVs, or JSON files containing questions, concepts, and dependency maps.</p>
          
          <div 
            className={`border-2 border-dashed rounded-[var(--radius-lg)] p-10 flex flex-col items-center justify-center text-center transition-colors ${dragActive ? 'border-[var(--sky)] bg-[var(--sky-soft)]' : 'border-[var(--border)] bg-[#F9F8F5]'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={40} className="text-[var(--ink-faint)] mb-4" />
            <div className="font-bold text-[var(--ink)] text-lg mb-2">Drag & Drop files here</div>
            <div className="text-sm text-[var(--ink-soft)] mb-6">or click to browse from your computer</div>
            <label className="btn bg-white border border-[var(--border)] shadow-sm text-sm cursor-pointer">
              Browse Files
              <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
            </label>
          </div>
          
          {file && (
            <div className="mt-6 flex items-center justify-between p-4 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-[var(--sky)]" />
                <span className="font-bold text-[14px]">{file.name}</span>
              </div>
              <button onClick={() => setFile(null)} className="text-[var(--ink-soft)] hover:text-[var(--redpen)]">✕</button>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button className="btn btn-primary px-8" disabled={!file} onClick={handleImport}>Start Processing Pipeline</button>
          </div>
        </div>

        <div className="card h-full bg-[#F9F8F5]">
          <h3 className="text-xl mb-6">Processing Pipeline</h3>
          <div className="space-y-6">
            {steps.length > 0 ? steps.map((step, idx) => (
              <div key={idx} className={`flex gap-4 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.status === 'completed' ? 'bg-[var(--forest)] text-white shadow-sm' : 'bg-white border-2 border-[var(--border)] text-[var(--ink-faint)]'}`}>
                  {step.status === 'completed' ? <CheckCircle size={16}/> : (idx + 1)}
                </div>
                <div>
                  <div className="font-bold text-[15px] mb-1">{step.title}</div>
                  <div className="text-[13px] text-[var(--ink-soft)]">{step.description}</div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--ink-soft)]">Waiting for file upload...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
