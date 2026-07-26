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

  const filtered = contents.filter(c => 
    (c.concept_name && c.concept_name.toLowerCase().includes(search.toLowerCase())) || 
    (c.id && c.id.toString().includes(search))
  );

  return (
    <div className="max-w-[1000px] mx-auto animate-fade-in p-8 relative">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Content Repository</h1>
          {stats && (
            <p className="text-[var(--ink-soft)] font-medium text-sm mt-2">
              {stats.total_concepts} Concepts &middot; {stats.total_questions} Items &middot; Coverage: {stats.coverage} &middot; <span className="text-[var(--marigold-dark)]">{stats.needs_review} Needs Review</span>
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

      <div className="card p-0 overflow-hidden mb-8">
        <div className="p-4 border-b border-[var(--border)] bg-[#F9F8F5] flex justify-between items-center">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" size={16} />
            <input 
              type="text" 
              placeholder="Search content ID or concept..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input w-full pl-9 py-2 mb-0 text-sm"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-[var(--border)] text-[11.5px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
              <th className="p-4 pl-6">ID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Concept Tag</th>
              <th className="p-4">Status</th>
              <th className="p-4">Difficulty</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
               const status = (!item.citation || item.citation === '') ? 'Needs Review' : 'Active';
               return (
              <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[#F9F8F5] transition-colors">
                <td className="p-4 pl-6 font-mono text-sm">{item.id}</td>
                <td className="p-4 text-[14px] text-[var(--ink-soft)]">{item.type}</td>
                <td className="p-4 font-bold text-[14px]">{item.concept_name || 'Unknown'}</td>
                <td className="p-4">
                  <span className={`badge-medium ${status === 'Needs Review' ? 'bg-[var(--marigold-soft)] text-[var(--marigold-dark)] border border-[#d6af7a]' : 'bg-[var(--forest-soft)] text-[var(--forest)] border border-transparent'}`}>
                    {status}
                  </span>
                </td>
                <td className="p-4 text-[13px] text-[var(--ink-soft)]">{item.difficulty}</td>
                <td className="p-4 text-right pr-6 flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(item)} className="w-8 h-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--sky)] transition-colors shadow-sm"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--redpen)] transition-colors shadow-sm"><Trash2 size={14} /></button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="text-xl font-serif">{editingItem ? 'Edit Content' : 'Create Content'}</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-black"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Concept</label>
                <select className="field-input w-full" value={formData.concept_id} onChange={e => setFormData({...formData, concept_id: parseInt(e.target.value)})}>
                  {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Type</label>
                  <select className="field-input w-full" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="mcq">MCQ</option>
                    <option value="numerical">Numerical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Difficulty</label>
                  <select className="field-input w-full" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Question Text</label>
                <textarea required className="field-input w-full min-h-[80px]" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Options (JSON for MCQ)</label>
                <textarea className="field-input w-full font-mono text-sm min-h-[80px]" placeholder='{"A": "Option 1", "B": "Option 2"}' value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Correct Answer (Key)</label>
                <input required type="text" className="field-input w-full" placeholder="A" value={formData.correct} onChange={e => setFormData({...formData, correct: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Explanation</label>
                <textarea className="field-input w-full min-h-[80px]" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={handleCloseModal} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
