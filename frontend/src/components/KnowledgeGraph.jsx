import React, { useMemo, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import { Info } from 'lucide-react'

// Theme Colors for Cytoscape Canvas (Hex values matched to Warm Ink theme)
const theme = {
  fontFamily: 'Inter, sans-serif',
  textPrimary: '#2D2C28',
  textSecondary: '#6B7280',
  border: '#E5E5E2',
  bgSecondary: '#F2F2EF',
  bgElevated: '#FFFFFF',
  success: '#0D9488',
  successLight: '#F0FDFA',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  accent: '#D97706',
  edge: '#D1D5DB'
}

export default function KnowledgeGraph({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null)

  const elements = useMemo(() => {
    if (!graphData || !graphData.nodes) return []

    const nodes = graphData.nodes.map(node => ({
      data: { 
        id: node.id, 
        label: node.mastery !== null ? `${node.name}\n${node.mastery}%` : node.name,
        name: node.name,
        mastery: node.mastery,
        status: node.status
      },
      classes: node.status || 'unattempted'
    }))

    const edges = (graphData.edges || []).map(edge => ({
      data: { source: edge.source, target: edge.target }
    }))

    return [...nodes, ...edges]
  }, [graphData])

  const style = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': theme.textPrimary,
        'font-size': '11px',
        'font-family': theme.fontFamily,
        'font-weight': 'bold',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'border-width': 2,
        'padding': '12px',
        'shape': 'round-rectangle',
        'transition-property': 'background-color, border-color, color, border-width',
        'transition-duration': '0.3s'
      }
    },
    {
      selector: 'node.root',
      style: {
        'background-color': theme.bgElevated,
        'border-color': theme.border,
        'color': theme.textPrimary,
        'font-size': '13px',
      }
    },
    {
      selector: 'node.unattempted',
      style: {
        'background-color': theme.bgSecondary,
        'border-color': theme.border,
        'color': theme.textSecondary
      }
    },
    {
      selector: 'node.mastered',
      style: {
        'background-color': theme.successLight,
        'border-color': theme.success,
        'color': theme.success
      }
    },
    {
      selector: 'node.weak',
      style: {
        'background-color': theme.warningLight,
        'border-color': theme.warning,
        'color': theme.warning
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': theme.accent,
        'shadow-blur': 10,
        'shadow-color': theme.accent,
        'shadow-opacity': 0.3
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': theme.edge,
        'target-arrow-color': theme.edge,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 1.2
      }
    }
  ]

  const handleNodeClick = (event) => {
    const nodeData = event.target.data()
    setSelectedNode(nodeData)
  }

  const handleBackgroundClick = (event) => {
    if (event.target === event.cy) {
      setSelectedNode(null)
    }
  }

  // Summary for screen readers
  const srSummary = useMemo(() => {
    if (!graphData || !graphData.nodes) return 'No concept graph data available.'
    const total = graphData.nodes.length
    const mastered = graphData.nodes.filter(n => n.status === 'mastered').length
    const weak = graphData.nodes.filter(n => n.status === 'weak').length
    return `Knowledge graph showing ${total} concepts. ${mastered} mastered concepts. ${weak} concepts need work.`
  }, [graphData])

  if (!graphData || !graphData.nodes) {
    return (
      <div className="w-full h-[400px] rounded-2xl flex items-center justify-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
        <p className="text-[var(--color-text-secondary)] text-sm font-medium">No concept graph data available.</p>
      </div>
    )
  }

  return (
    <figure 
      aria-label="Knowledge Graph Visualization" 
      role="img"
      className="w-full h-[500px] rounded-2xl overflow-hidden relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
    >
      <figcaption className="sr-only">{srSummary}</figcaption>

      {/* Legend overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 p-3 rounded-xl bg-white border border-[var(--color-border)] shadow-sm">
        <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Knowledge Map</h3>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded bg-[var(--color-success-light)] border border-[var(--color-success)]" aria-hidden="true" />
          <span className="text-[var(--color-text-primary)]">Mastered</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded bg-[var(--color-warning-light)] border border-[var(--color-warning)]" aria-hidden="true" />
          <span className="text-[var(--color-text-primary)]">Needs Work</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]" aria-hidden="true" />
          <span className="text-[var(--color-text-secondary)]">Unattempted</span>
        </div>
      </div>

      {/* Selection overlay */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-10 w-64 p-4 rounded-xl shadow-lg transition-all bg-white border-2 border-[var(--color-accent-primary)]" role="status" aria-live="polite">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{selectedNode.name}</h4>
            <button 
              onClick={() => setSelectedNode(null)} 
              aria-label="Close node details"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] rounded-full w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          
          {selectedNode.status === 'root' ? (
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">Broad category concept.</p>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[var(--color-text-secondary)] font-medium">Mastery</span>
                <span className="font-bold text-[var(--color-text-primary)]">{selectedNode.mastery !== null ? `${selectedNode.mastery}%` : 'N/A'}</span>
              </div>
              <div 
                className="progress-bar h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={selectedNode.mastery || 0}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${selectedNode.name} mastery`}
              >
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${selectedNode.mastery || 0}%`,
                    background: selectedNode.status === 'weak' ? 'var(--color-warning)' : 'var(--color-success)'
                  }}
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 uppercase tracking-wider font-bold">
                Status: <span style={{ color: selectedNode.status === 'weak' ? 'var(--color-warning)' : selectedNode.status === 'mastered' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{selectedNode.status}</span>
              </p>
            </div>
          )}
          
          <button 
            onClick={() => window.location.href = '/doubt'} 
            className="w-full py-2.5 bg-[var(--color-info-light)] hover:bg-[var(--color-info)] hover:text-white text-[var(--color-info)] border border-[rgba(37,99,235,0.2)] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-info)]"
          >
            <Info size={14} aria-hidden="true" />
            Ask a Doubt about this
          </button>
        </div>
      )}

      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={style}
        layout={{ 
          name: 'breadthfirst', 
          directed: true, 
          spacingFactor: 1.1, 
          padding: 40,
          avoidOverlap: true,
          nodeDimensionsIncludeLabels: true
        }}
        cy={cy => {
          cy.on('tap', 'node', handleNodeClick)
          cy.on('tap', handleBackgroundClick)
        }}
        userZoomingEnabled={true}
        userPanningEnabled={true}
        boxSelectionEnabled={false}
      />
    </figure>
  )
}
