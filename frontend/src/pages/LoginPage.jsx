import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import toast from 'react-hot-toast';
import { Shield, Mail } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login state
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regPin, setRegPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pin) {
      toast.error('Please enter both email and PIN');
      return;
    }
    
    setLoading(true);
    try {
      // In this system, student_id is used instead of email currently on backend, 
      // but passing the user input directly based on instructions
      const res = await authApi.loginPin(email, pin);
      login(res.data.access_token, res.data.user);
      navigate(`/${res.data.user.role}/dashboard`);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}! 👋`);
    } catch (e) {
      setShake(true);
      setTimeout(() => setShake(false), 420);
      setPin('');
      toast.error(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(regPin)) {
      toast.error('PIN must be 4 to 6 digits');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(regName, regEmail, regRole, regPin);
      toast.success('Registration successful! Please sign in.');
      setMode('login');
      setEmail(regEmail);
      setPin(regPin);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderBrand = () => (
    <div className="login-brand">
      <div className="brand-mark">
        <svg viewBox="0 0 48 48" className="brand-logo">
          <circle cx="24" cy="10" r="6"/><circle cx="10" cy="34" r="6"/><circle cx="38" cy="34" r="6"/>
          <path d="M20 14 L13 29 M28 14 L35 29 M16 34 H32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
        <span className="brand-word">Sahaay</span>
      </div>
      <p className="brand-tagline">Adaptive microlearning &amp; AI doubt-resolution for every NCERT classroom.</p>
      
      <div className="brand-graph">
         <svg viewBox="0 0 340 180" className="w-full h-auto">
            <path d="M40 90 L 170 40 L 300 90" stroke="#6459A0" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            <path d="M170 40 L 170 140" stroke="#6459A0" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            <circle cx="40" cy="90" r="16" fill="#3D2E70" stroke="#E4E1F5" strokeWidth="2" />
            <text x="40" y="94" fontFamily="sans-serif" fontSize="10" fill="#E4E1F5" textAnchor="middle" fontWeight="bold">C1</text>
            <circle cx="300" cy="90" r="16" fill="#3D2E70" stroke="#E4E1F5" strokeWidth="2" />
            <text x="300" y="94" fontFamily="sans-serif" fontSize="10" fill="#E4E1F5" textAnchor="middle" fontWeight="bold">C3</text>
            <circle cx="170" cy="140" r="16" fill="#3D2E70" stroke="#E4E1F5" strokeWidth="2" />
            <text x="170" y="144" fontFamily="sans-serif" fontSize="10" fill="#E4E1F5" textAnchor="middle" fontWeight="bold">C4</text>
            <circle cx="170" cy="40" r="22" fill="none" stroke="#F0A23A" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="170" cy="40" r="18" fill="#F0A23A" stroke="#FFFFFF" strokeWidth="2" />
            <text x="170" y="44" fontFamily="sans-serif" fontSize="12" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">C2</text>
          </svg>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className={`login-card ${shake ? 'shake' : ''}`}>
      <h2 className="login-title">Sign In</h2>
      <form onSubmit={handleLoginSubmit} style={{ width: '100%', marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email or ID</label>
          <input 
            type="text"
            className="input-field"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>PIN</label>
          <input 
            type="password"
            className="input-field"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="4-6 digit PIN"
            maxLength={6}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button className="btn btn-ghost" onClick={() => setMode('register')}>
          Don't have an account? Register
        </button>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="login-card">
      <h2 className="login-title">Register</h2>
      <form onSubmit={handleRegisterSubmit} style={{ width: '100%', marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
          <input 
            type="text"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
          <input 
            type="email"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Role</label>
          <select 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
            value={regRole}
            onChange={(e) => setRegRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>PIN</label>
          <input 
            type="password"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
            value={regPin}
            onChange={(e) => setRegPin(e.target.value)}
            placeholder="4-6 digit PIN"
            maxLength={6}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
          Register
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button className="btn btn-ghost" onClick={() => setMode('login')}>
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div className="login-shell">
      {renderBrand()}
      <div className="login-panel">
        {mode === 'login' ? renderLogin() : renderRegister()}
      </div>
    </div>
  );
}

