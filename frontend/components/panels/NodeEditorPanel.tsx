'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check, Trash2, Copy, ChevronRight, ExternalLink,
  Clock, Calendar, Target, TrendingUp
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import NodeEditorFields from './NodeEditorFields'
import type { RoadmapNode } from '@/types/roadmap'
import { NODE_COLOR_MAP, PRIORITY_MAP } from '@/types/roadmap'
import { formatHours, formatDeadline } from '@/lib/progressUtils'

// ─── Panel width ──────────────────────────────────────────────────────────

const PANEL_WIDTH = 360

// ─── Mini stats row ───────────────────────────────────────────────────────

function StatChip({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color?: string
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color ?? 'rgba(255,255,255,0.35)' }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'JetBrains Mono, monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Breadcrumb trail ─────────────────────────────────────────────────────

function Breadcrumb({ node, nodes }: { node: RoadmapNode; nodes: Record<string, RoadmapNode> }) {
  const trail: string[] = []
  let current: RoadmapNode | undefined = node

  while (current?.parentId) {
    const parent: RoadmapNode | undefined = nodes[current.parentId]
    if (parent) trail.unshift(parent.title)
    current = parent
  }

  if (trail.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flexWrap: 'wrap',
      marginBottom: 4,
    }}>
      {trail.map((crumb, i) => (
        <React.Fragment key={i}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{crumb}</span>
          {i < trail.length - 1 && (
            <ChevronRight size={10} color="rgba(255,255,255,0.2)" />
          )}
        </React.Fragment>
      ))}
      <ChevronRight size={10} color="rgba(255,255,255,0.2)" />
    </div>
  )
}

// ─── NodeEditorPanel ──────────────────────────────────────────────────────

export default function NodeEditorPanel() {
  const { state, dispatch, editingNode, closeNodeEditor } = useRoadmapContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset scroll when switching nodes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [editingNode?.id])

  const handleClose = useCallback(() => {
    closeNodeEditor()
  }, [closeNodeEditor])

  const handleUpdate = useCallback((updates: Partial<RoadmapNode>) => {
    if (!editingNode) return
    dispatch({ type: 'UPDATE_NODE', payload: { id: editingNode.id, updates } })
  }, [editingNode, dispatch])

  const handleProgressChange = useCallback((progress: number) => {
    if (!editingNode) return
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id: editingNode.id, progress } })
  }, [editingNode, dispatch])

  const handleDelete = useCallback(() => {
    if (!editingNode) return
    dispatch({ type: 'DELETE_NODE', payload: editingNode.id })
  }, [editingNode, dispatch])

  const handleDuplicate = useCallback(() => {
    if (!editingNode) return
    dispatch({ type: 'DUPLICATE_NODE', payload: editingNode.id })
  }, [editingNode, dispatch])

  const handleToggleComplete = useCallback(() => {
    if (!editingNode) return
    dispatch({ type: 'TOGGLE_COMPLETE', payload: editingNode.id })
  }, [editingNode, dispatch])

  // ── Escape to close ────────────────────────────────────────────────

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [handleClose])

  const colorMap = editingNode ? NODE_COLOR_MAP[editingNode.color] : NODE_COLOR_MAP.indigo

  if (!editingNode) return null

  return (
    <AnimatePresence>
      {editingNode && (
        <>
          {/* Backdrop blur on canvas */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(5,8,16,0.3)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: PANEL_WIDTH, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: PANEL_WIDTH, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: PANEL_WIDTH,
              zIndex: 300,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8,13,24,0.92)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderLeft: `1px solid ${colorMap.border}`,
              boxShadow: `-8px 0 48px rgba(0,0,0,0.5), -1px 0 0 ${colorMap.glow.replace('0.4', '0.15')}`,
            }}
          >
            {/* Colored top accent */}
            <div style={{
              height: 2,
              background: `linear-gradient(90deg, ${colorMap.progress}, ${colorMap.text.replace(')', ', 0.6)')})`,
              flexShrink: 0,
            }} />

            {/* Header */}
            <div style={{
              padding: '16px 20px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              {/* Breadcrumb */}
              <Breadcrumb node={editingNode} nodes={state.nodes} />

              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.92)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                  }}>
                    {editingNode.title}
                  </h2>
                  {editingNode.childIds.length > 0 && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, display: 'block' }}>
                      {editingNode.childIds.length} child node{editingNode.childIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Header actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <motion.button
                    title={editingNode.completed ? 'Mark incomplete' : 'Mark complete'}
                    onClick={handleToggleComplete}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: editingNode.completed
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${editingNode.completed ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: editingNode.completed ? '#10B981' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Check size={14} />
                  </motion.button>
                  <motion.button
                    title="Duplicate"
                    onClick={handleDuplicate}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    whileHover={{ scale: 1.1, color: '#6366F1' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Copy size={13} />
                  </motion.button>
                  <motion.button
                    title="Delete node"
                    onClick={handleDelete}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    whileHover={{ scale: 1.1, color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                  <motion.button
                    title="Close panel (Esc)"
                    onClick={handleClose}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    whileHover={{ scale: 1.1, color: 'rgba(255,255,255,0.9)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              </div>

              {/* Stats chips */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <StatChip
                  icon={<TrendingUp size={10} />}
                  label="Progress"
                  value={`${editingNode.progress}%`}
                  color={colorMap.progress}
                />
                {editingNode.estimatedHours > 0 && (
                  <StatChip
                    icon={<Clock size={10} />}
                    label="Est. time"
                    value={formatHours(editingNode.estimatedHours)}
                  />
                )}
                {editingNode.deadline && (
                  <StatChip
                    icon={<Calendar size={10} />}
                    label="Deadline"
                    value={formatDeadline(editingNode.deadline)}
                    color={
                      formatDeadline(editingNode.deadline) === 'Overdue' ? '#EF4444' : undefined
                    }
                  />
                )}
                <StatChip
                  icon={<Target size={10} />}
                  label="Priority"
                  value={PRIORITY_MAP[editingNode.priority].label}
                  color={PRIORITY_MAP[editingNode.priority].color}
                />
              </div>
            </div>

            {/* Scrollable fields */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              <NodeEditorFields
                node={editingNode}
                onChange={handleUpdate}
                onProgressChange={handleProgressChange}
              />

              {/* Bottom padding */}
              <div style={{ height: 40 }} />
            </div>

            {/* Footer — last updated */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              flexShrink: 0,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              Updated {new Date(editingNode.updatedAt).toLocaleString()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
