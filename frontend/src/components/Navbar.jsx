import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Brain, BookOpen, BarChart2, Lightbulb, LogOut, Zap, Menu, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    clearStudent()
    navigate('/')
  }

  if (!student) return null

  const levelColors = {
    Foundational: 'var(--color-success)',
    'Grade-Level': 'var(--color-info)',
    Advanced: 'var(--color-warning)',
  }
  const levelColor = levelColors[student.level] || 'var(--color-text-muted)'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)] shadow-sm">
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center shadow-sm">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[var(--color-text-primary)]">TetraTHON</span>
        </NavLink>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-2 m-0 p-0 list-none">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--color-accent-primary)] bg-[var(--color-warning-light)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                  }`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Student info + logout (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            className="flex items-center gap-2 rounded-md p-1 hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-warning-light)] text-[var(--color-accent-primary)] border border-[var(--color-warning)] flex items-center justify-center text-sm font-bold">
              {student.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">{student.name}</p>
              {student.level && (
                <p className="text-xs font-medium leading-tight mt-0.5" style={{ color: levelColor }}>{student.level}</p>
              )}
            </div>
          </button>
          
          <div className="w-px h-6 bg-[var(--color-border)]"></div>
          
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] text-[var(--color-text-muted)]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-md text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[var(--color-border)] bg-white overflow-hidden"
          >
            <ul className="flex flex-col p-4 gap-2 m-0 list-none">
              {navItems.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? 'text-[var(--color-accent-primary)] bg-[var(--color-warning-light)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                      }`
                    }
                    aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            
            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-warning-light)] text-[var(--color-accent-primary)] border border-[var(--color-warning)] flex items-center justify-center text-sm font-bold">
                  {student.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{student.name}</p>
                  {student.level && (
                    <p className="text-xs font-medium mt-0.5" style={{ color: levelColor }}>{student.level}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] text-[var(--color-text-muted)]"
                aria-label="Sign out"
              >
                <LogOut size={20} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
