import React from 'react';

export default function MasteryRing({ score = 0, size = 'md' }) {
  const isMastered = score >= 80;
  const isWeak = score < 50;
  
  let color = 'var(--marigold-dark)';
  if (isMastered) color = 'var(--forest)';
  else if (!isWeak) color = 'var(--marigold)';

  const className = size === 'sm' ? 'mastery-pip-ring' : 'path-row-ring';

  return (
    <div className={className} style={{ '--c': color, '--v': `${score}%` }}>
      {size === 'md' && <span>{score}%</span>}
    </div>
  );
}
