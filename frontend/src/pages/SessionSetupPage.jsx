import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Play, ArrowRight, BookOpen, Layers, Star } from 'lucide-react';
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
    navigate('/student/diagnostic', { state: { concept_id: selectedTopic.id, concept_name: selectedTopic.name } });
  };

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  const subjects = selectedStandard ? selectedStandard.children : [];
  const chapters = selectedSubject ? selectedSubject.children : [];
  const topics = selectedChapter ? selectedChapter.children : [];

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Setup Your Learning Session</h1>
          <p className="page-sub">Choose what you'd like to focus on today.</p>
        </div>
        <div>
          <button 
            onClick={handleStart}
            disabled={!selectedTopic}
            className="btn btn-primary"
            style={{ padding: '12px 24px', opacity: selectedTopic ? 1 : 0.5 }}
          >
            START SESSION
            <ArrowRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Selections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: '16px' }}>Class & Subject</h2>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {syllabusTree.map(std => (
                <button 
                  key={std.id}
                  onClick={() => { setSelectedStandard(std); setSelectedSubject(null); setSelectedChapter(null); setSelectedTopic(null); }}
                  className={`btn ${selectedStandard?.id === std.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '8px' }}
                >
                  {std.name}
                </button>
              ))}
            </div>

            {subjects.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {subjects.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => { setSelectedSubject(sub); setSelectedChapter(null); setSelectedTopic(null); }}
                    className={`btn ${selectedSubject?.id === sub.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '8px', background: selectedSubject?.id === sub.id ? 'var(--forest)' : '' }}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSubject && (
            <div className="card" style={{ flex: 1, minHeight: '300px' }}>
              <h2 className="eyebrow" style={{ marginBottom: '16px' }}>Chapter</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {chapters.map(ch => (
                  <div 
                    key={ch.id}
                    onClick={() => { setSelectedChapter(ch); setSelectedTopic(null); }}
                    className="card"
                    style={{ 
                      padding: '16px', 
                      margin: 0, 
                      cursor: 'pointer', 
                      borderColor: selectedChapter?.id === ch.id ? 'var(--ink)' : 'var(--border)',
                      background: selectedChapter?.id === ch.id ? '#F2EEE1' : 'var(--card)',
                      boxShadow: 'none'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Ch {ch.chapter_number}: {ch.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Topics */}
        <div>
          {selectedChapter ? (
             <div className="card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
              <h2 className="eyebrow" style={{ marginBottom: '16px' }}>Select Topic</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                {topics.map(topic => {
                  const score = masteryMap[topic.id] || 0;
                  const isRecommended = recommendedNext === topic.id;
                  const isSelected = selectedTopic?.id === topic.id;
                  
                  return (
                    <div 
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={isSelected ? 'card card-highlight' : 'card'}
                      style={{ 
                        padding: '16px', 
                        margin: 0, 
                        cursor: 'pointer', 
                        borderColor: isRecommended && !isSelected ? 'var(--marigold)' : (isSelected ? 'transparent' : 'var(--border)'),
                        boxShadow: 'none',
                        position: 'relative'
                      }}
                    >
                      {isRecommended && !isSelected && (
                        <div className="badge-foundational badge-sm" style={{ marginBottom: '8px', display: 'inline-flex', gap: '4px' }}>
                          <Star size={12} fill="currentColor" /> Recommended Next
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: isSelected ? 'rgba(255,255,255,0.1)' : 'var(--paper)', flex: 'none' }}>
                          <Layers size={20} color={isSelected ? '#fff' : 'var(--ink)'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>{topic.name}</span>
                            {!isSelected && (
                              <span className="badge-neutral badge-sm" style={{ background: '#EDEAE0', color: masteryColor(score) }}>
                                Mastery: {pct(score)}
                              </span>
                            )}
                          </div>
                          <div className={isSelected ? 'muted' : 'muted small'}>
                            {topic.description || `Adaptive learning session`}
                          </div>
                          
                          {isSelected && (
                            <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '13px' }}>
                              Current mastery: <strong>{pct(score)}</strong>. Ready to dive in?
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {topics.length === 0 && <div className="muted center" style={{ padding: '40px 0' }}>No topics added for this chapter yet.</div>}
              </div>
            </div>
          ) : (
            <div className="card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', background: 'var(--paper)' }}>
              <BookOpen size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
              <p className="muted">Select a Chapter to view Topics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
