import React from 'react';

// Hardcoded DAG matching the mock for this demo, usually generated algorithmically.
const nodes = [
  { id: 'c1', label: 'Integers', status: 'mastered', score: 92, x: 50, y: 150 },
  { id: 'c2', label: 'Variables', status: 'mastered', score: 85, x: 250, y: 80 },
  { id: 'c3', label: 'Simplify', status: 'mastered', score: 88, x: 250, y: 220 },
  { id: 'c4', label: 'One-Step', status: 'weak', score: 40, x: 450, y: 150, current: true },
  { id: 'c5', label: 'Two-Step', status: 'locked', score: 0, x: 650, y: 80 },
  { id: 'c6', label: 'Both Sides', status: 'locked', score: 0, x: 650, y: 220 },
  { id: 'c7', label: 'Word Problems', status: 'locked', score: 0, x: 850, y: 150 },
];

const edges = [
  { source: 'c1', target: 'c2' },
  { source: 'c1', target: 'c3' },
  { source: 'c2', target: 'c4' },
  { source: 'c3', target: 'c4' },
  { source: 'c4', target: 'c5' },
  { source: 'c4', target: 'c6' },
  { source: 'c5', target: 'c7' },
  { source: 'c6', target: 'c7' },
];

export default function ConceptGraph({ data = null }) {
  // Use data if provided, else mock
  const graphNodes = data?.nodes || nodes;
  const graphEdges = data?.edges || edges;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] h-[300px] relative">
        <svg width="100%" height="100%" viewBox="0 0 900 300">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--border)" />
            </marker>
            <marker id="arrowhead-locked" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--border)" opacity="0.4" />
            </marker>
          </defs>

          {/* Draw Edges */}
          {graphEdges.map((e, i) => {
            const s = graphNodes.find(n => n.id === e.source);
            const t = graphNodes.find(n => n.id === e.target);
            if(!s || !t) return null;
            
            const isLocked = t.status === 'locked';
            
            return (
              <path 
                key={i}
                d={`M ${s.x} ${s.y} C ${(s.x + t.x)/2} ${s.y}, ${(s.x + t.x)/2} ${t.y}, ${t.x} ${t.y}`}
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
                strokeDasharray={isLocked ? "4 4" : "none"}
                opacity={isLocked ? 0.4 : 1}
                markerEnd={`url(#${isLocked ? 'arrowhead-locked' : 'arrowhead'})`}
              />
            );
          })}

          {/* Draw Nodes */}
          {graphNodes.map(n => {
            let fill = "var(--paper)";
            let stroke = "var(--border)";
            let textFill = "var(--ink)";
            
            if (n.status === 'mastered') {
              fill = "var(--forest-soft)";
              stroke = "var(--forest)";
              textFill = "var(--forest)";
            } else if (n.status === 'weak') {
              fill = "var(--marigold-soft)";
              stroke = "var(--marigold-dark)";
              textFill = "var(--marigold-dark)";
            } else if (n.status === 'locked') {
              fill = "#F2EEE1";
              stroke = "transparent";
              textFill = "var(--ink-faint)";
            }

            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="cursor-pointer transition-transform hover:scale-110">
                {n.current && (
                  <circle r="24" fill="none" stroke="var(--marigold)" strokeWidth="2" strokeDasharray="4 4">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
                  </circle>
                )}
                
                <circle r="16" fill={fill} stroke={stroke} strokeWidth="2" />
                
                {n.status === 'locked' ? (
                  <text y="4" textAnchor="middle" fill={textFill} fontSize="10" fontFamily="FontAwesome">🔒</text>
                ) : (
                  <text y="4" textAnchor="middle" fill={textFill} fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono">{n.score}</text>
                )}
                
                <text y="32" textAnchor="middle" fill={n.status==='locked' ? 'var(--ink-faint)' : 'var(--ink)'} fontSize="12" fontWeight="600" fontFamily="Manrope">{n.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
