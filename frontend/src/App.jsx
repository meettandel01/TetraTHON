import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';

// Pages
import LoginPage from './pages/LoginPage';
// Student Pages
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import SessionSetupPage from './pages/SessionSetupPage';
import QuizPage from './pages/QuizPage'; // DiagnosticPage
import DiagnosticResultPage from './pages/DiagnosticResultPage';
import LearningPathPage from './pages/LearningPathPage';
import LessonPage from './pages/LessonPage';
import PracticePage from './pages/PracticePage';
import DoubtPage from './pages/DoubtPage';
import ResultPage from './pages/ResultPage'; // SessionSummary
import ProgressPage from './pages/ProgressPage';
import ReportCardPage from './pages/ReportCardPage';
// Teacher Pages
import TeacherDashboard from './pages/TeacherDashboard';
import HeatmapPage from './pages/HeatmapPage';
import ItemAnalysisPage from './pages/ItemAnalysisPage';
import EscalationQueuePage from './pages/EscalationQueuePage';
import RosterPage from './pages/RosterPage';
import ParentOverview from './pages/ParentOverview';
import ParentDigestPage from './pages/ParentDigestPage';
import ParentAlertsPage from './pages/ParentAlertsPage';
import ParentSettingsPage from './pages/ParentSettingsPage';
import AdminConsole from './pages/AdminConsole';
import AdminImportPage from './pages/AdminImportPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminCompliancePage from './pages/AdminCompliancePage';

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
          <Route path="/report-card/:studentId" element={<ReportCardPage />} />
          
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            {/* Redirect root based on role */}
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            
            <Route path="profile" element={<ProfilePage />} />

            {/* Student Routes */}
            <Route path="student">
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="setup" element={<SessionSetupPage />} />
              <Route path="diagnostic" element={<QuizPage />} />
              <Route path="diagnostic-result" element={<DiagnosticResultPage />} />
              <Route path="learning-path" element={<LearningPathPage />} />
              <Route path="lesson" element={<LessonPage />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="doubt" element={<DoubtPage />} />
              <Route path="summary" element={<ResultPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="report-card" element={<ReportCardPage />} />
            </Route>
            
            {/* Teacher Routes */}
            <Route path="teacher">
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="heatmap" element={<HeatmapPage />} />
              <Route path="item-analysis" element={<ItemAnalysisPage />} />
              <Route path="escalations" element={<EscalationQueuePage />} />
              <Route path="roster" element={<RosterPage />} />
            </Route>

            {/* Parent Routes */}
            <Route path="parent">
              <Route index element={<ParentOverview />} />
              <Route path="dashboard" element={<ParentOverview />} />
              <Route path="overview" element={<ParentOverview />} />
              <Route path="digest" element={<ParentDigestPage />} />
              <Route path="alerts" element={<ParentAlertsPage />} />
              <Route path="settings" element={<ParentSettingsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="admin">
              <Route path="dashboard" element={<AdminConsole />} />
              <Route path="import" element={<AdminImportPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="compliance" element={<AdminCompliancePage />} />
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
