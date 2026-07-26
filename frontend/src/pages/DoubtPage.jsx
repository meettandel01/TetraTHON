import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { doubtsApi, escalationsApi } from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DoubtPage() {
  const { user } = useAuth();
  
  const [stage, setStage] = useState('compose'); // compose, scanning, response
  const [inputType, setInputType] = useState('text'); // text, image
  const [mode, setMode] = useState('socratic'); // socratic, direct
  const [doubtText, setDoubtText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [result, setResult] = useState(null);
  const [escalated, setEscalated] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const TEACHER_NAME = user?.teacher_name || "your teacher";

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitDoubt = async () => {
    if (inputType === 'text' && !doubtText.trim()) return;
    if (inputType === 'image' && !imageFile && !doubtText.trim()) return;

    setStage('scanning');
    setFeedbackSubmitted(false);
    
    try {
      const res = await doubtsApi.ask(user.student_id, doubtText, mode, imageFile);
      
      const conf = res.data.confidence ?? 0.5;
      const reqEsc = res.data.requires_escalation ?? false;

      setResult({ ...res.data, confidence: conf, requires_escalation: reqEsc });
      setEscalated(reqEsc);
      setStage('response');
    } catch (err) {
      console.error(err);
      toast.error('Failed to ask doubt. Is Gemini API configured?');
      setStage('compose');
    }
  };

  const doubtFeedback = async (up) => {
    if (feedbackSubmitted) return;
    try {
      if (result && result.doubt_id) {
        await doubtsApi.submitFeedback(result.doubt_id, up);
      }
      toast(up ? 'Thanks for the feedback! 👍' : 'Thanks — logged for review.', {
        icon: up ? '👍' : 'ℹ️',
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save feedback');
    }
  };

  const escalateDoubt = async () => {
    try {
      await escalationsApi.createEscalation(
        user.student_id,
        doubtText || 'Image-based doubt',
        null,
        result?.confidence
      );
      setEscalated(true);
      toast.success('Escalated to your teacher');
    } catch (err) {
      console.error(err);
      toast.error('Failed to escalate');
    }
  };

  const renderInputBlock = () => {
    if (stage === 'compose') {
      return (
        <>
          <div className="doubt-input-toggle">
            <button className={`toggle-btn ${inputType === 'text' ? 'active' : ''}`} onClick={() => { setInputType('text'); setImageFile(null); setImagePreview(null); }}>Type it out</button>
            <button className={`toggle-btn ${inputType === 'image' ? 'active' : ''}`} onClick={() => setInputType('image')}>Upload notebook photo</button>
          </div>
          
          {inputType === 'text' ? (
            <>
              <textarea 
                className="doubt-textarea" 
                placeholder="e.g. Why do we change the sign when we move 3 to the other side in 2x + 3 = 11?"
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
              ></textarea>
            </>
          ) : (
            <div className="image-upload-area">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                onChange={handleImageSelect} 
              />
              {!imagePreview ? (
                <button className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" className="upload-icon">
                    <path d="M12 16V5M7 9l5-5 5 5" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeWidth="1.8" fill="none"/>
                  </svg>
                  <span>Tap to upload a photo of your notebook</span>
                </button>
              ) : (
                <div className="upload-preview" style={{position: 'relative', marginTop: '16px'}}>
                  <img src={imagePreview} alt="Preview" style={{maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)'}} />
                  <button className="btn btn-ghost btn-sm" style={{position: 'absolute', top: 8, right: 8, background: 'white'}} onClick={() => { setImageFile(null); setImagePreview(null); }}>✕ Clear</button>
                </div>
              )}
              <textarea 
                className="doubt-textarea mt-4" 
                placeholder="(Optional) Add any specific question about this photo..."
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
              ></textarea>
            </div>
          )}
          
          <div className="explain-mode-toggle mt-4 mb-4">
            <span className="muted small">Explanation mode:</span>
            <button className={`toggle-btn ${mode === 'socratic' ? 'active' : ''}`} onClick={() => setMode('socratic')}>Socratic</button>
            <button className={`toggle-btn ${mode === 'direct' ? 'active' : ''}`} onClick={() => setMode('direct')}>Direct</button>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={submitDoubt} 
            disabled={!doubtText.trim() && !imageFile}
          >
            Ask Sahaay &rarr;
          </button>
        </>
      );
    } else if (stage === 'scanning') {
      return (
        <div className="scanning-block">
          <div className="scan-frame">
            <div className="scan-line"></div>
            <span className="scan-emoji">📝</span>
          </div>
          <p className="muted">Analyzing your doubt with AI tutor...</p>
        </div>
      );
    } else if (result) {
      const confPct = Math.round(result.confidence * 100);
      const confLow = result.confidence < 0.4;
      
      return (
        <>
          {result.requires_escalation && (
            <div className="auto-escalate-banner">
              <strong>⚠ AI confidence {confPct}% — below the 40% threshold.</strong>
              <p>This doubt was <strong>automatically escalated</strong> to {TEACHER_NAME} without you needing to ask — the circuit breaker keeps a low-confidence answer from ever being the final word.</p>
            </div>
          )}
          <div className="confidence-meter">
            <span className="muted small">AI confidence</span>
            <div className="confidence-track">
              <div className={`confidence-fill ${confLow ? 'low' : ''}`} style={{ width: `${confPct}%` }}></div>
            </div>
            <span className="mono small">{confPct}%</span>
          </div>
          <div className="chat-thread">
            <div className="chat-bubble bubble-user">
              {imagePreview && <img src={imagePreview} alt="User Upload" style={{maxWidth: '100%', marginBottom: 8, borderRadius: 4}} />}
              {doubtText || (inputType === 'image' ? 'Explain this image' : '')}
            </div>
            <div className="chat-bubble bubble-ai">
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.response}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="doubt-feedback-row">
            <span className="muted small">Was this helpful?</span>
            {feedbackSubmitted ? (
              <span className="muted small ml-2" style={{ marginLeft: '8px' }}>Feedback recorded</span>
            ) : (
              <>
                <button className="icon-btn" onClick={() => doubtFeedback(true)}>👍</button>
                <button className="icon-btn" onClick={() => doubtFeedback(false)}>👎</button>
              </>
            )}
            {escalated ? (
              <span className="escalated-pill">{result.requires_escalation ? '⚠ Auto-escalated' : '✓ Escalated'} to {TEACHER_NAME}</span>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={escalateDoubt}>Still stuck? Escalate to teacher</button>
            )}
          </div>
          <div className="mt-4">
             <button className="btn btn-ghost btn-sm" onClick={() => { setStage('compose'); setDoubtText(''); setImageFile(null); setImagePreview(null); }}>Ask another doubt</button>
          </div>
        </>
      );
    }
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Doubt Resolution</h1>
          <p className="page-sub">AI tutoring grounded in the NCERT textbook, with human escalation when needed.</p>
        </div>
      </div>
      <div className="card card-narrow doubt-card">
        {renderInputBlock()}
      </div>
    </div>
  );
}
