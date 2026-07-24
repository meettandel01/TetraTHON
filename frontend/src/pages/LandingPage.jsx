import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Zap, ArrowRight, Sparkles, Target, TrendingUp, CheckCircle, Sprout, Rocket } from 'lucide-react'
import { studentApi } from '../services/api'
import { useStudent } from '../context/StudentContext'
import toast from 'react-hot-toast'

const features = [
  {
    icon: Target,
    title: 'Smart Diagnosis',
    desc: 'Adaptive quiz pinpoints your exact level instantly.',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
  },
  {
    icon: Brain,
    title: 'AI Doubt Resolver',
    desc: 'Socratic or direct explanations via text or photo.',
    color: 'var(--color-info)',
    bg: 'var(--color-info-light)',
  },
  {
    icon: TrendingUp,
    title: 'Personalized Lessons',
    desc: 'Micro-lessons crafted for your specific learning level.',
    color: 'var(--color-success)',
    bg: 'var(--color-success-light)',
  },
]

const levelInfo = [
  { label: 'Foundational', color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: Sprout },
  { label: 'Grade-Level', color: 'var(--color-info)', bg: 'var(--color-info-light)', icon: BookOpen },
  { label: 'Advanced', color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: Rocket },
]

const bullets = [
  'Personalized 10-min micro-lessons',
  'AI doubts via text or photo',
  'Offline-capable (low bandwidth)',
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
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-[var(--color-bg-primary)]">
      {/* ── Subtle Background Elements ─────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-warning-light)] opacity-40 blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[var(--color-info-light)] opacity-30 blur-[120px]" />
      </div>

      {/* ── Main centered layout ─────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative z-10 flex-1 flex items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-7xl mx-auto">

          {/* ── Two-column Hero ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

            {/* LEFT — Info panel (7 columns) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7 flex flex-col justify-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-[var(--color-warning-light)] border border-[rgba(217,119,6,0.2)] w-max">
                <Sparkles size={16} className="text-[var(--color-accent-primary)]" aria-hidden="true" />
                <span className="text-[var(--color-accent-primary)] text-sm font-bold uppercase tracking-wider">AI-Powered Learning</span>
              </div>

              <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                <span className="text-[var(--color-text-primary)]">TetraTHON</span>
                <br />
                <span className="text-[var(--color-text-secondary)]">
                  Adaptive Learning Engine
                </span>
              </h1>

              <p className="text-[var(--color-text-secondary)] text-lg md:text-xl leading-relaxed mb-10 max-w-xl font-medium">
                Personalized Math education for Class 8–10 students.
                Get diagnosed, learn at your pace, and resolve doubts instantly with an intelligent AI tutor.
              </p>

              {/* Feature mini-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    className="flex flex-col items-start"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm border" style={{ background: f.bg, borderColor: `rgba(0,0,0,0.05)` }}>
                      <f.icon size={24} style={{ color: f.color }} aria-hidden="true" />
                    </div>
                    <p className="text-base font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">{f.title}</p>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-3 m-0 p-0 list-none">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-semibold">
                    <CheckCircle size={18} className="text-[var(--color-success)]" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* RIGHT — Login / Register panel (5 columns) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="card w-full max-w-[480px] p-8 md:p-10 border-t-4 border-t-[var(--color-accent-primary)] shadow-2xl">
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">Start Your Journey</h2>
                  <p className="text-[var(--color-text-secondary)] text-base font-medium">No account required. Takes just 2 minutes.</p>
                </div>

                <form onSubmit={handleStart} className="space-y-6" aria-describedby="trust-note">
                  <div>
                    <label htmlFor="student-name" className="text-sm text-[var(--color-text-primary)] font-bold mb-2 block uppercase tracking-wider">Your Name</label>
                    <input
                      id="student-name"
                      type="text"
                      className="input-field py-3.5 text-base shadow-sm"
                      placeholder="e.g. Arjun Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="student-class" className="text-sm text-[var(--color-text-primary)] font-bold mb-2 block uppercase tracking-wider">Your Class</label>
                    <select
                      id="student-class"
                      className="input-field py-3.5 text-base shadow-sm font-medium"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center text-lg py-4 shadow-lg hover:shadow-xl mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div role="status" className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Loading" />
                        <span>Setting up...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={20} aria-hidden="true" />
                        <span>Take Diagnostic Quiz</span>
                        <ArrowRight size={20} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10">
                  <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-center mb-4">
                    You'll be placed in one of three tracks
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {levelInfo.map((l) => (
                      <div
                        key={l.label}
                        className="text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm"
                        style={{
                          background: l.bg,
                          border: `1px solid ${l.color}33`,
                          color: l.color,
                        }}
                      >
                        <l.icon size={16} aria-hidden="true" />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>

                <p id="trust-note" className="text-center text-sm font-semibold text-[var(--color-text-muted)] mt-8">
                  Free to use · Works completely offline
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  )
}
