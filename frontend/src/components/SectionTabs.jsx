import React from 'react';

export default function SectionTabs({ sections, activeSection, onChange }) {
  return (
    <div className="section-tabs">
      {sections.map(sec => (
        <button
          key={sec}
          className={`section-tab ${activeSection === sec ? 'active' : ''}`}
          onClick={() => onChange(sec)}
        >
          {sec.toString().toLowerCase().startsWith('sec') ? sec : (sec.length === 1 ? `Section ${sec}` : sec)}
        </button>
      ))}
    </div>
  );
}
