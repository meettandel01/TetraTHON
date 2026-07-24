import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, BookOpen, Target, Clock, AlertTriangle, Zap, CheckCircle, ChevronRight, Activity } from 'lucide-react'
import { useStudent } from '../context/StudentContext'
import { dashboardApi } from '../services/api'
import KnowledgeGraph from '../components/KnowledgeGraph'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { student } = useStudent()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return
    loadStats()
  }, [student])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await dashboardApi.getStats(student.id)
      setStats(res.data)
    } catch (err) {
      console.error('[Dashboard] Error:', err)
      toast.error('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[var(--color-border)] flex items-center justify-center animate-pulse">
          <Activity size={28} className="text-[var(--color-accent-primary)]" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  // Process mastery data for charts
  const concepts = Object.keys(stats.concept_mastery)
  const masteryValues = Object.values(stats.concept_mastery)

  // Status style helper
  const getStatusStyle = (status) => {
    if (status === 'mastered') return { bg: 'var(--color-success-light)', color: 'var(--color-success)', text: 'Mastered', icon: CheckCircle }
    if (status === 'weak') return { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', text: 'Needs Work', icon: AlertTriangle }
    return { bg: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', text: 'Unattempted', icon: BookOpen }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--color-bg-primary)] py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)] mb-2 tracking-tight">Overview</h1>
          <p className="text-lg text-[var(--color-text-secondary)] font-medium">Track your learning progress and mastery.</p>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Mastery Score</span>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center">
                <Target size={20} className="text-[var(--color-success)]" aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">{stats.mastery_score}</span>
              <span className="text-xl font-bold text-[var(--color-text-muted)]">%</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Current Level</span>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-info-light)] flex items-center justify-center">
                <Zap size={20} className="text-[var(--color-info)]" aria-hidden="true" />
              </div>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]" style={{ color: 'var(--color-info)' }}>{stats.current_level}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Lessons Completed</span>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center">
                <BookOpen size={20} className="text-[var(--color-warning)]" aria-hidden="true" />
              </div>
            </div>
            <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">{stats.lessons_completed}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Doubts Resolved</span>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center border border-[var(--color-border)]">
                <CheckCircle size={20} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
              </div>
            </div>
            <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">{stats.doubts_asked}</span>
          </motion.div>
        </div>

        {/* ── Main Content Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Concept Mastery Bars */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-8">
              <h3 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-6 tracking-tight flex items-center gap-2">
                <BarChart2 size={24} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                Concept Performance
              </h3>
              
              <div className="space-y-6">
                {concepts.map((concept, idx) => {
                  const mastery = masteryValues[idx] || 0
                  return (
                    <div key={concept}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{concept}</span>
                        <span className="text-sm font-extrabold" style={{ color: 'var(--color-accent-primary)' }}>{mastery}%</span>
                      </div>
                      <div className="progress-bar h-2.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={mastery} aria-valuemin="0" aria-valuemax="100">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 bg-[var(--gradient-primary)]"
                          style={{ width: `${mastery}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {concepts.length === 0 && (
                  <p className="text-sm text-[var(--color-text-secondary)] font-medium text-center py-4 bg-[var(--color-bg-secondary)] rounded-xl">No concepts tested yet.</p>
                )}
              </div>
            </div>

            {/* Knowledge Graph */}
            <div className="card p-8">
              <h3 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-6 tracking-tight flex items-center gap-2">
                <Activity size={24} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                Knowledge Graph
              </h3>
              <KnowledgeGraph graphData={stats.concept_graph} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Concept Status List */}
            <div className="card p-8">
              <h3 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-6 tracking-tight flex items-center gap-2">
                <Target size={24} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                Status Map
              </h3>
              <ul className="space-y-3 m-0 p-0 list-none" aria-label="Concept Status">
                {(stats.concept_graph?.nodes || []).filter(n => n.status !== 'root').map(node => {
                  const style = getStatusStyle(node.status)
                  const Icon = style.icon
                  return (
                    <li key={node.id} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ background: style.bg, borderColor: `rgba(0,0,0,0.05)` }}>
                      <div className="flex items-center gap-3">
                        <Icon size={18} style={{ color: style.color }} aria-hidden="true" />
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{node.name}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Recent Doubts */}
            <div className="card p-8">
              <h3 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-6 tracking-tight flex items-center gap-2">
                <Clock size={24} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                Recent Doubts
              </h3>
              {stats.recent_doubts && stats.recent_doubts.length > 0 ? (
                <ul className="space-y-4 m-0 p-0 list-none" aria-label="Recent Doubts">
                  {stats.recent_doubts.map(doubt => (
                    <li key={doubt.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                          {new Date(doubt.created_at).toLocaleDateString()}
                        </span>
                        <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)] transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-relaxed">
                        {doubt.question_text || 'Image based doubt'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)] font-medium text-center py-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                  No doubts asked yet.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
