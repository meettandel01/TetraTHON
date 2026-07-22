import React, { useMemo } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import { AlertTriangle, BookOpen, CheckCircle } from 'lucide-react'

// Define the static structure of our Class 8-10 Math Knowledge Graph
const GRAPH_STRUCTURE = {
  nodes: [
    { data: { id: 'math', label: 'Mathematics' } },
    { data: { id: 'algebra', label: 'Algebra' } },
    { data: { id: 'linear', label: 'Linear Equations' } },
    { data: { id: 'poly', label: 'Polynomials' } },
    { data: { id: 'quad', label: 'Quadratic Equations' } },
    { data: { id: 'ap', label: 'Arithmetic Progressions' } },
    { data: { id: 'trig', label: 'Trigonometry' } }
  ],
  edges: [
    { data: { source: 'math', target: 'algebra' } },
    { data: { source: 'math', target: 'trig' } },
    { data: { source: 'algebra', target: 'linear' } },
    { data: { source: 'linear', target: 'poly' } },
    { data: { source: 'linear', target: 'ap' } },
    { data: { source: 'poly', target: 'quad' } },
    { data: { source: 'quad', target: 'trig' } } // connecting quad to trig just to show links
  ]
}

// Map the DB concept tags to our node IDs
const CONCEPT_MAP = {
  'Linear Equations': 'linear',
  'Polynomials': 'poly',
  'Quadratic Equations': 'quad',
  'Arithmetic Progressions': 'ap',
  'Trigonometry': 'trig'
}

export default function KnowledgeGraph({ conceptPerformance }) {
  const elements = useMemo(() => {
    // Determine node states based on performance
    const statuses = {} // nodeId -> 'mastered' | 'weak' | 'unattempted'
    
    // Default all leaves to unattempted
    Object.values(CONCEPT_MAP).forEach(id => { statuses[id] = 'unattempted' })
    
    // Populate statuses from backend data
    Object.entries(conceptPerformance || {}).forEach(([conceptName, perf]) => {
      const nodeId = CONCEPT_MAP[conceptName]
      if (nodeId) {
        const pct = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0
        statuses[nodeId] = pct >= 50 ? 'mastered' : 'weak'
      }
    })

    // Construct Cytoscape elements
    const nodes = GRAPH_STRUCTURE.nodes.map(node => {
      let nodeClass = 'default'
      if (['math', 'algebra'].includes(node.data.id)) {
        nodeClass = 'root'
      } else {
        nodeClass = statuses[node.data.id] || 'unattempted'
      }
      return { ...node, classes: nodeClass }
    })

    return [...nodes, ...GRAPH_STRUCTURE.edges]
  }, [conceptPerformance])

  const style = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': '#fff',
        'font-size': '11px',
        'font-family': 'Inter, sans-serif',
        'font-weight': 'bold',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '80px',
        'border-width': 2,
        'padding': '10px',
        'shape': 'round-rectangle'
      }
    },
    {
      selector: 'node.root',
      style: {
        'background-color': '#1e293b',
        'border-color': '#475569',
        'color': '#cbd5e1'
      }
    },
    {
      selector: 'node.unattempted',
      style: {
        'background-color': '#0f172a',
        'border-color': '#334155',
        'color': '#94a3b8'
      }
    },
    {
      selector: 'node.mastered',
      style: {
        'background-color': 'rgba(16,185,129,0.15)',
        'border-color': '#10b981',
        'color': '#10b981'
      }
    },
    {
      selector: 'node.weak',
      style: {
        'background-color': 'rgba(239,68,68,0.15)',
        'border-color': '#ef4444',
        'color': '#ef4444'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#334155',
        'target-arrow-color': '#334155',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ]

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden relative" style={{ background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Legend overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Knowledge Map</h4>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
          <span className="text-slate-300">Mastered</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
          <span className="text-slate-300">Needs Work</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-slate-800 border border-slate-600" />
          <span className="text-slate-500">Unattempted</span>
        </div>
      </div>

      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={style}
        layout={{ name: 'breadthfirst', directed: true, spacingFactor: 1.2, padding: 30 }}
        userZoomingEnabled={false}
        userPanningEnabled={true}
        boxSelectionEnabled={false}
      />
    </div>
  )
}
