import React, { useEffect, useState } from 'react';

export default function GaugeChart({ score = 0 }) {
  const [dashArray, setDashArray] = useState('0 126');
  const [rotation, setRotation] = useState(-90);

  useEffect(() => {
    // Animate after mount
    const timeout = setTimeout(() => {
      const fill = (score / 100) * 126; // r=40 -> pi * 40 ≈ 125.6
      setDashArray(`${fill} 126`);
      
      const rot = -90 + (score / 100) * 180;
      setRotation(rot);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div className="gauge">
      <svg className="gauge-svg" viewBox="0 0 100 55">
        <path className="gauge-track" d="M 10 50 A 40 40 0 0 1 90 50" />
        <path className="gauge-fill" d="M 10 50 A 40 40 0 0 1 90 50" style={{ strokeDasharray: dashArray }} />
        <g className="gauge-needle" style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.6s ease' }}>
          <line x1="50" y1="50" x2="50" y2="15" />
        </g>
        <circle cx="50" cy="50" r="4" className="gauge-hub" />
      </svg>
      <div className="gauge-labels">
        <span>Foundational</span>
        <span>Grade</span>
        <span>Advanced</span>
      </div>
    </div>
  );
}
