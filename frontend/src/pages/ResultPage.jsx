import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { BookOpen, Target, ArrowRight, TrendingUp, Sparkles, AlertTriangle, Zap, Play } from 'lucide-react'
import { useStudent } from '../context/StudentContext'

// SVG Circular Progress Component
const CircularProgress = ({ value, color, size = 120, strokeWidth = 10, label = "Score" }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }} role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
      {/* Background circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-bg-secondary)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {value}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">{label}</span>
      </div>
    </div>
  )
}

export default function ResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { student } = useStudent()
  const [mounted, setMounted] = useState(false)

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!state?.level) {
      navigate('/quiz')
    } else {
      setMounted(true)
      // Confetti effect based on level
      if (state.level === 'Advanced') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#D97706', '#F59E0B'] })
      } else {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#0D9488', '#14B8A6'] })
      }
    }
  }, [state, navigate])

  if (!mounted || !state) return null

  const { level, mastery_score, results = [], weak_concepts = [] } = state
  
  // Calculate breakdown stats
  const total = results.length || 5
  const correctCount = results.filter(r => r.is_correct).length
  const accuracy = Math.round((correctCount / total) * 100) || mastery_score

  const levelDetails = {
    Foundational: { color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: Target, msg: "Let's build a rock-solid foundation." },
    'Grade-Level': { color: 'var(--color-info)', bg: 'var(--color-info-light)', icon: BookOpen, msg: "You're right on track! Let's solidify those concepts." },
    Advanced: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: Sparkles, msg: "Outstanding! Let's tackle some challenging problems." },
  }
  const detail = levelDetails[level] || levelDetails['Grade-Level']
  const LevelIcon = detail.icon

  return (
    <section aria-labelledby="result-heading" className="min-h-[calc(100vh-80px)] bg-[var(--color-bg-primary)] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ── Main Results Card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center p-10 md:p-14 relative overflow-hidden"
        >
          {/* Subtle background decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: detail.bg }} aria-hidden="true" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border"
              style={{ background: detail.bg, borderColor: `rgba(0,0,0,0.05)`, color: detail.color }}
            >
              <LevelIcon size={40} aria-hidden="true" />
            </div>

            <h1 id="result-heading" className="text-4xl md:text-5xl font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight">
              You're in the <span style={{ color: detail.color }}>{level}</span> track
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-text-secondary)] font-medium mb-10 max-w-xl mx-auto">
              {detail.msg} We've crafted a custom learning path to help you master Math at your perfect pace.
            </p>

            <div className="flex flex-wrap justify-center gap-10 md:gap-16">
              <CircularProgress value={mastery_score} color="var(--color-accent-primary)" label="Mastery" size={140} strokeWidth={12} />
              <CircularProgress value={accuracy} color={detail.color} label="Accuracy" size={140} strokeWidth={12} />
            </div>
          </div>
        </motion.div>

        {/* ── Action & Analysis Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Action Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-info-light)] flex items-center justify-center mb-6 border border-[rgba(37,99,235,0.2)]">
                <TrendingUp size={24} className="text-[var(--color-info)]" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-3 tracking-tight">Your Next Step</h2>
              <p className="text-[var(--color-text-secondary)] mb-8 font-medium leading-relaxed">
                Based on your results, we've unlocked a personalized 10-minute micro-lesson focusing exactly on what you need to learn next.
              </p>
            </div>
            <button
              onClick={() => navigate('/lesson')}
              className="btn-primary w-full justify-center py-4 text-lg shadow-lg hover:shadow-xl group"
            >
              <Play size={20} className="mr-2 fill-current" aria-hidden="true" />
              Start First Lesson
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </button>
          </motion.div>

          {/* Weak Concepts Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center border border-[rgba(217,119,6,0.2)]">
                <AlertTriangle size={20} className="text-[var(--color-warning)]" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Concepts to Review</h2>
            </div>
            
            {weak_concepts && weak_concepts.length > 0 ? (
              <ul className="space-y-4 m-0 p-0 list-none" aria-label="List of concepts to review">
                {weak_concepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-sm font-bold text-[var(--color-text-muted)]">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">{concept}</p>
                      <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">We'll focus on this in your upcoming lessons.</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center p-8 bg-[var(--color-success-light)] rounded-xl border border-[rgba(13,148,136,0.2)]">
                <Zap size={32} className="text-[var(--color-success)] mx-auto mb-3" aria-hidden="true" />
                <p className="text-[var(--color-success)] font-bold">Perfect score! You're ready for advanced challenges.</p>
              </div>
            )}
          </motion.div>
        </div>
        
      </div>
    </section>
  )
}
