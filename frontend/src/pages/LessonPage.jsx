import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, BookOpen, Clock, ChevronRight, Trophy, Lightbulb, Loader } from 'lucide-react'
import { lessonsApi } from '../services/api'
import { useStudent } from '../context/StudentContext'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'

const levelColors = {
  Foundational: { accent: '#6ee7b7', gradient: 'from-emerald-500 to-teal-500' },
  'Grade-Level': { accent: '#93c5fd', gradient: 'from-blue-500 to-purple-500' },
  Advanced: { accent: '#fcd34d', gradient: 'from-amber-500 to-orange-500' },
}

export default function LessonPage() {
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('lesson') // 'lesson' | 'practice'
  const [currentPQ, setCurrentPQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [practiceResults, setPracticeResults] = useState([])
  const [done, setDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const { student } = useStudent()
  const navigate = useNavigate()
  const level = student?.level || 'Grade-Level'
  const lc = levelColors[level] || levelColors['Grade-Level']

  useEffect(() => {
    if (!student) { navigate('/'); return }
    fetchLesson()
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchLesson = async () => {
    try {
      const res = await lessonsApi.getByLevel(level)
      const lessons = res.data
      if (lessons.length > 0) {
        setLesson(lessons[0])
        console.log('[Lesson] Loaded:', lessons[0].title)
        // Start session
        await lessonsApi.startSession(student.id, lessons[0].id)
      }
    } catch (err) {
      toast.error('Failed to load lesson: ' + err.message)
      console.error('[Lesson] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (option) => {
    if (answered) return
    setSelected(option)
    setAnswered(true)

    const pq = lesson.practice_questions[currentPQ]
    const isCorrect = option === pq.correct

    if (isCorrect) setScore((s) => s + 1)
    setPracticeResults((r) => [...r, { ...pq, selected: option, isCorrect }])

    try {
      await lessonsApi.submitPractice({
        student_id: student.id,
        lesson_id: lesson.id,
        question_id: pq.id,
        selected_option: option,
        correct_option: pq.correct,
        concept: pq.concept,
      })
    } catch (err) {
      console.error('[Lesson] Practice submit error:', err)
    }
  }

  const handleNextPQ = () => {
    if (currentPQ < lesson.practice_questions.length - 1) {
      setCurrentPQ((i) => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setDone(true)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading your personalized lesson...</p>
        </div>
      </div>
    )
  }

  if (!lesson) return null

  if (done) {
    const totalPQ = lesson.practice_questions.length
    const pct = Math.round((score / totalPQ) * 100)
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-grid py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-6xl mb-6 animate-float inline-block">🎉</div>
          <h1 className="text-3xl font-black mb-3">Lesson Complete!</h1>
          <p className="text-slate-400 mb-8">You scored {score}/{totalPQ} on practice questions ({pct}%)</p>

          <div className="card mb-6">
            <div className="space-y-3">
              {practiceResults.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: r.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                  {r.isCorrect
                    ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                    : <XCircle size={18} className="text-red-400 flex-shrink-0" />
                  }
                  <div className="text-left">
                    <p className="text-sm">{r.text.substring(0, 60)}...</p>
                    {!r.isCorrect && <p className="text-xs text-slate-500 mt-1">{r.explanation}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/doubt')} className="btn-secondary flex-1 justify-center">
              <Lightbulb size={16} /> Ask a Doubt
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1 justify-center">
              <Trophy size={16} /> View Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-grid pb-12">
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-4 py-3"
        style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${lc.gradient} flex items-center justify-center`}>
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">{lesson.title}</p>
              <p className="text-xs text-slate-500">{level} Path · {lesson.duration_minutes} min lesson</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={13} />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Phase Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['lesson', 'practice'].map((p) => (
            <button
              key={p}
              onClick={() => p === 'practice' && setPhase('practice')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: phase === p ? 'rgba(59,130,246,0.25)' : 'transparent',
                color: phase === p ? '#93c5fd' : '#64748b',
                border: phase === p ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              }}
            >
              {p === 'lesson' ? '📖 Lesson' : '✏️ Practice (3 Qs)'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {phase === 'lesson' ? (
            <motion.div key="lesson" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Real world */}
              <div className="card mb-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Why This Matters</p>
                <p className="text-sm text-slate-300">{lesson.content.real_world}</p>
              </div>

              {/* Intro */}
              <div className="card mb-4">
                <p className="text-slate-300 leading-relaxed">{lesson.content.intro}</p>
              </div>

              {/* Main content */}
              <div className="card lesson-content mb-4">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {lesson.content.explanation}
                </ReactMarkdown>
              </div>

              {/* Visual hint */}
              <div className="card mb-6" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Memory Trick</p>
                    <p className="text-sm text-slate-300">{lesson.content.visual_hint}</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                onClick={() => setPhase('practice')}
                className="btn-primary w-full justify-center text-base py-4"
              >
                Start Practice Questions
                <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="practice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {/* Practice progress */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Practice Questions</h3>
                <span className="text-sm text-slate-400">{currentPQ + 1} / {lesson.practice_questions.length}</span>
              </div>
              <div className="progress-bar mb-6">
                <div className="progress-fill" style={{ width: `${((currentPQ) / lesson.practice_questions.length) * 100}%` }} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPQ}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  {(() => {
                    const pq = lesson.practice_questions[currentPQ]
                    return (
                      <div className="card mb-4">
                        <p className="text-xs text-slate-500 mb-3">{pq.concept}</p>
                        <h3 className="text-lg font-bold mb-5">{pq.text}</h3>
                        <div className="space-y-2">
                          {Object.entries(pq.options).map(([key, val]) => {
                            let style = {
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }
                            if (answered) {
                              if (key === pq.correct) style = { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)' }
                              else if (key === selected && key !== pq.correct) style = { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)' }
                            } else if (selected === key) {
                              style = { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.5)' }
                            }
                            return (
                              <button
                                key={key}
                                onClick={() => handleAnswer(key)}
                                disabled={answered}
                                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all"
                                style={style}
                              >
                                <span className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{key}</span>
                                <span className="text-sm">{val}</span>
                                {answered && key === pq.correct && <CheckCircle size={16} className="text-emerald-400 ml-auto" />}
                                {answered && key === selected && key !== pq.correct && <XCircle size={16} className="text-red-400 ml-auto" />}
                              </button>
                            )
                          })}
                        </div>
                        {answered && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-xl"
                            style={{ background: selected === pq.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}
                          >
                            <p className="text-sm font-medium mb-1">{selected === pq.correct ? '✅ Correct!' : '❌ Not quite.'}</p>
                            <p className="text-xs text-slate-400">{pq.explanation}</p>
                          </motion.div>
                        )}
                      </div>
                    )
                  })()}

                  {answered && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleNextPQ}
                      className="btn-primary w-full justify-center"
                    >
                      {currentPQ < lesson.practice_questions.length - 1 ? 'Next Question' : 'Finish Lesson'} <ChevronRight size={16} />
                    </motion.button>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
