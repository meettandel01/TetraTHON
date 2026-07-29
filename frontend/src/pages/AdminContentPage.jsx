import React, { useState, useEffect } from 'react';
import SectionTabs from '../components/SectionTabs';
import { Search, Filter, Edit3, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi, conceptsApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminContentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Content Repo');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [stats, setStats] = useState(null);

  const [contents, setContents] = useState([]);
  const [concepts, setConcepts] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    concept_id: '',
    type: 'mcq',
    text: '',
    options: '',
    correct: '',
    explanation: '',
    difficulty: 'medium',
    usage_type: 'practice'
  });

  const loadData = () => {
    adminApi.getContentStats().then(res => setStats(res.data)).catch(console.error);
    adminApi.getContentItems().then(res => setContents(res.data)).catch(console.error);
    conceptsApi.getAll().then(res => setConcepts(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        concept_id: item.concept_id,
        type: item.type,
        text: item.text,
        options: item.options || '',
        correct: item.correct,
        explanation: item.explanation || '',
        difficulty: item.difficulty || 'medium',
        usage_type: item.usage_type || 'practice'
      });
    } else {
      setEditingItem(null);
      setFormData({
        concept_id: concepts.length > 0 ? concepts[0].id : '',
        type: 'mcq',
        text: '',
        options: '',
        correct: '',
        explanation: '',
        difficulty: 'medium',
        usage_type: 'practice'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSave = async (e) => {
    e.preventDefault();
    
    let payload = { ...formData };
    if (payload.type === 'mcq' && payload.options && typeof payload.options === 'string') {
      try {
        payload.options = JSON.parse(payload.options);
      } catch (err) {
        toast.error('Invalid JSON format in options field');
        return;
      }
    }

    try {
      if (editingItem) {
        await adminApi.updateContentItem(editingItem.id, payload);
        toast.success('Content updated successfully');
      } else {
        await adminApi.createContentItem(payload);
        toast.success('Content created successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save content', error);
      toast.error('Failed to save content');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this content item?")) {
      try {
        await adminApi.deleteContentItem(id);
        toast.success('Content deleted');
        loadData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete content item');
      }
    }
  };

  const filtered = contents.filter(c => {
    const matchesSearch = (c.concept_name && c.concept_name.toLowerCase().includes(search.toLowerCase())) || 
                          (c.id && c.id.toString().includes(search));
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesDiff = filterDiff === 'all' || c.difficulty === filterDiff;
    return matchesSearch && matchesType && matchesDiff;
  });

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1>Content Repository</h1>
          {stats && (
            <p className="page-sub" style={{ marginTop: '8px' }}>
              <span style={{ fontWeight: 600 }}>{stats.total_concepts}</span> Concepts &middot; <span style={{ fontWeight: 600 }}>{stats.total_questions}</span> Items &middot; Coverage: {stats.coverage} &middot; <span style={{ color: 'var(--redpen)', fontWeight: 600 }}>{stats.needs_review} Needs Review</span>
            </p>
          )}
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary px-6 text-sm">Create New Content</button>
      </div>

      <SectionTabs 
        sections={['Dashboard', 'Import Tool', 'Content Repo', 'Compliance']} 
        activeSection={activeTab} 
        onChange={(tab) => {
          if (tab === 'Dashboard') navigate('/admin/dashboard');
          if (tab === 'Import Tool') navigate('/admin/import');
          if (tab === 'Compliance') navigate('/admin/compliance');
        }} 
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} size={16} />
            <input 
              type="text" 
              placeholder="Search content ID or concept..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input"
              style={{ width: '100%', paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px', marginBottom: 0 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="field-input" style={{ marginBottom: 0, padding: '8px 12px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="numerical">Numerical</option>
            </select>
            <select className="field-input" style={{ marginBottom: 0, padding: '8px 12px' }} value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>ID</th>
              <th>Type</th>
              <th>Concept Tag</th>
              <th>Status</th>
              <th>Difficulty</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
               const status = (!item.citation || item.citation === '') ? 'Needs Review' : 'Active';
               return (
              <tr key={item.id}>
                <td style={{ paddingLeft: '24px' }} className="mono">{item.id}</td>
                <td>{item.type}</td>
                <td style={{ fontWeight: 600 }}>{item.concept_name || 'Unknown'}</td>
                <td>
                  <span className={status === 'Needs Review' ? 'badge-foundational' : 'badge-advanced'}>
                    {status}
                  </span>
                </td>
                <td className="muted">{item.difficulty}</td>
                <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                  <button onClick={() => handleOpenModal(item)} className="icon-btn" style={{ marginRight: '8px' }}><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="icon-btn"><Trash2 size={16} color="var(--redpen)" /></button>
                </td>
              </tr>
            )})}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
                  No content found matching "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={handleCloseModal}></div>
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--card)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', zIndex: 1001,
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{editingItem ? 'Edit Content' : 'Create Content'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="field-label">Concept</label>
                <select className="field-input" value={formData.concept_id} onChange={e => setFormData({...formData, concept_id: parseInt(e.target.value)})}>
                  {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="field-label">Type</label>
                  <select className="field-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="mcq">MCQ</option>
                    <option value="numerical">Numerical</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Difficulty</label>
                  <select className="field-input" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Question Text</label>
                <textarea required className="field-input" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})}></textarea>
              </div>
              <div>
                <label className="field-label">Options (JSON for MCQ)</label>
                <textarea className="field-input mono" style={{ minHeight: '80px', resize: 'vertical', fontSize: '13px' }} placeholder='{"A": "Option 1", "B": "Option 2"}' value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})}></textarea>
              </div>
              <div>
                <label className="field-label">Correct Answer (Key)</label>
                <input required type="text" className="field-input" placeholder="A" value={formData.correct} onChange={e => setFormData({...formData, correct: e.target.value})} />
              </div>
              <div>
                <label className="field-label">Explanation</label>
                <textarea className="field-input" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
