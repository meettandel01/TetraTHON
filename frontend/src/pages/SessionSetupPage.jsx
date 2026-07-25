import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Play, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SessionSetupPage() {
  const navigate = useNavigate();
  const [syllabusTree, setSyllabusTree] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      const res = await api.get('/concepts/tree');
      setSyllabusTree(res.data);
      if (res.data.length > 0) setSelectedStandard(res.data[0]);
    } catch (err) {
      toast.error('Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!selectedTopic) return toast.error('Please select a topic to begin');
    // We navigate to the diagnostic quiz first, passing the topic ID
    navigate('/student/diagnostic', { state: { concept_id: selectedTopic.id, concept_name: selectedTopic.name } });
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="spinner"></div></div>;
  }

  const subjects = selectedStandard ? selectedStandard.children : [];
  const chapters = selectedSubject ? selectedSubject.children : [];
  const topics = selectedChapter ? selectedChapter.children : [];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-2">Setup Your Learning Session</h1>
        <p className="text-[var(--color-text-secondary)]">Choose what you'd like to focus on today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Selections */}
        <div className="space-y-6">
          
          {/* Standard & Subject Selection (Simplified) */}
          <div className="card p-5 space-y-4 shadow-sm border border-[var(--color-border)]">
            <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Class & Subject</h2>
            
            <div className="flex gap-2">
              {syllabusTree.map(std => (
                <button 
                  key={std.id}
                  onClick={() => { setSelectedStandard(std); setSelectedSubject(null); setSelectedChapter(null); setSelectedTopic(null); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedStandard?.id === std.id ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)]'}`}
                >
                  {std.name}
                </button>
              ))}
            </div>

            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {subjects.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => { setSelectedSubject(sub); setSelectedChapter(null); setSelectedTopic(null); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedSubject?.id === sub.id ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)]'}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter Selection */}
          {selectedSubject && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="card p-5 space-y-3 shadow-sm border border-[var(--color-border)]">
              <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Chapter</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {chapters.map(ch => (
                  <div 
                    key={ch.id}
                    onClick={() => { setSelectedChapter(ch); setSelectedTopic(null); }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedChapter?.id === ch.id ? 'border-[var(--color-accent-primary)] bg-[var(--color-primary-light)]' : 'border-transparent bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]'}`}
                  >
                    <div className="font-semibold text-[var(--color-text-primary)]">Ch {ch.chapter_number}: {ch.name}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column: Topics */}
        <div className="space-y-6">
          {selectedChapter ? (
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="card p-5 h-full flex flex-col shadow-sm border border-[var(--color-border)]">
              <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Select Topic</h2>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {topics.map(topic => (
                  <div 
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${selectedTopic?.id === topic.id ? 'bg-[var(--gradient-primary)] text-white shadow-md transform scale-[1.02]' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${selectedTopic?.id === topic.id ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                        <Layers size={18} className={selectedTopic?.id === topic.id ? 'text-white' : 'text-[var(--color-accent-primary)]'} />
                      </div>
                      <div>
                        <div className="font-bold">{topic.name}</div>
                        <div className={`text-xs mt-1 ${selectedTopic?.id === topic.id ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                          {topic.description || `Concept ${topic.concept_code || topic.id} · Adaptive learning session`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {topics.length === 0 && <div className="text-center p-8 text-gray-500">No topics added for this chapter yet.</div>}
              </div>

            </motion.div>
          ) : (
            <div className="card p-5 h-full flex flex-col items-center justify-center text-center border-dashed border-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)] opacity-70">
              <BookOpen size={48} className="text-[var(--color-border)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">Select a Chapter to view Topics</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <motion.div 
        initial={{opacity: 0, y:20}}
        animate={{opacity: selectedTopic ? 1 : 0, y: selectedTopic ? 0 : 20}}
        className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[var(--color-border)] shadow-lg flex justify-center z-40"
      >
        <button 
          onClick={handleStart}
          disabled={!selectedTopic}
          className="btn flex items-center gap-2 px-12 py-4 text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          style={{ background: 'var(--gradient-primary)', color: 'white', border: 'none' }}
        >
          <Play fill="currentColor" size={20} />
          Start Session on {selectedTopic?.short_name || selectedTopic?.name}
          <ArrowRight size={20} />
        </button>
      </motion.div>
      <div className="h-24"></div> {/* padding for fixed footer */}
    </div>
  );
}
