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
      <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/lesson" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/doubt" element={<ProtectedRoute><DoubtPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20, 28, 46, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
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
