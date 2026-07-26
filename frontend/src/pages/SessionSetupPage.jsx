import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Play, ArrowRight, BookOpen, Layers, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function pct(v){ return Math.round(v*100) + '%'; }
function masteryColor(score){
  const hue = Math.max(0, Math.min(1, score)) * 122; // 0=red 122=green
  return `hsl(${hue.toFixed(0)}, 58%, 42%)`;
}

export default function SessionSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [syllabusTree, setSyllabusTree] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [masteryMap, setMasteryMap] = useState({});
  const [recommendedNext, setRecommendedNext] = useState(null);

  const [selectedStandard, setSelectedStandard] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    if (!user) return;
    try {
      const [treeRes, dashRes] = await Promise.all([
        api.get('/concepts/tree'),
        dashboardApi.get(user.student_id)
      ]);
      setSyllabusTree(treeRes.data);
      if (treeRes.data.length > 0) setSelectedStandard(treeRes.data[0]);

      const mMap = {};
      if (dashRes.data?.concept_graph?.nodes) {
        dashRes.data.concept_graph.nodes.forEach(n => {
          mMap[n.id] = n.mastery !== null ? (n.mastery / 100) : 0;
        });
      }
      setMasteryMap(mMap);
      if (dashRes.data?.recommended_next) {
        setRecommendedNext(dashRes.data.recommended_next.id);
      }

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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-2">Setup Your Learning Session</h1>
          <p className="text-[var(--color-text-secondary)]">Choose what you'd like to focus on today.</p>
        </div>
        <motion.div 
          initial={{opacity: 0.5, scale: 0.95}}
          animate={{opacity: selectedTopic ? 1 : 0.5, scale: selectedTopic ? 1 : 0.95}}
        >
          <button 
            onClick={handleStart}
            disabled={!selectedTopic}
            className="btn flex items-center gap-2 px-8 py-3 text-sm font-extrabold rounded-full shadow-lg hover:scale-105 transition-all disabled:opacity-100 disabled:hover:scale-100"
            style={{ background: 'var(--gradient-primary)', color: 'white', border: 'white' }}
          >
            START SESSION
            <ArrowRight size={18} strokeWidth={3} />
          </button>
        </motion.div>
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
                {topics.map(topic => {
                  const score = masteryMap[topic.id] || 0;
                  const isRecommended = recommendedNext === topic.id;
                  const isSelected = selectedTopic?.id === topic.id;
                  
                  return (
                    <div 
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'border-[var(--color-accent-primary)] bg-[var(--gradient-primary)] text-white shadow-md transform scale-[1.02]' : isRecommended ? 'border-[var(--color-primary)] bg-[var(--color-bg-secondary)]' : 'border-transparent bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)] text-[var(--color-text-primary)]'}`}
                    >
                      {isRecommended && !isSelected && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 flex items-center gap-1">
                          <Star size={12} fill="currentColor" /> Recommended Next
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                          <Layers size={18} className={isSelected ? 'text-white' : 'text-[var(--color-accent-primary)]'} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold flex justify-between items-center">
                            <span>{topic.name}</span>
                            {!isSelected && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-black/5" style={{ color: masteryColor(score) }}>
                                {pct(score)}
                              </span>
                            )}
                          </div>
                          <div className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                            {topic.description || `Concept ${topic.concept_code || topic.id} · Adaptive learning session`}
                          </div>
                          
                          {isSelected && (
                            <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} className="mt-3 text-xs bg-black/10 p-2 rounded">
                              Current mastery: {pct(score)}. Ready to dive in?
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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


    </div>
  );
}
