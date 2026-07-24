import React, { useState, useEffect } from 'react';
import { reportCardApi } from '../services/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

export default function ReportCardPage() {
  const { studentId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we're on the teacher view, we'll get a studentId from params.
    // Otherwise, we could fetch for the current logged-in student.
    // For this demo, let's assume we have a studentId or we fetch for 's01' (default demo student).
    const idToFetch = studentId || '1'; // Defaulting to 1 for demo purposes if no ID
    fetchReport(idToFetch);
  }, [studentId]);

  const fetchReport = async (id) => {
    setLoading(true);
    try {
      const res = await reportCardApi.getReportCard(id);
      setReport(res.data);
    } catch (err) {
      toast.error('Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--sky)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Report Card not available</h2>
      </div>
    );
  }

  const { student_name, grade, section, mastery_percentage, overall_grade, doubt_stats, concept_status, strengths, weaknesses, remarks } = report;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-[var(--paper)] min-h-screen">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--r-lg)] p-8 shadow-[var(--shadow)] relative overflow-hidden">
        
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[var(--sky)] to-[var(--forest)]"></div>

        <div className="flex justify-between items-start mb-10 border-b border-[var(--border)] pb-8">
          <div>
            <h1 className="text-4xl font-bold font-serif text-[var(--ink)] mb-2">Student Report Card</h1>
            <p className="text-[var(--ink-soft)] text-lg">Sahaay Adaptive Learning Platform</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">{student_name}</h2>
            <p className="text-[var(--ink-faint)]">Grade: {grade} • Section: {section}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="col-span-1 flex flex-col items-center justify-center bg-[var(--forest-soft)] rounded-[var(--r-lg)] p-6 border border-[#a3d9c1]">
            <span className="text-sm font-bold text-[#0A6B44] uppercase tracking-wide mb-2">Overall Grade</span>
            <span className="text-6xl font-serif font-bold text-[#0A6B44]">{overall_grade}</span>
          </div>
          
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-[#F0ECDF] rounded-[var(--r-md)] p-5">
              <span className="text-xs font-bold text-[var(--ink-faint)] uppercase block mb-1">Mastery Score</span>
              <span className="text-3xl font-bold font-mono">{mastery_percentage}%</span>
            </div>
            <div className="bg-[#F0ECDF] rounded-[var(--r-md)] p-5">
              <span className="text-xs font-bold text-[var(--ink-faint)] uppercase block mb-1">Doubts Asked</span>
              <span className="text-3xl font-bold font-mono">{doubt_stats.total}</span>
            </div>
            <div className="bg-[#F0ECDF] rounded-[var(--r-md)] p-5">
              <span className="text-xs font-bold text-[var(--ink-faint)] uppercase block mb-1">Resolved Doubts</span>
              <span className="text-3xl font-bold font-mono">{doubt_stats.resolved}</span>
            </div>
            <div className="bg-[#F0ECDF] rounded-[var(--r-md)] p-5">
              <span className="text-xs font-bold text-[var(--ink-faint)] uppercase block mb-1">Unresolved</span>
              <span className="text-3xl font-bold font-mono">{doubt_stats.unresolved}</span>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold font-serif mb-4 border-b border-[var(--border)] pb-2">Concept Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(concept_status).map(([concept, status]) => (
              <div key={concept} className="flex justify-between items-center p-3 bg-[var(--paper)] border border-[var(--border)] rounded-[var(--r-sm)]">
                <span className="font-semibold text-sm">{concept}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  status === 'Mastered' ? 'bg-[var(--forest-soft)] text-[#0A6B44]' :
                  status === 'In Progress' ? 'bg-[var(--sky-soft)] text-[#2947C4]' :
                  'bg-[var(--marigold-soft)] text-[#8C5C13]'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-lg font-bold font-serif mb-3 text-[#0A6B44]">Strengths</h3>
            {strengths.length > 0 ? (
              <ul className="list-disc pl-5 text-[var(--ink-soft)] text-sm space-y-1">
                {strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-[var(--ink-faint)] italic">No specific strengths identified yet.</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif mb-3 text-[#A5281F]">Areas for Improvement</h3>
            {weaknesses.length > 0 ? (
              <ul className="list-disc pl-5 text-[var(--ink-soft)] text-sm space-y-1">
                {weaknesses.map(w => <li key={w}>{w}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-[var(--ink-faint)] italic">No major weaknesses identified.</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--marigold-soft)] rounded-[var(--r-md)] p-6 border border-[#d6af7a]">
          <h3 className="text-sm font-bold text-[#8C5C13] uppercase tracking-wider mb-2">Teacher's Remarks</h3>
          <p className="text-[#5a3a0b] italic">"{remarks}"</p>
        </div>

        <div className="mt-8 text-center pt-6 border-t border-[var(--border)]">
          <button className="bg-[var(--ink)] text-[var(--paper)] px-6 py-2 rounded-full font-bold text-sm hover:bg-[#2B3350] print:hidden" onClick={() => window.print()}>
            Print Report Card
          </button>
        </div>

      </div>
    </div>
  );
}
