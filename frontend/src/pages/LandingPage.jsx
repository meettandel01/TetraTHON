import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Zap, ArrowRight, Sparkles, Target, TrendingUp, CheckCircle } from 'lucide-react'
import { studentApi } from '../services/api'
import { useStudent } from '../context/StudentContext'
import toast from 'react-hot-toast'

const features = [
  {
    icon: Target,
    title: 'Smart Diagnosis',
    desc: '5-question adaptive quiz that pinpoints your exact learning level instantly',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'AI Doubt Resolver',
    desc: 'Ask doubts via text or photo — get Socratic or direct AI explanations',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Personalized Lessons',
    desc: '10-minute micro-lessons crafted for your specific learning level',
    gradient: 'from-emerald-500 to-teal-500',
  },
]

const levelInfo = [
  { label: 'Foundational', color: '#6ee7b7', emoji: '🌱' },
  { label: 'Grade-Level', color: '#93c5fd', emoji: '📚' },
  { label: 'Advanced', color: '#fcd34d', emoji: '🚀' },
]

const bullets = [
  'Personalized 10-min micro-lessons',
  'AI doubts via text or photo',
  'Offline-capable (low bandwidth)',
  'Visual concept knowledge graph',
]

export default function LandingPage() {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('9')
  const [loading, setLoading] = useState(false)
  const { setStudent } = useStudent()
  const navigate = useNavigate()

  const handleStart = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter your name!')
      return
    }
    setLoading(true)
    try {
      const res = await studentApi.create(name.trim(), grade)
      setStudent(res.data)
      toast.success(`Welcome, ${res.data.name}! 🎉`)
      navigate('/quiz')
    } catch (err) {
      console.error('[Landing] Failed to create student:', err)
      toast.error('Could not connect to server. Make sure the backend is running!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden flex flex-col">

      {/* ── Background Orbs ─────────────────────────────────── */}
      <div className="absolute top-[-180px] left-[-180px] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-[-180px] right-[-180px] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

      {/* ── Main centered layout ─────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">

          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Sparkles size={15} className="text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">AI-Powered Adaptive Learning for Indian Classrooms</span>
            </div>
          </motion.div>

          {/* ── Two-column Hero ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* LEFT — Info panel */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
                <span className="gradient-text-blue">TetraTHON</span>
                <br />
                <span className="text-white text-3xl md:text-4xl font-bold leading-snug">
                  Adaptive Learning<br />Engine
                </span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
                Personalized Math education for Class 8–10 students.
                Get diagnosed, learn at your pace, and resolve doubts instantly with AI.
              </p>

              {/* Bullets */}
              <ul className="space-y-3 mb-8">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Feature mini-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="glass rounded-xl p-3 glass-hover group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <f.icon size={15} className="text-white" />
                    </div>
                    <p className="text-xs font-bold mb-0.5">{f.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — Login / Register panel (CENTERED) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <div
                className="w-full max-w-md rounded-2xl p-8"
                style={{
                  background: 'rgba(14, 20, 36, 0.95)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  boxShadow: '0 0 60px rgba(59,130,246,0.1), 0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Start Your Journey</h2>
                    <p className="text-slate-400 text-xs">Takes just 2 minutes to set up</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleStart} className="space-y-5">
                  <div>
                    <label className="text-sm text-slate-400 font-medium mb-1.5 block">Your Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Arjun Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 font-medium mb-1.5 block">Your Class</label>
                    <select
                      className="input-field"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      style={{ appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center text-base py-3.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Setting up your profile...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Take Diagnostic Quiz
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-xs text-slate-600">You'll be placed in one of</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {/* Level badges */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {levelInfo.map((l) => (
                    <motion.span
                      key={l.label}
                      whileHover={{ scale: 1.05 }}
                      className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-default"
                      style={{
                        background: `${l.color}15`,
                        border: `1px solid ${l.color}35`,
                        color: l.color,
                      }}
                    >
                      {l.emoji} {l.label}
                    </motion.span>
                  ))}
                </div>

                {/* Trust note */}
                <p className="text-center text-xs text-slate-600 mt-4">
                  No account needed · Free to use · Works offline
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
