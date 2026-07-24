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
  easy:   { bg: 'var(--color-success-light)', border: 'rgba(13,148,136,0.3)', text: 'var(--color-success)', label: 'Foundational' },
  medium: { bg: 'var(--color-info-light)', border: 'rgba(37,99,235,0.3)', text: 'var(--color-info)', label: 'Grade-Level' },
  hard:   { bg: 'var(--color-warning-light)', border: 'rgba(217,119,6,0.3)', text: 'var(--color-warning)', label: 'Advanced' },
}

const OPTION_KEYS = ['A', 'B', 'C', 'D']

// ── Option button state styles ─────────────────────────────────────────────────
function getOptionClass(key, selected, correct, revealed) {
  if (!revealed) {
    return selected === key ? 'option-selected' : 'option-default'
  }
  if (key === correct) return 'option-correct'
  if (key === selected && key !== correct) return 'option-wrong'
  return 'option-default'
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
    toast.error("Time's up!")
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
    <section aria-label="Loading diagnostic quiz" className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[var(--color-bg-primary)]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[var(--color-border)] flex items-center justify-center mx-auto mb-6">
          <Loader size={28} className="text-[var(--color-accent-primary)] animate-spin" aria-hidden="true" />
        </div>
        <p className="text-[var(--color-text-secondary)] font-bold uppercase tracking-wider text-sm" role="status">Preparing diagnostic quiz...</p>
      </motion.div>
    </section>
  )

  if (submitting) return (
    <section aria-label="Analyzing answers" className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[var(--color-bg-primary)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center px-6"
      >
        <div className="w-20 h-20 rounded-full bg-[var(--gradient-primary)] shadow-lg flex items-center justify-center mx-auto mb-8">
          <Brain size={36} className="text-white" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-3 tracking-tight" role="status" aria-live="polite">Analysing your answers...</h2>
        <p className="text-[var(--color-text-secondary)] font-medium text-lg">Our AI is determining your learning level</p>
        <div className="flex gap-1.5 justify-center mt-8" aria-hidden="true">
          {[0,1,2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-primary)]"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </motion.div>
    </section>
  )

  const currentQ    = questions[currentIdx]
  const progress    = ((currentIdx) / TOTAL_QUESTIONS) * 100
  const timerPct    = (timeLeft / TIME_PER_QUESTION) * 100
  const isUrgent    = timeLeft <= 20
  const diffStyle   = DIFFICULTY_STYLES[currentQ?.difficulty || 'medium']
  const correctCount = answers.filter(a => a.is_correct).length

  return (
    <section aria-label="Diagnostic Quiz" className="min-h-[calc(100vh-80px)] bg-[var(--color-bg-primary)] py-12 px-6">
      <div className="max-w-3xl mx-auto">

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          {/* Question counter + timer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[var(--color-border)] flex items-center justify-center">
                <Brain size={24} className="text-[var(--color-accent-primary)]" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-[var(--color-text-primary)] leading-tight uppercase tracking-wider">Diagnostic Quiz</h1>
                <p className="text-sm font-semibold text-[var(--color-text-secondary)] mt-1">
                  Hey {student?.name}! · Question {currentIdx + 1} of {TOTAL_QUESTIONS}
                </p>
              </div>
            </div>

            {/* Score streak */}
            <div className="flex items-center gap-4">
              <div className="text-sm px-4 py-2 rounded-full flex items-center gap-2 bg-[var(--color-success-light)] border border-[rgba(13,148,136,0.3)] shadow-sm">
                <Zap size={16} className="text-[var(--color-success)]" aria-hidden="true" />
                <span className="text-[var(--color-success)] font-bold">{correctCount} correct</span>
              </div>

              {/* Timer */}
              <div 
                role="timer" 
                aria-live={isUrgent ? "assertive" : "polite"}
                aria-label={`Time remaining: ${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-colors ${
                  isUrgent 
                    ? 'bg-[var(--color-error-light)] border-[var(--color-error)] text-[var(--color-error)]' 
                    : 'bg-white border-[var(--color-border)] text-[var(--color-text-primary)]'
                }`}
              >
                <Clock size={16} aria-hidden="true" />
                <span className="text-base font-mono font-bold">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div 
            className="progress-bar mb-2 h-2"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Quiz progress"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[var(--color-bg-secondary)]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-[var(--color-error)]' : 'bg-[var(--color-info)]'}`}
              style={{ width: `${timerPct}%` }}
              aria-hidden="true"
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-3 mt-4 justify-center" aria-label={`Question ${currentIdx + 1} of ${TOTAL_QUESTIONS}`}>
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIdx ? 32 : 10,
                  height: 10,
                  background: i < currentIdx
                    ? (answers[i]?.is_correct ? 'var(--color-success)' : 'var(--color-error)')
                    : i === currentIdx ? 'var(--color-info)' : 'var(--color-border)',
                }}
                title={`Question ${i + 1} - ${i < currentIdx ? (answers[i]?.is_correct ? 'Correct' : 'Incorrect') : (i === currentIdx ? 'Current' : 'Upcoming')}`}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Question Card ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card mb-6">
              {/* Concept + difficulty badge */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
                    style={{ background: diffStyle.bg, border: `1px solid ${diffStyle.border}`, color: diffStyle.text }}>
                    {diffStyle.label}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1.5 font-bold">
                    <Target size={16} aria-hidden="true" />
                    {currentQ?.concept}
                  </span>
                </div>
                <span className="text-sm text-[var(--color-text-muted)] font-bold">Q{currentIdx + 1}/{TOTAL_QUESTIONS}</span>
              </div>

              {/* Question text */}
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-8 leading-snug tracking-tight" style={{ fontFamily: 'Outfit' }}>
                {currentQ?.text}
              </h2>

              {/* Options */}
              <div className="space-y-4" role="radiogroup" aria-label="Answer options">
                {OPTION_KEYS.map((key) => {
                  const val = currentQ?.options?.[key]
                  if (!val) return null
                  const optionClass = getOptionClass(key, selected, feedback?.correct_option, revealed)
                  return (
                    <button
                      key={key}
                      role="radio"
                      aria-checked={selected === key}
                      onClick={() => handleSelect(key)}
                      disabled={revealed || checkingAns}
                      className={`w-full text-left px-6 py-5 rounded-2xl flex items-center gap-4 transition-all shadow-sm border-2 ${optionClass} ${revealed ? 'cursor-default' : 'hover:border-[var(--color-accent-primary)] hover:shadow-md'}`}
                    >
                      {/* Key badge */}
                      <span className="key-badge w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold transition-colors">
                        {key}
                      </span>

                      {/* Option text */}
                      <span className="text-lg flex-1 font-semibold leading-relaxed">{val}</span>

                      {/* Reveal icons */}
                      {revealed && key === feedback?.correct_option && (
                        <CheckCircle size={24} className="text-[var(--color-success)] flex-shrink-0" aria-hidden="true" />
                      )}
                      {revealed && key === selected && key !== feedback?.correct_option && (
                        <XCircle size={24} className="text-[var(--color-error)] flex-shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Feedback Banner ──────────────────────────────────────────── */}
            <div aria-live="polite">
              {revealed && feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 mb-6 shadow-sm border-2"
                  style={{
                    background: feedback.is_correct ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    borderColor: feedback.is_correct ? 'var(--color-success)' : 'var(--color-error)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {feedback.is_correct
                      ? <CheckCircle size={24} className="text-[var(--color-success)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                      : <XCircle size={24} className="text-[var(--color-error)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    }
                    <div>
                      <p className="text-base font-extrabold mb-1 tracking-tight" style={{ color: feedback.is_correct ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {feedback.is_correct ? '🎉 Correct!' : '❌ Not quite.'}
                      </p>
                      <p className="text-base font-medium text-[var(--color-text-primary)] leading-relaxed">{feedback.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Action Buttons ───────────────────────────────────────────── */}
            {!revealed ? (
              <button
                onClick={handleConfirm}
                disabled={!selected || checkingAns}
                aria-disabled={!selected || checkingAns}
                className={`btn-primary w-full justify-center text-lg py-5 shadow-lg ${(!selected || checkingAns) ? 'btn-disabled shadow-none' : 'hover:shadow-xl'}`}
              >
                {checkingAns ? (
                  <><Loader size={20} className="animate-spin" aria-hidden="true" /> <span>Checking...</span></>
                ) : (
                  <><span>Confirm Answer</span> <ChevronRight size={20} aria-hidden="true" /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary w-full justify-center text-lg py-5 shadow-lg hover:shadow-xl"
              >
                {currentIdx + 1 < TOTAL_QUESTIONS ? (
                  <><span>Next Question</span> <ChevronRight size={20} aria-hidden="true" /></>
                ) : (
                  <><span>See My Results</span> <ArrowRight size={20} aria-hidden="true" /></>
                )}
              </button>
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
    </section>
  )
}
