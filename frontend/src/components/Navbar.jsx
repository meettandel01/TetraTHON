import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Brain, BookOpen, BarChart2, Lightbulb, LogOut, Zap } from 'lucide-react'
import { useStudent } from '../context/StudentContext'

const navItems = [
  { to: '/quiz', icon: Brain, label: 'Quiz' },
  { to: '/lesson', icon: BookOpen, label: 'Lesson' },
  { to: '/doubt', icon: Lightbulb, label: 'Doubts' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
]

export default function Navbar() {
  const { student, clearStudent } = useStudent()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearStudent()
    navigate('/')
  }

  if (!student) return null

  const levelColors = {
    Foundational: '#6ee7b7',
    'Grade-Level': '#93c5fd',
    Advanced: '#fcd34d',
  }
  const levelColor = levelColors[student.level] || '#94a3b8'

  return (
    <nav style={{ background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-black text-lg gradient-text-blue hidden sm:block">TetraTHON</span>
        </NavLink>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Student info + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
              {student.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold leading-none">{student.name}</p>
              {student.level && (
                <p className="text-xs leading-none mt-0.5" style={{ color: levelColor }}>{student.level}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            title="Switch user"
          >
            <LogOut size={15} className="text-slate-400" />
          </button>
        </div>
      </div>
    </nav>
  )
}
