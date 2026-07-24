import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { StudentProvider, useStudent } from './context/StudentContext'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import LessonPage from './pages/LessonPage'
import DoubtPage from './pages/DoubtPage'
import DashboardPage from './pages/DashboardPage'

// Guard: redirect to landing if no student
const ProtectedRoute = ({ children }) => {
  const { student } = useStudent()
  if (!student) return <Navigate to="/" replace />
  return children
}

function AppContent() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
        <Navbar />
        <main id="main-content" className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
            <Route path="/lesson" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
            <Route path="/doubt" element={<ProtectedRoute><DoubtPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card-hover)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '0.875rem',
            fontWeight: '600',
          },
          success: { iconTheme: { primary: '#0D9488', secondary: 'white' } },
          error: { iconTheme: { primary: '#DC2626', secondary: 'white' } },
        }}
      />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <StudentProvider>
      <AppContent />
    </StudentProvider>
  )
}
