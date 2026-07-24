import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';

// Pages
import LoginPage from './pages/LoginPage';
// Student Pages
import DashboardPage from './pages/DashboardPage';
import QuizPage from './pages/QuizPage'; // DiagnosticPage
import LearningPathPage from './pages/LearningPathPage';
import LessonPage from './pages/LessonPage';
import PracticePage from './pages/PracticePage';
import DoubtPage from './pages/DoubtPage';
import ResultPage from './pages/ResultPage'; // SessionSummary
// Teacher Pages
import TeacherDashboard from './pages/TeacherDashboard';
import ParentOverview from './pages/ParentOverview';
import AdminConsole from './pages/AdminConsole';

// Basic protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            {/* Redirect root based on role */}
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            
            {/* Student Routes */}
            <Route path="student">
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="diagnostic" element={<QuizPage />} />
              <Route path="learning-path" element={<LearningPathPage />} />
              <Route path="lesson" element={<LessonPage />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="doubt" element={<DoubtPage />} />
              <Route path="summary" element={<ResultPage />} />
            </Route>
            
            {/* Teacher Routes */}
            <Route path="teacher">
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="heatmap" element={<div className="p-8">Mastery Heatmap (WIP)</div>} />
              <Route path="item-analysis" element={<div className="p-8">Item Analysis (WIP)</div>} />
              <Route path="escalations" element={<div className="p-8">Escalations (WIP)</div>} />
              <Route path="roster" element={<div className="p-8">Student Roster (WIP)</div>} />
            </Route>

            {/* Parent Routes */}
            <Route path="parent">
              <Route path="dashboard" element={<ParentOverview />} />
            </Route>

            {/* Admin Routes */}
            <Route path="admin">
              <Route path="content" element={<div className="p-8">Content Authoring (WIP)</div>} />
              <Route path="compliance" element={<div className="p-8">Compliance (WIP)</div>} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Custom Toast configuration matching design system */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--ink)',
              color: 'var(--card)',
              borderRadius: '999px',
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: '600',
              fontFamily: 'Manrope, sans-serif'
            },
            success: { style: { background: 'var(--forest)' } },
            error: { style: { background: 'var(--redpen)' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
