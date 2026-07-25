import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { name });
      
      // Update local storage and context
      const updatedUser = { ...user, name: res.data.name };
      login(token, updatedUser);
      
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ marginBottom: '24px' }}>Profile Settings</h2>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--ink-dark)' }}>
              Full Name
            </label>
            <input 
              type="text" 
              className="input-field"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--ink-dark)' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--ink-dark)' }}>
              Account Type
            </label>
            <div style={{ padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: '6px', color: 'var(--ink-faint)', border: '1px solid var(--border)', cursor: 'not-allowed' }}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
