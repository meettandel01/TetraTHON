import React, { useState, useEffect } from 'react';
import { teacherApi } from '../services/api';
import { Mail, CheckCircle } from 'lucide-react';

export default function TeacherMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getMessages()
      .then(res => {
        setMessages(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Communication</div>
          <h1>Parent Messages</h1>
          <p className="page-sub">Direct messages and alerts from parents in your sections.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-8">
        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Date</th>
              <th>Parent</th>
              <th>Student</th>
              <th>Message</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id} style={{ background: msg.is_read ? 'transparent' : 'var(--marigold-soft)' }}>
                <td style={{ paddingLeft: '24px', whiteSpace: 'nowrap' }} className="muted small">
                  {new Date(msg.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ fontWeight: 600 }}>{msg.parent_name}</td>
                <td>{msg.student_name}</td>
                <td style={{ maxWidth: '300px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {msg.content}
                  </div>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                  {msg.is_read ? (
                    <span className="badge-neutral"><CheckCircle size={12} style={{ marginRight: '4px' }} /> Read</span>
                  ) : (
                    <span className="badge-foundational" style={{ background: 'var(--marigold)', color: '#fff' }}>New</span>
                  )}
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
                  <Mail size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  No messages from parents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
