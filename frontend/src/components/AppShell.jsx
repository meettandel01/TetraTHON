import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import {
  Home,
  Network,
  HelpCircle,
  Trophy,
  FileText,
  Grid,
  Target,
  Flag,
  Users,
  Shield,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X
} from 'lucide-react';

const getNavItems = (role, unreadEscalations = 0) => {
  if (role === 'teacher') {
    return [
      { id: 'dashboard', path: '/teacher/dashboard', label: 'Dashboard', icon: Home },
      { id: 'heatmap', path: '/teacher/heatmap', label: 'Mastery Heatmap', icon: Grid },
      { id: 'item-analysis', path: '/teacher/item-analysis', label: 'Item Analysis', icon: Target },
      { id: 'escalations', path: '/teacher/escalations', label: 'Escalation Queue', icon: Flag, badge: unreadEscalations },
      { id: 'roster', path: '/teacher/roster', label: 'Student Roster', icon: Users },
    ];
  }
  if (role === 'admin') {
    return [
      { id: 'import', path: '/admin/import', label: 'Bulk Roster Import', icon: Users },
      { id: 'content', path: '/admin/content', label: 'Content Authoring', icon: Network },
      { id: 'compliance', path: '/admin/compliance', label: 'Trust & Compliance', icon: Shield },
    ];
  }
  if (role === 'parent') {
    return [
      { id: 'overview', path: '/parent/overview', label: 'Overview', icon: Home },
      { id: 'digest', path: '/parent/digest', label: 'Progress Digest', icon: FileText },
      { id: 'alerts', path: '/parent/alerts', label: 'Alerts', icon: Flag },
    ];
  }
  // Default to student
  return [
    { id: 'dashboard', path: '/student/dashboard', label: 'Dashboard', icon: Home },
    { id: 'learning-path', path: '/student/learning-path', label: 'Learning Path', icon: Network },
    { id: 'doubt', path: '/student/doubt', label: 'Doubt Resolution', icon: HelpCircle },
    { id: 'progress', path: '/student/progress', label: 'Progress & Badges', icon: Trophy },
    { id: 'report-card', path: '/student/report-card', label: 'Report Card', icon: FileText },
  ];
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false); // keep minimal tailwind for mobile nav overlay if needed

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const scopeLine = user.role === 'admin' 
    ? 'Multi-board, multi-subject console'
    : (user.role === 'teacher' ? `${user.subject || 'Mathematics'} Curriculum Scope` : `Grade ${user.grade || '8'} · Active Scope`);

  const getSubLabel = () => {
    if (user.role === 'student') return `Class ${user.grade || '8'} · Sec ${user.section || 'A'} · ${user.level || 'Foundational'}`;
    if (user.role === 'teacher') return `${user.subject || 'Mathematics'} Teacher`;
    if (user.role === 'admin') return 'IT & Curriculum Admin';
    if (user.role === 'parent') return 'Parent / Guardian';
    return '';
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <svg viewBox="0 0 48 48" className="brand-logo-sm brand-logo">
            <circle cx="24" cy="10" r="6"/><circle cx="10" cy="34" r="6"/><circle cx="38" cy="34" r="6"/>
            <path d="M20 14 L13 29 M28 14 L35 29 M16 34 H32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="brand-word-sm brand-word">Sahaay</span>
        </div>
        
        <div className="topbar-right">
          <div className="bell-wrap hidden sm:block" style={{ display: 'block', marginRight: '10px' }}>
            <Bell size={20} className="muted" />
          </div>

          <button className="user-chip" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="avatar" style={{'--size': '28px'}}>{user.name.substring(0, 2).toUpperCase()}</div>
            <div className="user-chip-text hidden sm:block">
              <div><strong>{user.name.split(' ')[0]}</strong></div>
              <div className="muted small">{getSubLabel()}</div>
            </div>
            <ChevronDown size={14} className="chevron" />
          </button>
          
          {menuOpen && (
            <>
              <div style={{position: 'fixed', inset: 0, zIndex: 10}} onClick={() => setMenuOpen(false)}></div>
              <div className="user-menu">
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                  Profile Settings
                </button>
                <button style={{color: 'var(--redpen)'}} onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      
      <div className="app-body">
        <nav className="sidebar hidden md:flex">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button 
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                {item.label}
                {item.badge ? <span className="nav-count">{item.badge}</span> : null}
              </button>
            );
          })}
          
          <div className="sidebar-spacer"></div>
        </nav>
        
        <main className="main">
           <Outlet />
        </main>
      </div>
    </div>
  );
}
