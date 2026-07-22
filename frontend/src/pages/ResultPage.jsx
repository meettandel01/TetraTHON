import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle, XCircle, ArrowRight, Trophy,
  Star, BookOpen, Zap, AlertTriangle, TrendingUp, Brain,
} from 'lucide-react'
import { useStudent } from '../context/StudentContext'
import confetti from 'canvas-confetti'

// ── Level configuration ────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Foundational: {
    emoji: '🌱',
    color: '#6ee7b7',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    glowColor: 'rgba(16,185,129,0.25)',
    borderColor: 'rgba(16,185,129,0.3)',
    bgColor: 'rgba(16,185,129,0.07)',
    title: "You're Building Your Foundation",
    subtitle: "Every expert was once a beginner. Let's strengthen your basics!",
    message:
      "Great effort! You have some gaps to fill in the fundamentals. Our Foundational path will walk you through everything with clear, step-by-step explanations — no rushing, just solid learning.",
    pathDesc: 'Core concept micro-lessons · Visual explanations · Step-by-step examples',
    ctaLabel: 'Start Foundational Path',
  },
  'Grade-Level': {
    emoji: '📚',
    color: '#93c5fd',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    glowColor: 'rgba(59,130,246,0.25)',
    borderColor: 'rgba(59,130,246,0.3)',
    bgColor: 'rgba(59,130,246,0.07)',
    title: "You're Right on Track!",
    subtitle: "Solid understanding — time to master the tricky parts.",
    message:
      "You've got the basics down well. Our Grade-Level path will sharpen your problem-solving, tackle CBSE-standard questions, and help you ace your exams with confidence.",
    pathDesc: 'CBSE-aligned problems · Application questions · Concept mastery',
    ctaLabel: 'Start Grade-Level Path',
  },
  Advanced: {
    emoji: '🚀',
    color: '#fcd34d',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    glowColor: 'rgba(245,158,11,0.25)',
    borderColor: 'rgba(245,158,11,0.3)',
    bgColor: 'rgba(245,158,11,0.07)',
    title: "Outstanding Performance!",
    subtitle: "You think like a mathematician. Let's go deeper!",
    message:
      "Impressive! You've demonstrated strong mathematical reasoning. Our Advanced path includes Olympiad-style problems, derivations, and real-world applications that go beyond the standard syllabus.",
    pathDesc: 'Olympiad problems · Concept derivations · Advanced applications',
    ctaLabel: 'Start Advanced Path',
  },
}

// ── Concept bar component ──────────────────────────────────────────────────────
function ConceptBar({ concept, data, index, levelColor }) {
  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  const isWeak = pct < 50
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.08 }}
      className="mb-4"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isWeak && <AlertTriangle size={13} className="text-amber-400" />}
          <span className="text-sm font-medium text-slate-300">{concept}</span>
          {isWeak && (
            <span className="text-xs px-1.5 py-0.5 rounded text-amber-400"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              Needs work
            </span>
          )}
        </div>
        <span className="text-sm font-bold" style={{ color: isWeak ? '#f59e0b' : '#6ee7b7' }}>
          {data.correct}/{data.total}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.7 + index * 0.1, ease: 'easeOut' }}
          style={{
            background: isWeak
              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
              : `linear-gradient(90deg, #10b981, ${levelColor})`,
          }}
        />
      </div>
      <p className="text-xs text-slate-600 mt-1">{pct}% correct</p>
    </motion.div>
  )
}

export default function ResultPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { student } = useStudent()

  const level          = state?.level          || student?.level          || 'Grade-Level'
  const mastery        = state?.mastery_score  || student?.mastery_score  || 60
  const results        = state?.results        || []
  const conceptScores  = state?.concept_scores || {}
  const weakConcepts   = state?.weak_concepts  || []
  const breakdown      = state?.breakdown      || {}
  const cfg            = LEVEL_CONFIG[level] || LEVEL_CONFIG['Grade-Level']

  const totalCorrect  = results.filter(r => r.is_correct).length
  const totalAnswered = results.length

  // Confetti for advanced ────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[Result] Level:', level, '| Score:', mastery, '| Weak:', weakConcepts)
    if (level === 'Advanced') {
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#fcd34d', '#f59e0b', '#ef4444'] })
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { x: 0.1, y: 0.6 } }), 400)
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { x: 0.9, y: 0.6 } }), 700)
      }, 400)
    }
  }, [])

  return (
    <div className="min-h-screen bg-grid py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-7 text-center mb-5"
          style={{
            background: cfg.bgColor,
            border: `1px solid ${cfg.borderColor}`,
            boxShadow: `0 0 60px ${cfg.glowColor}`,
          }}
        >
          {/* Emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            className="text-6xl mb-4 inline-block animate-float"
          >
            {cfg.emoji}
          </motion.div>

          {/* Level badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-3"
            style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, color: cfg.color }}
          >
            <Trophy size={14} />
            {level} Level
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-black mb-2"
            style={{ color: cfg.color }}
          >
            {cfg.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed"
          >
            {cfg.message}
          </motion.p>

          {/* Score row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex justify-center gap-8 pt-5"
            style={{ borderTop: `1px solid ${cfg.borderColor}` }}
          >
            {[
              { label: 'Correct', value: `${totalCorrect}/${totalAnswered}`, icon: CheckCircle },
              { label: 'Mastery', value: `${mastery}%`, icon: TrendingUp },
              { label: 'Weak Areas', value: weakConcepts.length, icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black" style={{ color: cfg.color }}>{value}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 justify-center">
                  <Icon size={11} /> {label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Difficulty Breakdown ─────────────────────────────────────────── */}
        {Object.keys(breakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl p-5 mb-5"
            style={{ background: 'rgba(14,20,36,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
              <Star size={16} className="text-yellow-400" />
              Performance by Difficulty
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'easy',   label: 'Easy',   color: '#6ee7b7', icon: '🌱' },
                { key: 'medium', label: 'Medium', color: '#93c5fd', icon: '📚' },
                { key: 'hard',   label: 'Hard',   color: '#fcd34d', icon: '🚀' },
              ].map(({ key, label, color, icon }) => {
                const raw = breakdown[key] || '0/0'
                const [c, t] = raw.split('/').map(Number)
                const pct = t > 0 ? Math.round((c / t) * 100) : 0
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + ['easy','medium','hard'].indexOf(key) * 0.08 }}
                    className="rounded-xl p-3 text-center"
                    style={{ background: `${color}10`, border: `1px solid ${color}25` }}
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <p className="text-lg font-black" style={{ color }}>{c}/{t}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                    <div className="progress-bar mt-2">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.7 }}
                        style={{ background: color }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Concept-wise breakdown ───────────────────────────────────────── */}
        {Object.keys(conceptScores).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-5 mb-5"
            style={{ background: 'rgba(14,20,36,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
              <Brain size={16} className="text-purple-400" />
              Concept Breakdown
            </h3>
            {Object.entries(conceptScores).map(([concept, data], i) => (
              <ConceptBar key={concept} concept={concept} data={data} index={i} levelColor={cfg.color} />
            ))}

            {weakConcepts.length > 0 && (
              <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400">
                  <span className="text-amber-400 font-semibold">Weak areas detected: </span>
                  {weakConcepts.join(', ')} — your personalised lesson will address these first.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Your Path Card ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-2xl p-5 mb-5"
          style={{ background: cfg.bgColor, border: `1px solid ${cfg.borderColor}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} style={{ color: cfg.color }} />
            <h3 className="font-bold text-sm">Your Personalised Learning Path</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">{cfg.pathDesc}</p>
          <p className="text-xs text-slate-500 italic">{cfg.subtitle}</p>
        </motion.div>

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => navigate('/lesson')}
            className="btn-primary w-full justify-center text-base py-4"
            style={{ background: cfg.gradient }}
          >
            <Zap size={18} />
            {cfg.ctaLabel}
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary w-full justify-center text-sm py-3"
          >
            <TrendingUp size={15} /> View Full Dashboard
          </button>
        </motion.div>

      </div>
    </div>
  )
}
