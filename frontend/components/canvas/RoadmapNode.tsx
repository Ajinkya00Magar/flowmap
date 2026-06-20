'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { ChevronDown, ChevronRight, Plus, Trash2, Copy, Check } from 'lucide-react'
import type { RoadmapNode as RoadmapNodeType } from '@/types/roadmap'
import { NODE_COLOR_MAP } from '@/types/roadmap'

// ─── Constants ────────────────────────────────────────────────────────────

const ROOT_W = 176
const ROOT_H = 64
const CHILD_W = 148
const CHILD_H = 48

// ─── Idle float animation ─────────────────────────────────────────────────

function getFloatKeyframes(phaseOffset: number) {
  const p = phaseOffset
  return {
    y: [0, -6 - Math.sin(p) * 3, -3 + Math.cos(p) * 2, 0],
    rotate: [0, Math.sin(p) * 0.6, Math.cos(p * 0.7) * 0.4, 0],
    transition: {
      duration: 5 + Math.sin(p) * 1.5,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'easeInOut',
      times: [0, 0.33, 0.66, 1],
    },
  }
}

// ─── Progress ring ────────────────────────────────────────────────────────

function ProgressRing({ progress, color, size = 20 }: { progress: number; color: string; size?: number }) {
  const r = (size - 4) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={2}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Node Component ───────────────────────────────────────────────────────

interface RoadmapNodeProps {
  node: RoadmapNodeType
  isSelected: boolean
  scale: number
  onSelect: (id: string) => void
  onOpenEditor?: (id: string) => void
  onMove: (id: string, position: { x: number; y: number }) => void
  onToggleExpand: (id: string) => void
  onAddChild: (parentId: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleComplete: (id: string) => void
  phaseOffset: number
}

export default function RoadmapNode({
  node,
  isSelected,
  scale,
  onSelect,
  onMove,
  onToggleExpand,
  onAddChild,
  onDelete,
  onDuplicate,
  onToggleComplete,
  onOpenEditor,
  phaseOffset,
}: RoadmapNodeProps) {
  const colorMap = NODE_COLOR_MAP[node.color] ?? NODE_COLOR_MAP.indigo
  const w = node.isRoot ? ROOT_W : CHILD_W
  const h = node.isRoot ? ROOT_H : CHILD_H

  const controls = useAnimationControls()
  const isDraggingRef = useRef(false)
  const dragStart = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number } | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  // Floating idle animation
  useEffect(() => {
    const kf = getFloatKeyframes(phaseOffset)
    let mounted = true

    // Small delay so nodes don't all start in sync
    const timeout = setTimeout(() => {
      if (mounted && !isDraggingRef.current) {
        controls.start(kf)
      }
    }, phaseOffset * 200)

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [controls, phaseOffset])

  // Stop float while dragging
  const stopFloat = useCallback(() => {
    controls.stop()
    controls.set({ y: 0, rotate: 0 })
  }, [controls])

  const resumeFloat = useCallback(() => {
    controls.start(getFloatKeyframes(phaseOffset))
  }, [controls, phaseOffset])
  // ── Ripple effect ──────────────────────────────────────────────────

  const triggerRipple = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setRipple({ x: rect.width / 2, y: rect.height / 2 })
    setTimeout(() => setRipple(null), 600)
  }, [])

  // ── Drag handlers ──────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-action]')) return

    e.stopPropagation()
    isDraggingRef.current = false
    stopFloat()

    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y,
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStart.current) return
      const dx = (moveEvent.clientX - dragStart.current.mouseX) / scale
      const dy = (moveEvent.clientY - dragStart.current.mouseY) / scale

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true
      }

      if (isDraggingRef.current) {
        onMove(node.id, {
          x: dragStart.current.nodeX + dx,
          y: dragStart.current.nodeY + dy,
        })
      }
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) {
        // It was a click, not a drag
        triggerRipple()
        onSelect(node.id)
      }
      isDraggingRef.current = false
      dragStart.current = null
      resumeFloat()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [node, scale, onMove, onSelect, stopFloat, resumeFloat, triggerRipple])


  // ── Glow intensity based on progress ──────────────────────────────

  const glowOpacity = 0.1 + (node.progress / 100) * 0.5
  const glowSize = 8 + (node.progress / 100) * 24

  // ── Keyboard delete ────────────────────────────────────────────────

  useEffect(() => {
    if (!isSelected) return
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        onDelete(node.id)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isSelected, node.id, onDelete])

  return (
    <motion.div
      animate={controls}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: w,
        height: h,
        zIndex: isSelected ? 100 : isHovered ? 50 : 10,
        willChange: 'transform',
      }}
      data-node={node.id}
    >
      {/* Glow aura — brightens with progress */}
      <div
        style={{
          position: 'absolute',
          inset: -glowSize,
          background: `radial-gradient(ellipse, ${colorMap.glow.replace('0.4', String(glowOpacity * 0.6))} 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
          transition: 'all 0.8s ease',
          filter: 'blur(8px)',
        }}
      />

      {/* Main node body */}
      <motion.div
        ref={nodeRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!isDraggingRef.current) onOpenEditor?.(node.id)
        }}
        onMouseEnter={() => { setIsHovered(true); setShowActions(true) }}
        onMouseLeave={() => { setIsHovered(false); setShowActions(false) }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: node.isRoot ? 16 : 12,
          background: isSelected
            ? `linear-gradient(135deg, ${colorMap.bg.replace('0.12', '0.22')}, ${colorMap.bg.replace('0.12', '0.14')})`
            : `linear-gradient(135deg, ${colorMap.bg}, rgba(26,32,53,0.4))`,
          border: `1px solid ${isSelected ? colorMap.border.replace('0.35', '0.7') : isHovered ? colorMap.border : 'rgba(255,255,255,0.07)'}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isSelected
            ? `0 0 0 2px ${colorMap.border}, 0 8px 32px rgba(0,0,0,0.5), 0 0 40px ${colorMap.glow.replace('0.4', '0.25')}`
            : isHovered
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${colorMap.glow.replace('0.4', '0.15')}`
            : '0 2px 16px rgba(0,0,0,0.35)',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
          userSelect: 'none',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Inner shimmer line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${colorMap.text.replace(')', ', 0.4)')}, transparent)`,
          opacity: isSelected ? 1 : 0.4,
        }} />

        {/* Ripple */}
        {ripple && (
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: colorMap.glow.replace('0.4)', '0.5)'),
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Node content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          padding: node.isRoot ? '0 12px' : '0 10px',
          gap: 8,
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Completion checkbox */}
          <motion.button
            data-action="complete"
            onClick={(e) => { e.stopPropagation(); onToggleComplete(node.id) }}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `1.5px solid ${node.completed ? colorMap.progress : 'rgba(255,255,255,0.2)'}`,
              background: node.completed ? colorMap.progress : 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            {node.completed && <Check size={10} color="white" strokeWidth={3} />}
          </motion.button>

          {/* Title */}
          <span style={{
            flex: 1,
            fontSize: node.isRoot ? 13 : 12,
            fontWeight: node.isRoot ? 600 : 500,
            color: node.completed
              ? colorMap.text
              : 'rgba(255,255,255,0.88)',
            letterSpacing: node.isRoot ? '-0.01em' : '0',
            textDecoration: node.completed ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecorationColor: colorMap.text + '80',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'color 0.2s',
          }}>
            {node.title}
          </span>

          {/* Progress ring */}
          {node.progress > 0 && !node.completed && (
            <ProgressRing progress={node.progress} color={colorMap.progress} size={18} />
          )}

          {/* Expand toggle for parent nodes */}
          {node.childIds.length > 0 && (
            <motion.button
              data-action="expand"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: 2,
                flexShrink: 0,
              }}
              whileHover={{ color: 'rgba(255,255,255,0.9)', scale: 1.1 }}
            >
              {node.isExpanded
                ? <ChevronDown size={12} />
                : <ChevronRight size={12} />
              }
            </motion.button>
          )}
        </div>

        {/* Progress bar at bottom */}
        {node.progress > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.06)',
          }}>
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${colorMap.progress}, ${colorMap.text})`,
                borderRadius: '0 0 0 0',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${node.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
      </motion.div>

      {/* Floating action buttons (on hover) */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: showActions ? 1 : 0, y: showActions ? -8 : -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'absolute',
          top: -36,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
          background: 'rgba(13,17,23,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '4px 6px',
          pointerEvents: showActions ? 'auto' : 'none',
          whiteSpace: 'nowrap',
          zIndex: 200,
        }}
      >
        {[
          { icon: Plus, action: () => onAddChild(node.id), label: 'Add child', color: '#10B981' },
          { icon: Copy, action: () => onDuplicate(node.id), label: 'Duplicate', color: '#6366F1' },
          { icon: Trash2, action: () => onDelete(node.id), label: 'Delete', color: '#EF4444' },
        ].map(({ icon: Icon, action, label, color }) => (
          <motion.button
            key={label}
            data-action={label}
            title={label}
            onClick={(e) => { e.stopPropagation(); action() }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
            }}
            whileHover={{ color, scale: 1.15, backgroundColor: color + '20' }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon size={11} />
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}



