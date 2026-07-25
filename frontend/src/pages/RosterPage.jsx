import React, { useState, useEffect } from 'react';
import SectionTabs from '../components/SectionTabs';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teacherApi } from '../services/api';

export default function RosterPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    teacherApi.getSections()
      .then(res => {
        if (res.data?.sections?.length > 0) {
          setSections(res.data.sections);
          setActiveSection(res.data.sections[0]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    setLoading(true);
    teacherApi.getRoster(activeSection)
      .then(res => {
        setStudents(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeSection]);

  if (loading) {
    return <div className="screen"><div className="center-card" style={{padding: '40px'}}><div className="spinner"></div></div></div>;
  }

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Student Roster</h1>
          <p className="page-sub">Live student performance and learning archetypes by section.</p>
        </div>
      </div>

      <SectionTabs 
        sections={sections} 
        activeSection={activeSection} 
        onChange={setActiveSection} 
      />

      <div className="card">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Archetype</th>
              <th>Level</th>
              <th>XP</th>
              <th>Streak</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              let badgeClass = 'badge-neutral';
              if (s.level === 'Foundational') badgeClass = 'badge-foundational';
              if (s.level === 'Grade-Level') badgeClass = 'badge-grade';
              if (s.level === 'Advanced') badgeClass = 'badge-advanced';

              return (
                <tr key={s.id}>
                  <td className="heatmap-name">
                    <div className="avatar" style={{width: '26px', height: '26px', fontSize: '12px'}}>{s.name.charAt(0)}</div>
                    <span>{s.name}</span>
                  </td>
                  <td className="muted small">{s.archetype}</td>
                  <td><span className={`${badgeClass} badge-sm`}>{s.level}</span></td>
                  <td className="mono">{s.xp}</td>
                  <td className="mono">🔥{s.streak}</td>
                  <td className="roster-actions-cell">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/student/${s.id}`)}>View</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/report-card/${s.id}`)}>Report Card</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
