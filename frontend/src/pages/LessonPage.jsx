import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { BookOpen, CheckCircle, ArrowRight, Target, Play, Zap, Loader, Lightbulb } from 'lucide-react'
import { useStudent } from '../context/StudentContext'
import { lessonApi } from '../services/api'
import toast from 'react-hot-toast'

export default function LessonPage() {
  const { student } = useStudent()
  const [loading, setLoading] = useState(true)
  const [lesson, setLesson] = useState(null)
  
  // Tabs: 'learn' | 'practice'
  const [activeTab, setActiveTab] = useState('learn')

  useEffect(() => {
    if (!student) return
    loadLesson()
  }, [student])

  const loadLesson = async () => {
    try {
      setLoading(true)
      const res = await lessonApi.getLesson(student.id)
      setLesson(res.data)
      console.log('[Lesson] Loaded:', res.data.concept_name)
    } catch (err) {
      console.error('[Lesson] Failed to load:', err)
      toast.error('Could not load lesson. Please check connection.')
    } finally {
      setLoading(false)
    }
  }

  const markComplete = async () => {
    try {
      await lessonApi.completeLesson(student.id, lesson.id)
      toast.success('Lesson marked as complete! 🎉')
      loadLesson() // load next
    } catch (err) {
      console.error('[Lesson] Complete error:', err)
      toast.error('Failed to update progress.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[var(--color-border)] flex items-center justify-center mb-6">
          <Loader size={28} className="text-[var(--color-accent-primary)] animate-spin" />
        </div>
        <p className="text-[var(--color-text-secondary)] font-bold uppercase tracking-wider text-sm">Generating your personalized lesson...</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mb-6">
          <CheckCircle size={32} className="text-[var(--color-success)]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-3 tracking-tight">You're all caught up!</h2>
        <p className="text-[var(--color-text-secondary)] font-medium text-lg text-center max-w-md">
          You've mastered all current concepts. Check back later for new modules.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--color-bg-primary)] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* ── Header Area ─────────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-info-light)] border border-[rgba(37,99,235,0.2)] mb-4">
            <Target size={14} className="text-[var(--color-info)]" aria-hidden="true" />
            <span className="text-[var(--color-info)] text-xs font-bold uppercase tracking-wider">Concept Focus</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight leading-tight">
            {lesson.concept_name}
          </h1>
          <p className="text-[var(--color-text-secondary)] font-medium text-lg flex items-center gap-2">
            <Lightbulb size={20} className="text-[var(--color-warning)]" aria-hidden="true" />
            Difficulty matched to: <span className="font-bold text-[var(--color-text-primary)]">{student.level}</span>
          </p>
        </div>

        {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
        <div className="flex gap-4 mb-8 border-b border-[var(--color-border)]" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'learn'}
            onClick={() => setActiveTab('learn')}
            className={`pb-4 px-2 text-base font-bold transition-all relative ${
              activeTab === 'learn' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={18} />
              Learn Concept
            </div>
            {activeTab === 'learn' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-accent-primary)] rounded-t-full" />
            )}
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'practice'}
            onClick={() => setActiveTab('practice')}
            className={`pb-4 px-2 text-base font-bold transition-all relative ${
              activeTab === 'practice' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Play size={18} />
              Practice Questions
            </div>
            {activeTab === 'practice' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-accent-primary)] rounded-t-full" />
            )}
          </button>
        </div>

        {/* ── Content Area ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'learn' ? (
              <div className="card p-8 md:p-12 mb-8">
                <article className="lesson-content prose prose-lg max-w-none">
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                </article>
              </div>
            ) : (
              <div className="card p-8 md:p-12 mb-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-info-light)] flex items-center justify-center border border-[rgba(37,99,235,0.2)]">
                    <Target size={20} className="text-[var(--color-info)]" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Practice Exercises</h3>
                </div>
                
                <article className="lesson-content prose prose-lg max-w-none">
                  <ReactMarkdown>{lesson.practice_questions}</ReactMarkdown>
                </article>

                <div className="mt-12 p-6 bg-[var(--color-warning-light)] rounded-xl border border-[rgba(217,119,6,0.2)] flex items-start gap-4">
                  <Lightbulb size={24} className="text-[var(--color-warning)] flex-shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">Stuck on a question?</h4>
                    <p className="text-sm text-[var(--color-text-secondary)] font-medium mb-4">
                      Don't worry! You can ask our AI tutor for a hint or a full step-by-step breakdown.
                    </p>
                    <a href="/doubt" className="inline-flex items-center gap-2 text-[var(--color-warning)] font-bold hover:underline">
                      Ask AI Tutor <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Completion Button ───────────────────────────────────────────── */}
        <div className="flex justify-end">
          <button 
            onClick={markComplete}
            className="btn-primary py-4 px-8 text-lg shadow-lg hover:shadow-xl"
          >
            <CheckCircle size={20} aria-hidden="true" />
            Mark as Complete
          </button>
        </div>

      </div>
    </div>
  )
}
