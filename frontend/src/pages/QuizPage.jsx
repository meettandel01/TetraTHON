import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, ChevronRight, Clock,
  Brain, Loader, Zap, ArrowRight, Target,
} from 'lucide-react'
import { quizApi } from '../services/api'
import { useStudent } from '../context/StudentContext'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_QUESTIONS = 5
const TIME_PER_QUESTION = 90 // seconds

const DIFFICULTY_STYLES = {
  easy:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#6ee7b7', label: 'Foundational' },
  medium: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd', label: 'Grade-Level' },
  hard:   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', label: 'Advanced' },
}

const OPTION_KEYS = ['A', 'B', 'C', 'D']

// ── Option button state styles ─────────────────────────────────────────────────
function getOptionStyle(key, selected, correct, revealed) {
  if (!revealed) {
    return selected === key
      ? { bg: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.6)', text: '#fff' }
      : { bg: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', text: '#cbd5e1' }
  }
  if (key === correct)
    return { bg: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.6)', text: '#6ee7b7' }
  if (key === selected && key !== correct)
    return { bg: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.6)', text: '#fca5a5' }
  return { bg: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', text: '#64748b' }
}

export default function QuizPage() {
  const [questions, setQuestions]     = useState([])
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [selected, setSelected]       = useState(null)
  const [revealed, setRevealed]       = useState(false)
  const [feedback, setFeedback]       = useState(null)   // { is_correct, explanation, correct_option }
  const [answers, setAnswers]         = useState([])     // accumulated answers for submission
  const [timeLeft, setTimeLeft]       = useState(TIME_PER_QUESTION)
  const [submitting, setSubmitting]   = useState(false)
  const [loadingQ, setLoadingQ]       = useState(true)
  const [checkingAns, setCheckingAns] = useState(false)
  const timerRef = useRef(null)
  const { student, setStudent } = useStudent()
  const navigate = useNavigate()

  // ── Load questions on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!student) { navigate('/'); return }
    fetchQuestions()
  }, [])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadingQ || submitting || revealed) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleTimeOut()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentIdx, loadingQ, submitting, revealed])

  const resetTimer = () => {
    clearInterval(timerRef.current)
    setTimeLeft(TIME_PER_QUESTION)
  }

  // ── Fetch initial questions ────────────────────────────────────────────────
  const fetchQuestions = async () => {
    try {
      const res = await quizApi.getQuestions()
      setQuestions(res.data)
      console.log('[Quiz] Loaded', res.data.length, 'questions')
    } catch (err) {
      toast.error('Failed to load quiz. Is the backend running?')
      console.error('[Quiz] Load error:', err)
    } finally {
      setLoadingQ(false)
    }
  }

  // ── Select an option ──────────────────────────────────────────────────────
  const handleSelect = (key) => {
    if (revealed || checkingAns) return
    setSelected(key)
  }

  // ── Confirm answer → instant backend check ────────────────────────────────
  const handleConfirm = async () => {
    if (!selected || revealed || checkingAns) return
    clearInterval(timerRef.current)
    setCheckingAns(true)

    const currentQ = questions[currentIdx]
    try {
      const res = await quizApi.checkAnswer(currentQ.id, selected)
      const fb = res.data
      setFeedback(fb)
      setRevealed(true)

      // Accumulate this answer
      setAnswers(prev => [...prev, {
        question_id: currentQ.id,
        selected_option: selected,
        is_correct: fb.is_correct,
        difficulty: fb.difficulty,
      }])

      console.log(`[Quiz] Q${currentIdx + 1}: ${fb.is_correct ? '✅ Correct' : '❌ Wrong'} — ${currentQ.concept}`)
    } catch (err) {
      // Graceful offline fallback: match locally
      const localCorrect = currentQ.correctAnswer || null
      setFeedback({ is_correct: false, explanation: 'Could not verify — check connection', correct_option: '?' })
      setRevealed(true)
      console.error('[Quiz] Check answer error:', err)
    } finally {
      setCheckingAns(false)
    }
  }

  // ── Auto-submit on timer expiry ────────────────────────────────────────────
  const handleTimeOut = () => {
    const currentQ = questions[currentIdx]
    setFeedback({ is_correct: false, explanation: "Time's up! ⏰ The correct answer is shown below.", correct_option: null })
    setRevealed(true)
    setAnswers(prev => [...prev, {
      question_id: currentQ.id,
      selected_option: 'X',
      is_correct: false,
      difficulty: currentQ.difficulty,
    }])
    toast.error("Time's up!", { icon: '⏰' })
    console.log(`[Quiz] Q${currentIdx + 1}: Timed out`)
  }

  // ── Advance to next question or submit ────────────────────────────────────
  const handleNext = async () => {
    if (currentIdx + 1 >= TOTAL_QUESTIONS) {
      await submitQuiz()
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setRevealed(false)
      setFeedback(null)
      resetTimer()
    }
  }

  // ── Final submission ───────────────────────────────────────────────────────
  const submitQuiz = async () => {
    setSubmitting(true)
    try {
      const res = await quizApi.submit(student.id, answers)
      const { level, mastery_score, results, concept_scores, weak_concepts, breakdown } = res.data
      setStudent({ ...student, level, mastery_score })
      console.log(`[Quiz] 🎯 Classified: ${level} | Score: ${mastery_score}%`)
      navigate('/result', { state: { level, mastery_score, results, concept_scores, weak_concepts, breakdown } })
    } catch (err) {
      toast.error('Submission failed: ' + err.message)
      console.error('[Quiz] Submit error:', err)
      setSubmitting(false)
    }
  }

  // ── Loading & submitting states ────────────────────────────────────────────
  if (loadingQ) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
          <Loader size={28} className="text-white animate-spin" />
        </div>
        <p className="text-slate-400 font-medium">Preparing your diagnostic quiz...</p>
      </motion.div>
    </div>
  )

  if (submitting) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center px-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
          <Brain size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-black mb-2">Analysing your answers...</h2>
        <p className="text-slate-400">Our AI is determining your learning level</p>
        <div className="flex gap-1 justify-center mt-6">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-400"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </motion.div>
    </div>
  )

  const currentQ    = questions[currentIdx]
  const progress    = ((currentIdx) / TOTAL_QUESTIONS) * 100
  const timerPct    = (timeLeft / TIME_PER_QUESTION) * 100
  const isUrgent    = timeLeft <= 20
  const diffStyle   = DIFFICULTY_STYLES[currentQ?.difficulty || 'medium']
  const correctCount = answers.filter(a => a.is_correct).length

  return (
    <div className="min-h-screen bg-grid py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          {/* Question counter + timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain size={17} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Diagnostic Quiz</p>
                <p className="text-xs text-slate-500">
                  Hey {student?.name}! · Q{currentIdx + 1} of {TOTAL_QUESTIONS}
                </p>
              </div>
            </div>

            {/* Score streak */}
            <div className="flex items-center gap-3">
              <div className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Zap size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{correctCount} correct</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s',
                }}>
                <Clock size={13} className={isUrgent ? 'text-red-400' : 'text-slate-400'} />
                <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-slate-300'}`}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="progress-bar mb-1.5">
            <motion.div className="progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              className="h-full rounded-full transition-all duration-1000"
              style={{ background: isUrgent ? '#ef4444' : '#06b6d4', width: `${timerPct}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-3 justify-center">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIdx ? 24 : 8,
                  height: 8,
                  background: i < currentIdx
                    ? (answers[i]?.is_correct ? '#10b981' : '#ef4444')
                    : i === currentIdx ? '#3b82f6' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Question Card ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="rounded-2xl p-6 mb-4"
              style={{ background: 'rgba(14,20,36,0.9)', border: '1px solid rgba(59,130,246,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

              {/* Concept + difficulty badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: diffStyle.bg, border: `1px solid ${diffStyle.border}`, color: diffStyle.text }}>
                    {diffStyle.label}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Target size={11} />
                    {currentQ?.concept}
                  </span>
                </div>
                <span className="text-xs text-slate-600 font-medium">Q{currentIdx + 1}/{TOTAL_QUESTIONS}</span>
              </div>

              {/* Question text */}
              <h2 className="text-xl font-bold mb-6 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                {currentQ?.text}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {OPTION_KEYS.map((key) => {
                  const val = currentQ?.options?.[key]
                  if (!val) return null
                  const s = getOptionStyle(key, selected, feedback?.correct_option, revealed)
                  return (
                    <motion.button
                      key={key}
                      whileHover={!revealed ? { scale: 1.01 } : {}}
                      whileTap={!revealed ? { scale: 0.99 } : {}}
                      onClick={() => handleSelect(key)}
                      disabled={revealed || checkingAns}
                      className="w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200"
                      style={{ background: s.bg, border: s.border, cursor: revealed ? 'default' : 'pointer' }}
                    >
                      {/* Key badge */}
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all"
                        style={{
                          background: revealed
                            ? key === feedback?.correct_option ? '#10b981'
                              : key === selected && key !== feedback?.correct_option ? '#ef4444'
                              : 'rgba(255,255,255,0.07)'
                            : selected === key ? '#3b82f6' : 'rgba(255,255,255,0.07)',
                          color: (revealed || selected === key) ? 'white' : '#94a3b8',
                        }}>
                        {key}
                      </span>

                      {/* Option text */}
                      <span className="text-sm flex-1" style={{ color: s.text }}>{val}</span>

                      {/* Reveal icons */}
                      {revealed && key === feedback?.correct_option && (
                        <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                      )}
                      {revealed && key === selected && key !== feedback?.correct_option && (
                        <XCircle size={18} className="text-red-400 flex-shrink-0" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* ── Feedback Banner ──────────────────────────────────────────── */}
            <AnimatePresence>
              {revealed && feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl p-4 mb-4"
                  style={{
                    background: feedback.is_correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${feedback.is_correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {feedback.is_correct
                      ? <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: feedback.is_correct ? '#6ee7b7' : '#fca5a5' }}>
                        {feedback.is_correct ? '🎉 Correct!' : '❌ Not quite.'}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">{feedback.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Action Buttons ───────────────────────────────────────────── */}
            {!revealed ? (
              <motion.button
                whileHover={{ scale: selected ? 1.02 : 1 }}
                whileTap={{ scale: selected ? 0.98 : 1 }}
                onClick={handleConfirm}
                disabled={!selected || checkingAns}
                className="btn-primary w-full justify-center text-base py-4"
                style={{ opacity: selected && !checkingAns ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed' }}
              >
                {checkingAns ? (
                  <><Loader size={17} className="animate-spin" /> Checking...</>
                ) : (
                  <>Confirm Answer <ChevronRight size={17} /></>
                )}
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="btn-primary w-full justify-center text-base py-4"
              >
                {currentIdx + 1 < TOTAL_QUESTIONS ? (
                  <>Next Question <ChevronRight size={17} /></>
                ) : (
                  <>See My Results <ArrowRight size={17} /></>
                )}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
