import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Brain, BookOpen, MessageCircle, TrendingUp, AlertTriangle, Loader, Trophy } from 'lucide-react'
import { dashboardApi } from '../services/api'
import { useStudent } from '../context/StudentContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import KnowledgeGraph from '../components/KnowledgeGraph'

const levelColors = {
  Foundational: { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  'Grade-Level': { color: '#93c5fd', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  Advanced: { color: '#fcd34d', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
}

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card glass-hover"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </motion.div>
)

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { student } = useStudent()
  const navigate = useNavigate()

  useEffect(() => {
    if (!student) { navigate('/'); return }
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.get(student.id)
      setData(res.data)
      console.log('[Dashboard] Loaded:', res.data)
    } catch (err) {
      toast.error('Failed to load dashboard: ' + err.message)
      console.error('[Dashboard] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={36} className="animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const levelStyle = levelColors[data.student.level] || levelColors['Grade-Level']
  const conceptEntries = Object.entries(data.concept_performance || {})

  return (
    <div className="min-h-screen bg-grid py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black mb-1">
                Hey, <span className="gradient-text-blue">{data.student.name}</span> 👋
              </h1>
              <p className="text-slate-400">Here's your learning progress</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: levelStyle.bg, border: `1px solid ${levelStyle.border}` }}>
              <Trophy size={16} style={{ color: levelStyle.color }} />
              <span className="font-bold text-sm" style={{ color: levelStyle.color }}>{data.student.level}</span>
              <span className="text-slate-500 text-sm">· Class {data.student.grade}</span>
            </div>
          </div>
        </motion.div>

        {/* Mastery Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              <h3 className="font-bold">Overall Mastery Score</h3>
            </div>
            <span className="text-2xl font-black text-blue-400">{data.student.mastery_score}%</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${data.student.mastery_score}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={BookOpen} label="Lessons Started" value={data.stats.sessions_total} color="#3b82f6" delay={0.2} />
          <StatCard icon={BarChart2} label="Quiz Accuracy" value={`${data.stats.quiz_accuracy}%`} color="#8b5cf6" delay={0.25} />
          <StatCard icon={MessageCircle} label="Doubts Asked" value={data.stats.doubts_asked} color="#06b6d4" delay={0.3} />
          <StatCard icon={AlertTriangle} label="Weak Concepts" value={data.stats.weak_concepts_count} color="#f59e0b" delay={0.35} />
        </div>

        {/* Knowledge Graph */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
          <KnowledgeGraph conceptPerformance={data.concept_performance} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Concept Performance */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Brain size={17} className="text-purple-400" />
              Concept Performance
            </h3>
            {conceptEntries.length === 0 ? (
              <p className="text-slate-500 text-sm">Take the quiz to see concept breakdown!</p>
            ) : (
              <div className="space-y-3">
                {conceptEntries.map(([concept, perf], i) => {
                  const pct = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0
                  const isWeak = pct < 50
                  return (
                    <div key={concept}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-300 flex items-center gap-1.5">
                          {isWeak && <AlertTriangle size={12} className="text-amber-400" />}
                          {concept}
                        </span>
                        <span className="text-xs font-bold" style={{ color: isWeak ? '#f59e0b' : '#6ee7b7' }}>
                          {perf.correct}/{perf.total}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                          style={{
                            background: isWeak
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : 'linear-gradient(90deg, #10b981, #06b6d4)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Doubts */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }} className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MessageCircle size={17} className="text-cyan-400" />
              Recent Doubts
            </h3>
            {data.recent_doubts.length === 0 ? (
              <p className="text-slate-500 text-sm">No doubts asked yet. Try the Doubt Resolver!</p>
            ) : (
              <div className="space-y-3">
                {data.recent_doubts.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm text-slate-300 mb-1">{d.question}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: d.mode === 'socratic' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', color: d.mode === 'socratic' ? '#c4b5fd' : '#93c5fd' }}>
                        {d.mode}
                      </span>
                      <span className="text-xs text-slate-600">{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h3 className="font-bold mb-3 text-slate-400 text-sm uppercase tracking-wider">Continue Learning</h3>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate('/lesson')} className="btn-primary">
              <BookOpen size={16} /> Resume Lesson
            </button>
            <button onClick={() => navigate('/doubt')} className="btn-secondary">
              <Brain size={16} /> Ask a Doubt
            </button>
            <button onClick={() => navigate('/quiz')} className="btn-secondary">
              <BarChart2 size={16} /> Retake Quiz
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
