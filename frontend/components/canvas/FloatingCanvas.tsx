'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { useCanvas } from '@/hooks/useCanvas'
import RoadmapNode from './RoadmapNode'
import ConnectionLines from './ConnectionLines'
import CanvasControls from './CanvasControls'
import MiniMap from '@/components/ui/MiniMap'
import ContextMenu, { type ContextMenuState } from './ContextMenu'
import { createNode } from '@/lib/roadmapUtils'
import { ExternalLink, Video, BookOpen, Wrench, FileText, Globe } from 'lucide-react'

const CANVAS_W = 5000
const CANVAS_H = 4000

function nodePhase(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (hash % 628) / 100
}

export default function FloatingCanvas() {
  const { state, dispatch, editingNode, openNodeEditor, closeNodeEditor } = useRoadmapContext()
  const [showGrid, setShowGrid] = useState(true)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState({ w: window?.innerWidth ?? 1200, h: window?.innerHeight ?? 800 })

  const {
    transform,
    containerRef,
    isPanning,
    startPan,
    zoomIn,
    zoomOut,
    resetView,
    fitToScreen,
    screenToCanvas,
    setTransform,
  } = useCanvas()

  // Track viewport size for minimap
  useEffect(() => {
    const update = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Fit on mount
  const hasFitted = useRef(false)
  useEffect(() => {
    if (hasFitted.current) return
    hasFitted.current = true
    const positions = Object.values(state.nodes).map(n => n.position)
    if (positions.length > 0) {
      setTimeout(() => fitToScreen(positions, 176, 64), 200)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Node handlers ──────────────────────────────────────────────────

  const handleSelect = useCallback((id: string) => {
    if (connectingFromId) {
      if (connectingFromId !== id) {
        const target = state.nodes[id]
        if (target && !target.prerequisites.includes(connectingFromId)) {
          dispatch({
            type: 'UPDATE_NODE',
            payload: {
              id,
              updates: {
                prerequisites: [...target.prerequisites, connectingFromId],
              },
            },
          })
        }
      }
      setConnectingFromId(null)
      setContextMenu(null)
      return
    }

    dispatch({ type: 'SELECT_NODE', payload: id })
    if (editingNode) closeNodeEditor()
    setContextMenu(null)
  }, [dispatch, editingNode, closeNodeEditor, connectingFromId, state.nodes])

  const handleDeselect = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    if (connectingFromId) {
      setConnectingFromId(null)
      setContextMenu(null)
      return
    }
    dispatch({ type: 'SELECT_NODE', payload: null })
    setContextMenu(null)
  }, [dispatch, connectingFromId])

  const handleMove = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'MOVE_NODE', payload: { id, position } })
  }, [dispatch])

  const handleToggleExpand = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_EXPAND', payload: id })
  }, [dispatch])

  const handleAddChild = useCallback((parentId: string) => {
    const parent = state.nodes[parentId]
    if (!parent) return
    const newNode = createNode(
      parentId,
      {
        x: parent.position.x + 200 + Math.random() * 80,
        y: parent.position.y + 80 + Math.random() * 40,
      },
      parent.color,
      'New Topic'
    )
    dispatch({ type: 'ADD_NODE', payload: newNode })
    setTimeout(() => dispatch({ type: 'SELECT_NODE', payload: newNode.id }), 50)
  }, [state.nodes, dispatch])

  const handleDelete = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: id })
  }, [dispatch])

  const handleDuplicate = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_NODE', payload: id })
  }, [dispatch])

  const handleToggleComplete = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_COMPLETE', payload: id })
  }, [dispatch])

  const handleToggleSubtask = useCallback((nodeId: string, taskId: string) => {
    const node = state.nodes[nodeId]
    if (!node) return

    const childTasks = node.childTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )

    dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { childTasks } } })
  }, [state.nodes, dispatch])

  // ── Right-click context menu ───────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const nodeEl = (e.target as HTMLElement).closest('[data-node]')
    if (!nodeEl) {
      setContextMenu(null)
      return
    }
    e.preventDefault()
    const nodeId = nodeEl.getAttribute('data-node')!
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId })
  }, [])

  // ── Double-click to add node ───────────────────────────────────────

  const handleOpenEditor = useCallback((id: string) => {
    dispatch({ type: 'SELECT_NODE', payload: id })
    openNodeEditor(id)
    setContextMenu(null)
  }, [dispatch, openNodeEditor])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    e.preventDefault()
    e.stopPropagation()

    const pos = screenToCanvas(e.clientX, e.clientY)
    const newNode = createNode(null, pos, 'indigo', 'New Category')
    dispatch({ type: 'ADD_NODE', payload: newNode })
    dispatch({ type: 'SELECT_NODE', payload: newNode.id })
  }, [dispatch, screenToCanvas])

  // ── Fit handler ────────────────────────────────────────────────────

  const handleFit = useCallback(() => {
    const positions = Object.values(state.nodes).map(n => n.position)
    fitToScreen(positions, 176, 64)
  }, [state.nodes, fitToScreen])

  // ── MiniMap jump ───────────────────────────────────────────────────

  const handleMiniMapJump = useCallback((canvasX: number, canvasY: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setTransform(prev => ({
      ...prev,
      x: rect.width / 2 - canvasX * prev.scale,
      y: rect.height / 2 - canvasY * prev.scale,
    }))
  }, [containerRef, setTransform])

  // ── Visible node ids ───────────────────────────────────────────────

  const visibleNodeIds = useMemo(() => {
    const visible = new Set<string>()
    function addVisible(nodeId: string) {
      const node = state.nodes[nodeId]
      if (!node || visible.has(nodeId)) return
      visible.add(nodeId)
      if (node.isExpanded) node.childIds.forEach(addVisible)
    }

    state.rootIds.forEach(addVisible)

    // If there are orphan nodes or rootIds are missing, render them too.
    Object.keys(state.nodes).forEach(nodeId => {
      if (!visible.has(nodeId)) {
        addVisible(nodeId)
      }
    })

    return visible
  }, [state.nodes, state.rootIds])

  // Context menu node
  const contextNode = contextMenu ? state.nodes[contextMenu.nodeId] ?? null : null

  return (
    <div
      ref={containerRef}
      className="canvas-root canvas-cursor"
      onMouseDown={startPan}
      onClick={handleDeselect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {/* Grid */}
      {showGrid && <div className="canvas-grid" />}

      {/* Canvas surface */}
      <div
        className="canvas-surface"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          width: CANVAS_W,
          height: CANVAS_H,
        }}
      >
        <ConnectionLines
          state={state}
          selectedNodeId={state.selectedNodeId}
          canvasWidth={CANVAS_W}
          canvasHeight={CANVAS_H}
        />

        <AnimatePresence>
          {Array.from(visibleNodeIds).map(nodeId => {
            const node = state.nodes[nodeId]
            if (!node) return null
            return (
              <motion.div
                key={nodeId}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <RoadmapNode
                  node={node}
                  isSelected={state.selectedNodeId === nodeId}
                  scale={transform.scale}
                  onSelect={handleSelect}
                  onOpenEditor={handleOpenEditor}
                  onMove={handleMove}
                  onToggleExpand={handleToggleExpand}
                  onAddChild={handleAddChild}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleComplete={handleToggleComplete}
                  phaseOffset={nodePhase(nodeId)}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {state.selectedNodeId && !editingNode && (() => {
        const selected = state.nodes[state.selectedNodeId]
        if (!selected) return null
        const previewLeft = selected.position.x * transform.scale + transform.x + 200
        const previewTop = selected.position.y * transform.scale + transform.y

        return (
          <div
            style={{
              position: 'absolute',
              left: previewLeft,
              top: previewTop,
              zIndex: 120,
              minWidth: 320,
              maxWidth: 340,
              background: 'rgba(8,13,24,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: '14px 16px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, maxHeight: 88, overflow: 'hidden' }}>
                  {selected.description || 'No description available.'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Status</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.status.replace('_', ' ')}</span>
              </div>
            </div>
            {selected.notes && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>
                <strong style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>Notes</strong>
                {selected.notes}
              </div>
            )}
            {!selected.notes && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                No notes yet. Double-click the node to edit it.
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              <span>{selected.progress}% progress</span>
              <span>{selected.priority.charAt(0).toUpperCase() + selected.priority.slice(1)} priority</span>
              {selected.deadline && <span>Deadline: {selected.deadline}</span>}
            </div>

            {selected.childTasks.length > 0 && (() => {
              const completedTasks = selected.childTasks.filter(task => task.completed).length
              return (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.86)' }}>
                      Subtasks
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                      {completedTasks}/{selected.childTasks.length} completed
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selected.childTasks.map(task => (
                      <label
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleSubtask(selected.id, task.id)}
                          style={{ width: 16, height: 16, accentColor: '#8B5CF6' }}
                        />
                        <span style={{
                          color: task.completed ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.82)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          fontSize: 12,
                        }}>
                          {task.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })()}

              {selected.resources && selected.resources.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.86)' }}>Resources</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{selected.resources.length} item{selected.resources.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selected.resources.map(r => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                        onClick={() => { if (r.url) window.open(r.url, '_blank') }}
                      >
                        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: '#9CA3FF' }}>
                          {r.type === 'video' && <Video size={14} />}
                          {r.type === 'article' && <FileText size={14} />}
                          {r.type === 'course' && <BookOpen size={14} />}
                          {r.type === 'book' && <BookOpen size={14} />}
                          {r.type === 'tool' && <Wrench size={14} />}
                          {r.type === 'other' && <Globe size={14} />}
                        </span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center' }}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )
      })()}

      {/* Canvas controls */}
      <CanvasControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={handleFit}
        onReset={resetView}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(v => !v)}
      />

      {/* Mini map */}
      <MiniMap
        transform={transform}
        viewportW={viewportSize.w}
        viewportH={viewportSize.h}
        onJump={handleMiniMapJump}
      />

      {connectingFromId && (() => {
        const source = state.nodes[connectingFromId]
        if (!source) return null
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 14px',
              borderRadius: 999,
              background: 'rgba(15,23,42,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: 12,
              letterSpacing: '0.04em',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 300,
            }}
          >
            Select another node to attach to “{source.title}” or click empty space to cancel.
          </motion.div>
        )
      })()}

      {/* Context menu */}
      <ContextMenu
        menu={contextMenu}
        node={contextNode}
        onClose={() => setContextMenu(null)}
        onSelect={handleSelect}
        onOpenEditor={handleOpenEditor}
        onAddChild={handleAddChild}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleComplete={handleToggleComplete}
        onToggleExpand={handleToggleExpand}
        onStartConnect={(id: string) => {
          setConnectingFromId(id)
          setContextMenu(null)
        }}
      />

      {!connectingFromId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.18)',
            pointerEvents: 'none',
            letterSpacing: '0.04em',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Double-click to add · Right-click node for options · Scroll to zoom · Cmd+K to search
        </motion.div>
      )}
    </div>
  )
}
