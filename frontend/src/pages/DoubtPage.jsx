import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Send, Image as ImageIcon, Camera, X, Loader, Bot, User, Sparkles } from 'lucide-react'
import { useStudent } from '../context/StudentContext'
import { doubtApi } from '../services/api'
import toast from 'react-hot-toast'

export default function DoubtPage() {
  const { student } = useStudent()
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${student?.name || ''}! I'm your AI tutor. Ask me any math question, upload a photo of a problem, or ask for a hint.`
    }
  ])
  const [input, setInput] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('socratic') // 'socratic' or 'direct'
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB.')
      return
    }

    setImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() && !image) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || 'Uploaded an image',
      image: imagePreview
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    
    // Clear image immediately from input area
    const currentImage = image
    clearImage()

    try {
      const res = await doubtApi.askDoubt(
        student.id,
        userMsg.content,
        currentImage,
        null,
        mode
      )

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer
      }])

    } catch (err) {
      console.error('[Doubt] API Error:', err)
      toast.error('Failed to get answer. Please try again.')
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting right now. Please check your network and try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[var(--color-bg-primary)] flex flex-col items-center">
      <div className="w-full max-w-4xl h-full flex flex-col">
        
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-6 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
              <Sparkles size={28} className="text-[var(--color-accent-primary)]" aria-hidden="true" />
              AI Doubt Resolver
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">
              Ask questions or take a photo of your math problem.
            </p>
          </div>

          <div className="flex items-center bg-[var(--color-bg-secondary)] p-1.5 rounded-xl border border-[var(--color-border)]" role="radiogroup" aria-label="Tutor Mode">
            <button
              role="radio"
              aria-checked={mode === 'socratic'}
              onClick={() => setMode('socratic')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'socratic' 
                  ? 'bg-white text-[var(--color-accent-primary)] shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Guide Me (Hint)
            </button>
            <button
              role="radio"
              aria-checked={mode === 'direct'}
              onClick={() => setMode('direct')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'direct' 
                  ? 'bg-white text-[var(--color-accent-primary)] shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Direct Answer
            </button>
          </div>
        </div>

        {/* ── Chat Messages ───────────────────────────────────────────────── */}
        <div 
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8"
          role="log"
          aria-live="polite"
          aria-label="Chat history"
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                msg.role === 'user' 
                  ? 'bg-[var(--color-warning-light)] text-[var(--color-accent-primary)] border-[rgba(217,119,6,0.2)]'
                  : 'bg-[var(--color-info-light)] text-[var(--color-info)] border-[rgba(37,99,235,0.2)]'
              }`}>
                {msg.role === 'user' ? <User size={20} aria-label="User" /> : <Bot size={20} aria-label="AI Tutor" />}
              </div>

              {/* Message Bubble */}
              <div className={`p-5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[var(--color-accent-primary)] text-white shadow-md rounded-tr-sm'
                  : 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm rounded-tl-sm'
              }`}>
                {msg.image && (
                  <img src={msg.image} alt="Uploaded math problem" className="max-w-full rounded-xl mb-3 border border-[rgba(0,0,0,0.1)]" />
                )}
                {msg.role === 'user' ? (
                  <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                ) : (
                  <article className="lesson-content prose prose-sm max-w-none text-[15px] leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </article>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-info-light)] text-[var(--color-info)] border border-[rgba(37,99,235,0.2)] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot size={20} aria-hidden="true" />
              </div>
              <div className="p-5 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm rounded-tl-sm flex items-center gap-2">
                <Loader size={18} className="animate-spin text-[var(--color-accent-primary)]" aria-label="Typing" />
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Tutor is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ──────────────────────────────────────────────────── */}
        <div className="p-6 bg-white border-t border-[var(--color-border)]">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-24 rounded-lg border border-[var(--color-border)] shadow-sm" />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-7 h-7 bg-[var(--color-error)] text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-error)]"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
              aria-label="Upload an image"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors border border-[var(--color-border)] flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
              aria-label="Upload photo"
              title="Upload photo"
            >
              <Camera size={24} />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask a question (e.g. How do I solve for x in 2x + 5 = 15?)"
                className="input-field w-full py-4 pl-4 pr-14 resize-none h-[56px] min-h-[56px] max-h-[120px] overflow-y-auto leading-relaxed shadow-inner"
                rows="1"
                aria-label="Type your doubt"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!input.trim() && !image)}
              className="p-4 rounded-xl bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent-primary)]"
              aria-label="Send message"
            >
              <Send size={24} className={input.trim() || image ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
            </button>
          </form>
          <p className="text-xs text-[var(--color-text-muted)] text-center mt-3 font-medium">
            AI can make mistakes. Consider verifying important information.
          </p>
        </div>

      </div>
    </div>
  )
}
