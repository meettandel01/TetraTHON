import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ImagePlus, X, Loader, Brain, Lightbulb, BookOpen, ChevronDown } from 'lucide-react'
import { doubtsApi } from '../services/api'
import { useStudent } from '../context/StudentContext'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'

const modeConfig = {
  direct: {
    label: 'Direct Answer',
    icon: BookOpen,
    description: 'Get a full step-by-step solution',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.4)',
  },
  socratic: {
    label: 'Socratic Mode',
    icon: Brain,
    description: 'Get guided hints to find the answer yourself',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.4)',
  },
}

export default function DoubtPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('direct')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showModeInfo, setShowModeInfo] = useState(false)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)
  const { student } = useStudent()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message on mount
  useEffect(() => {
    setMessages([{
      role: 'system',
      content: `👋 Hi ${student?.name || 'there'}! I'm your AI Math Tutor.\n\nYou can:\n- **Type** any Math question\n- **Upload a photo** of your notebook\n\nChoose **Direct Mode** for step-by-step solutions or **Socratic Mode** to learn by guided hints!`,
    }])
  }, [])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    console.log('[Doubt] Image selected:', file.name, file.size)
  }

  const handleSend = async () => {
    if ((!input.trim() && !image) || loading) return

    const userMsg = {
      role: 'user',
      content: input || 'Please solve the math problem in the image.',
      image: imagePreview,
    }

    setMessages((m) => [...m, userMsg])
    const sentInput = input
    const sentImage = image
    setInput('')
    setImage(null)
    setImagePreview(null)
    setLoading(true)

    try {
      console.log(`[Doubt] Sending to API — mode: ${mode}, has_image: ${!!sentImage}`)
      const res = await doubtsApi.ask(student?.id || 1, sentInput, mode, sentImage)
      const aiMsg = { role: 'ai', content: res.data.response, mode }
      setMessages((m) => [...m, aiMsg])
      console.log('[Doubt] AI response received')
    } catch (err) {
      toast.error('Failed to get response: ' + err.message)
      setMessages((m) => [...m, {
        role: 'ai',
        content: '⚠️ Could not connect to the AI server. Please check if the backend is running.',
        mode,
      }])
    } finally {
      setLoading(false)
    }
  }

  const mc = modeConfig[mode]

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between"
        style={{ background: 'rgba(10,14,26,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Lightbulb size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold">AI Doubt Resolver</h1>
            <p className="text-xs text-slate-500">Type or upload a photo of your problem</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowModeInfo(!showModeInfo)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color }}
          >
            <mc.icon size={15} />
            {mc.label}
            <ChevronDown size={13} style={{ transform: showModeInfo ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {showModeInfo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-12 z-30 w-64 rounded-xl overflow-hidden"
                style={{ background: 'rgba(15,22,41,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              >
                {Object.entries(modeConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => { setMode(key); setShowModeInfo(false) }}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 transition-all hover:bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <cfg.icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: mode === key ? cfg.color : 'white' }}>{cfg.label}</p>
                      <p className="text-xs text-slate-400">{cfg.description}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                  {msg.role === 'system' ? <Lightbulb size={14} className="text-white" /> : <Brain size={14} className="text-white" />}
                </div>
              )}

              <div className="max-w-[80%]">
                {msg.role === 'user' && msg.image && (
                  <div className="mb-2 flex justify-end">
                    <img src={msg.image} alt="uploaded" className="max-w-[200px] rounded-xl border border-white/10" />
                  </div>
                )}
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      : msg.role === 'system'
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(20,28,46,1)',
                    border: msg.role !== 'user' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: msg.role === 'user' ? 'white' : '#e2e8f0',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}
                >
                  {msg.role === 'ai' && msg.mode && (
                    <div className="flex items-center gap-1.5 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {React.createElement(modeConfig[msg.mode].icon, { size: 12, style: { color: modeConfig[msg.mode].color } })}
                      <span className="text-xs font-medium" style={{ color: modeConfig[msg.mode].color }}>
                        {modeConfig[msg.mode].label}
                      </span>
                    </div>
                  )}
                  <div className="lesson-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Brain size={14} className="text-white animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: 'rgba(20,28,46,1)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-blue-400"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-4" style={{ background: 'rgba(10,14,26,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Image preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3">
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 rounded-xl object-cover border border-white/10" />
                <button
                  onClick={() => { setImage(null); setImagePreview(null) }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="Upload photo of your question"
          >
            <ImagePlus size={18} className="text-slate-400" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type your Math doubt here... (or upload a photo)"
            rows={1}
            className="input-field flex-1 resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={loading || (!input.trim() && !image)}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: (input.trim() || image) && !loading ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {loading ? <Loader size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </motion.button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
