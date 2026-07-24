import React, { useState, useEffect } from 'react';
import { teacherApi, reportCardApi } from '../services/api';
import toast from 'react-hot-toast';

export default function RosterPage() {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('8-A');

  useEffect(() => {
    fetchRoster();
  }, [section]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.getRoster(section);
      setRoster(res.data);
    } catch (err) {
      toast.error('Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    if (level === 'Foundational') return 'bg-[var(--marigold-soft)] text-[#8C5C13]';
    if (level === 'Grade-Level') return 'bg-[var(--sky-soft)] text-[#2947C4]';
    if (level === 'Advanced') return 'bg-[var(--forest-soft)] text-[#0A6B44]';
    return 'bg-[#EDEAE0] text-[var(--ink-soft)]';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-serif text-[var(--ink)]">Student Roster</h1>
          <p className="text-[var(--ink-soft)]">Manage and monitor student progress across your sections.</p>
        </div>
        <div className="flex gap-2">
          {['8-A', '8-B', '8-C'].map(sec => (
            <button
              key={sec}
              onClick={() => setSection(sec)}
              className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors ${
                section === sec
                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                  : 'bg-[var(--card)] text-[var(--ink-soft)] border-[var(--border)] hover:border-[var(--ink-soft)]'
              }`}
            >
              Section {sec}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--sky)] rounded-full animate-spin"></div>
        </div>
      ) : roster.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-12 text-center text-[var(--ink-soft)] bg-[var(--card)]">
          <p>No students found in section {section}.</p>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--r-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0ECDF]">
                <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-[var(--ink-faint)] border-b border-[var(--border)]">Student Name</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-[var(--ink-faint)] border-b border-[var(--border)]">Learning Level</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-[var(--ink-faint)] border-b border-[var(--border)]">Avg Mastery</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-[var(--ink-faint)] border-b border-[var(--border)]">XP / Streak</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-[var(--ink-faint)] border-b border-[var(--border)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => (
                <tr key={student.id} className="hover:bg-[var(--paper)] transition-colors">
                  <td className="py-4 px-4 border-b border-[var(--border)] font-bold">{student.name}</td>
                  <td className="py-4 px-4 border-b border-[var(--border)]">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(student.level)}`}>
                      {student.level || 'Not Assessed'}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-b border-[var(--border)] font-mono text-sm">
                    {student.mastery_score ? (student.mastery_score * 100).toFixed(0) + '%' : '0%'}
                  </td>
                  <td className="py-4 px-4 border-b border-[var(--border)] text-sm">
                    <span className="font-mono">{student.xp}</span> XP • 🔥 {student.streak}
                  </td>
                  <td className="py-4 px-4 border-b border-[var(--border)]">
                    <a href={`/report-card/${student.id}`} target="_blank" rel="noreferrer" className="text-[var(--sky)] font-bold text-sm hover:underline">
                      View Report
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
