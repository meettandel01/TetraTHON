import React, { useState, useEffect } from 'react';
import { escalationsApi } from '../services/api';
import toast from 'react-hot-toast';

export default function EscalationQueuePage() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [responseTexts, setResponseTexts] = useState({});

  useEffect(() => {
    fetchEscalations();
  }, [filter]);

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const res = await escalationsApi.getEscalations(filter);
      setEscalations(res.data);
    } catch (err) {
      toast.error('Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id) => {
    try {
      await escalationsApi.claimEscalation(id);
      toast.success('Escalation claimed');
      fetchEscalations();
    } catch (err) {
      toast.error('Failed to claim escalation');
    }
  };

  const handleRespond = async (id) => {
    const text = responseTexts[id];
    if (!text) {
      toast.error('Response text is required');
      return;
    }
    try {
      await escalationsApi.respondEscalation(id, text);
      toast.success('Response submitted successfully');
      fetchEscalations();
    } catch (err) {
      toast.error('Failed to submit response');
    }
  };

  const handleTextChange = (id, text) => {
    setResponseTexts({ ...responseTexts, [id]: text });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 font-serif text-[var(--ink)]">Escalation Queue</h1>
        <p className="text-[var(--ink-soft)]">Review and respond to student doubts that require human intervention.</p>
      </div>

      <div className="flex gap-4 mb-6">
        {['pending', 'claimed', 'resolved', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors ${
              filter === status
                ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                : 'bg-[var(--paper)] text-[var(--ink-soft)] border-[var(--border)] hover:border-[var(--ink-soft)]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--sky)] rounded-full animate-spin"></div>
        </div>
      ) : escalations.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-12 text-center text-[var(--ink-soft)]">
          <p>No {filter} escalations found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {escalations.map((esc) => (
            <div key={esc.id} className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 shadow-[var(--shadow-sm)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{esc.student_name} <span className="text-sm font-normal text-[var(--ink-soft)] ml-2">Section {esc.student_section}</span></h3>
                  <p className="text-sm text-[var(--ink-faint)]">Concept: {esc.concept_id} • AI Confidence: {esc.ai_confidence ? (esc.ai_confidence * 100).toFixed(0) + '%' : 'N/A'}</p>
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    esc.status === 'pending' ? 'bg-[var(--redpen-soft)] text-[#A5281F]' :
                    esc.status === 'claimed' ? 'bg-[var(--sky-soft)] text-[#2947C4]' :
                    'bg-[var(--forest-soft)] text-[#0A6B44]'
                  }`}>
                    {esc.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="bg-[var(--paper)] border-l-4 border-[var(--redpen)] p-4 rounded-r-[var(--r-sm)] mb-4 italic text-[14px]">
                "{esc.doubt_text}"
              </div>

              {esc.status === 'pending' && (
                <div className="flex justify-end">
                  <button onClick={() => handleClaim(esc.id)} className="bg-[var(--ink)] text-[var(--paper)] px-4 py-2 rounded-full font-bold text-sm hover:bg-[#2B3350]">
                    Claim Escalation
                  </button>
                </div>
              )}

              {esc.status === 'claimed' && (
                <div className="mt-4">
                  <textarea
                    className="w-full min-h-[100px] p-4 rounded-[var(--r-md)] border-2 border-[var(--border)] bg-[var(--paper)] focus:outline-none focus:border-[var(--sky)] mb-3 text-sm"
                    placeholder="Type your response to the student here..."
                    value={responseTexts[esc.id] || ''}
                    onChange={(e) => handleTextChange(esc.id, e.target.value)}
                  ></textarea>
                  <div className="flex justify-end">
                    <button onClick={() => handleRespond(esc.id)} className="bg-[var(--forest)] text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-[#085a39]">
                      Submit Response & Resolve
                    </button>
                  </div>
                </div>
              )}

              {esc.status === 'resolved' && esc.response_text && (
                <div className="mt-4 bg-[var(--forest-soft)] p-4 rounded-[var(--r-md)] text-sm">
                  <strong>Teacher Response:</strong>
                  <p className="mt-1">{esc.response_text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
