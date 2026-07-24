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
  ChevronDown
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

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const scopeLine = user.role === 'admin' 
    ? 'Multi-board, multi-subject console'
    : 'NCERT / CBSE · Linear Equations in One Variable';

  const getSubLabel = () => {
    if (user.role === 'student') return `Class 8 · Sec ${user.section || 'A'}`;
    if (user.role === 'teacher') return 'Mathematics Teacher';
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
    <div className="flex flex-col min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="h-[58px] flex-none flex items-center justify-between px-5 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-20">
        <div className="flex items-center gap-2 text-[var(--ink)]">
          <svg viewBox="0 0 48 48" className="w-6 h-6 text-[var(--marigold)] fill-current">
            <circle cx="24" cy="10" r="6"/><circle cx="10" cy="34" r="6"/><circle cx="38" cy="34" r="6"/>
            <path d="M20 14 L13 29 M28 14 L35 29 M16 34 H32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="font-serif font-bold text-[19px] tracking-tight">Sahaay</span>
          <span className="bg-[var(--rani-soft)] text-[#A31856] text-[11px] font-bold px-2 py-0.5 rounded-full ml-1.5">Product Demo</span>
        </div>
        
        <div className="flex items-center gap-2.5 relative">
          <button 
            className="flex items-center gap-2 bg-transparent border border-transparent rounded-full py-1 pr-2 pl-1 hover:border-[var(--border)]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-[34px] h-[34px] rounded-full bg-[var(--sky)] text-white font-bold flex items-center justify-center text-[13px]">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-tight">
              <div className="text-[12.5px] font-bold">{user.name}</div>
              <div className="text-[11px] text-[var(--ink-faint)]">{getSubLabel()}</div>
            </div>
            <ChevronDown size={14} className="text-[var(--ink-faint)] ml-1" />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-12 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-lg overflow-hidden w-[170px] py-1">
              <button className="w-full text-left px-4 py-2.5 text-[13.5px] hover:bg-[var(--paper)] flex items-center gap-2" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
                Switch profile
              </button>
              <button className="w-full text-left px-4 py-2.5 text-[13.5px] hover:bg-[var(--paper)] flex items-center gap-2 text-[var(--redpen)]" onClick={handleLogout}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex-1 flex min-h-0">
        <nav className="w-[236px] flex-none border-r border-[var(--border)] bg-[var(--card)] flex flex-col px-3 py-4 hidden md:flex">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-[var(--radius-sm)] font-semibold text-[13.5px] mb-0.5 transition-colors ${
                location.pathname.startsWith(item.path) 
                  ? 'bg-[var(--ink)] text-[var(--paper)]' 
                  : 'bg-transparent border-none text-[var(--ink-soft)] hover:bg-[#F2EEE1] hover:text-[var(--ink)]'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="bg-[var(--redpen)] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
          
          <div className="flex-1"></div>
          
          <div className="border-t border-[var(--border)] pt-3 text-[11.5px] text-[var(--ink-faint)]">
            <p className="mb-0.5">Demo scope</p>
            <p className="text-[var(--ink-soft)] font-semibold">{scopeLine}</p>
          </div>
        </nav>
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
