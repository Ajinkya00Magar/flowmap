'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, X } from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { NODE_COLOR_MAP } from '@/types/roadmap'
import type { CanvasTransform } from '@/types/roadmap'

const MINI_W = 180
const MINI_H = 120
const CANVAS_W = 5000
const CANVAS_H = 4000

interface MiniMapProps {
  transform: CanvasTransform
  viewportW: number
  viewportH: number
  onJump: (x: number, y: number) => void
}

export default function MiniMap({ transform, viewportW, viewportH, onJump }: MiniMapProps) {
  const { state } = useRoadmapContext()
  const [visible, setVisible] = useState(true)

  // Scale factor from canvas coords → minimap pixels
  const scaleX = MINI_W / CANVAS_W
  const scaleY = MINI_H / CANVAS_H

  // Viewport rectangle in canvas coords
  const vpLeft   = -transform.x / transform.scale
  const vpTop    = -transform.y / transform.scale
  const vpWidth  = viewportW / transform.scale
  const vpHeight = viewportH / transform.scale

  // Clamp to [0, 1]
  const vpRect = {
    left:   Math.max(0, vpLeft * scaleX),
    top:    Math.max(0, vpTop * scaleY),
    width:  Math.min(MINI_W, vpWidth * scaleX),
    height: Math.min(MINI_H, vpHeight * scaleY),
  }

  const visibleNodes = useMemo(() => {
    return state.rootIds.flatMap(rootId => {
      const root = state.nodes[rootId]
      if (!root) return []
      const allIds = [rootId, ...(root.isExpanded ? root.childIds : [])]
      return allIds.map(id => state.nodes[id]).filter(Boolean)
    })
  }, [state.nodes, state.rootIds])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / MINI_W  // 0..1
    const my = (e.clientY - rect.top) / MINI_H   // 0..1
    // Convert to canvas coords then to screen transform
    const canvasX = mx * CANVAS_W
    const canvasY = my * CANVAS_H
    onJump(canvasX, canvasY)
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      right: 24,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 4,
    }}>
      {/* Toggle button */}
      <motion.button
        onClick={() => setVisible(v => !v)}
        title="Toggle minimap"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: visible ? 'rgba(99,102,241,0.15)' : 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${visible ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
          color: visible ? '#818CF8' : 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <Map size={12} />
      </motion.button>

      {/* Minimap panel */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: MINI_W,
              height: MINI_H,
              background: 'rgba(5,8,16,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'crosshair',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            onClick={handleClick}
          >
            {/* Grid dots */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
              pointerEvents: 'none',
            }} />

            {/* Nodes as dots */}
            {visibleNodes.map(node => {
              if (!node) return null
              const colorMap = NODE_COLOR_MAP[node.color] ?? NODE_COLOR_MAP.indigo
              const x = node.position.x * scaleX
              const y = node.position.y * scaleY
              const isRoot = node.isRoot
              const size = isRoot ? 5 : 3

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: x - size / 2,
                    top: y - size / 2,
                    width: isRoot ? 8 : size,
                    height: isRoot ? 5 : size,
                    borderRadius: isRoot ? 2 : '50%',
                    background: node.completed ? colorMap.progress : colorMap.progress + '80',
                    boxShadow: node.completed
                      ? `0 0 4px ${colorMap.progress}`
                      : 'none',
                    opacity: state.selectedNodeId === node.id ? 1 : 0.7,
                    border: state.selectedNodeId === node.id
                      ? `1px solid ${colorMap.progress}`
                      : 'none',
                  }}
                />
              )
            })}

            {/* Viewport rectangle */}
            <div style={{
              position: 'absolute',
              left: vpRect.left,
              top: vpRect.top,
              width: vpRect.width,
              height: vpRect.height,
              border: '1px solid rgba(99,102,241,0.5)',
              background: 'rgba(99,102,241,0.06)',
              borderRadius: 2,
              pointerEvents: 'none',
            }} />

            {/* Label */}
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 6,
              fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
              fontFamily: 'JetBrains Mono, monospace',
              pointerEvents: 'none',
              letterSpacing: '0.04em',
            }}>
              {Math.round(transform.scale * 100)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
