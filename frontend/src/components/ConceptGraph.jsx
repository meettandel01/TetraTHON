import React from 'react';

export default function ConceptGraph({ data = null, masteryMap = null, currentId = null, cycleDemo = false }) {
  const baseNodes = (data && data.nodes && data.nodes.length > 0) ? data.nodes : [];
  const graphEdges = (data && data.edges && data.edges.length > 0) ? data.edges : [];

  if (!baseNodes || baseNodes.length === 0) {
    return (
      <div className="muted small italic" style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px' }}>
        No concept data available yet. Start sessions or complete assessments to populate graph.
      </div>
    );
  }

  const graphNodes = baseNodes.map((n, idx) => {
    let score = n.score !== undefined ? n.score : (n.mastery !== null && n.mastery !== undefined ? Math.round(n.mastery) : 0);
    let status = n.status || 'locked';
    let label = n.label || n.name || String(n.id);
    let isCurrent = currentId ? (n.id === currentId || n.name === currentId || String(n.id) === String(currentId)) : n.current;

    if (masteryMap && (masteryMap[n.id] !== undefined || masteryMap[n.name] !== undefined || masteryMap[label] !== undefined)) {
      const val = masteryMap[n.id] !== undefined ? masteryMap[n.id] : (masteryMap[n.name] !== undefined ? masteryMap[n.name] : masteryMap[label]);
      score = Math.round(val * (val <= 1 ? 100 : 1));
      if (score >= 80) status = 'mastered';
      else if (score >= 40) status = 'weak';
      else status = 'locked';
    }

    let x = n.x;
    let y = n.y;
    if (x === undefined || y === undefined) {
      if (status === 'chapter') {
        x = 120 + (idx % 4) * 200;
        y = 50;
      } else {
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        x = 100 + col * 170;
        y = 150 + row * 100;
      }
    }

    return { ...n, label, score, status, current: isCurrent, x, y };
  });

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
            
            if (e.isSubEdge) {
              return (
                <line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity={0.6}
                />
              );
            }

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

            const radius = n.isSubConcept ? 12 : 16;
            const yOffset = n.isSubConcept ? 3 : 4;

            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="cursor-pointer transition-transform hover:scale-110">
                {n.current && (
                  <circle r={radius + 8} fill="none" stroke="var(--marigold)" strokeWidth="2" strokeDasharray="4 4">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
                  </circle>
                )}
                
                <circle r={radius} fill={fill} stroke={stroke} strokeWidth="2" />
                
                {n.status === 'locked' ? (
                  <text y={yOffset} textAnchor="middle" fill={textFill} fontSize={n.isSubConcept ? "8" : "10"} fontFamily="FontAwesome">🔒</text>
                ) : (
                  <text y={yOffset} textAnchor="middle" fill={textFill} fontSize={n.isSubConcept ? "9" : "11"} fontWeight="bold" fontFamily="IBM Plex Mono">{n.score}</text>
                )}
                
                <text y={radius + 16} textAnchor="middle" fill={n.status==='locked' ? 'var(--ink-faint)' : 'var(--ink)'} fontSize={n.isSubConcept ? "10" : "12"} fontWeight="600" fontFamily="Manrope">{n.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
