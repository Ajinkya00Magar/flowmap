'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import type { RoadmapState } from '@/types/roadmap'
import { getVisibleConnections } from '@/lib/roadmapUtils'
import { NODE_COLOR_MAP } from '@/types/roadmap'

// ─── Node dimensions ──────────────────────────────────────────────────────

const ROOT_W = 176
const ROOT_H = 64
const CHILD_W = 148
const CHILD_H = 48

function getNodeCenter(node: { position: { x: number; y: number }; isRoot: boolean }) {
  const w = node.isRoot ? ROOT_W : CHILD_W
  const h = node.isRoot ? ROOT_H : CHILD_H
  return {
    cx: node.position.x + w / 2,
    cy: node.position.y + h / 2,
  }
}

// ─── Animated bezier path generator ──────────────────────────────────────

function getBezierPath(
  x1: number, y1: number,
  x2: number, y2: number,
  tick: number,
  index: number
): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Animated control point drift (water-like)
  const phase = (tick * 0.001 + index * 0.7) % (Math.PI * 2)
  const amplitude = Math.min(dist * 0.15, 40)
  const drift = Math.sin(phase) * amplitude

  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  // Perpendicular offset for control point
  const perpX = -dy / dist
  const perpY = dx / dist

  const cpx = mx + perpX * drift
  const cpy = my + perpY * drift

  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`
}

// ─── Single connection line ───────────────────────────────────────────────

interface ConnectionLineProps {
  sourceNode: { position: { x: number; y: number }; isRoot: boolean; color: string; completed: boolean }
  targetNode: { position: { x: number; y: number }; isRoot: boolean; color: string; completed: boolean }
  tick: number
  index: number
  isSelected: boolean
}

function ConnectionLine({ sourceNode, targetNode, tick, index, isSelected }: ConnectionLineProps) {
  const { cx: x1, cy: y1 } = getNodeCenter(sourceNode as any)
  const { cx: x2, cy: y2 } = getNodeCenter(targetNode as any)
  const path = getBezierPath(x1, y1, x2, y2, tick, index)

  const colorMap = NODE_COLOR_MAP[sourceNode.color as keyof typeof NODE_COLOR_MAP] ?? NODE_COLOR_MAP.indigo
  const strokeColor = sourceNode.completed ? colorMap.progress : colorMap.glow.replace('0.4', '0.3')
  const strokeWidth = isSelected ? 2.5 : sourceNode.isRoot ? 1.8 : 1.2
  const opacity = isSelected ? 1 : sourceNode.completed ? 0.7 : 0.35

  return (
    <g>
      {/* Glow copy (behind) */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 3}
        strokeOpacity={opacity * 0.15}
        strokeLinecap="round"
      />
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeDasharray={sourceNode.completed ? 'none' : '0'}
      />
      {/* Animated flow particle when completed */}
      {sourceNode.completed && (
        <circle r="3" fill={colorMap.progress} opacity="0.8">
          <animateMotion
            dur={`${2.5 + index * 0.4}s`}
            repeatCount="indefinite"
            path={path}
          />
        </circle>
      )}
    </g>
  )
}

// ─── Main ConnectionLines component ──────────────────────────────────────

interface ConnectionLinesProps {
  state: RoadmapState
  selectedNodeId: string | null
  canvasWidth?: number
  canvasHeight?: number
}

export default function ConnectionLines({
  state,
  selectedNodeId,
  canvasWidth = 4000,
  canvasHeight = 3000,
}: ConnectionLinesProps) {
  const tickRef = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number | null>(null)
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map())

  const connections = useMemo(() => getVisibleConnections(state), [state])

  // Animation loop — updates path `d` attributes directly for performance
  useEffect(() => {
    function animate(timestamp: number) {
      tickRef.current = timestamp

      connections.forEach((conn, index) => {
        const source = state.nodes[conn.sourceId]
        const target = state.nodes[conn.targetId]
        if (!source || !target) return

        const pathEl = pathRefs.current.get(conn.id + '_main')
        const glowEl = pathRefs.current.get(conn.id + '_glow')

        if (!pathEl && !glowEl) return

        let { cx: x1, cy: y1 } = getNodeCenter(source)
        let { cx: x2, cy: y2 } = getNodeCenter(target)

        // Sync with Framer Motion live transform values
        const sourceEl = document.getElementById(`node-wrapper-${source.id}`)
        if (sourceEl) {
          const matchX = sourceEl.style.transform.match(/translateX\(([-\d.]+)px\)/)
          const matchY = sourceEl.style.transform.match(/translateY\(([-\d.]+)px\)/)
          if (matchX) x1 += parseFloat(matchX[1])
          if (matchY) y1 += parseFloat(matchY[1])
        }

        const targetEl = document.getElementById(`node-wrapper-${target.id}`)
        if (targetEl) {
          const matchX = targetEl.style.transform.match(/translateX\(([-\d.]+)px\)/)
          const matchY = targetEl.style.transform.match(/translateY\(([-\d.]+)px\)/)
          if (matchX) x2 += parseFloat(matchX[1])
          if (matchY) y2 += parseFloat(matchY[1])
        }

        const d = getBezierPath(x1, y1, x2, y2, timestamp, index)

        if (pathEl) pathEl.setAttribute('d', d)
        if (glowEl) glowEl.setAttribute('d', d)
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [connections, state.nodes])

  if (connections.length === 0) return null

  return (
    <svg
      ref={svgRef}
      className="connection-svg"
      width={canvasWidth}
      height={canvasHeight}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        {/* Animated glow filter for selected connections */}
        <filter id="conn-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map((conn, index) => {
        const source = state.nodes[conn.sourceId]
        const target = state.nodes[conn.targetId]
        if (!source || !target) return null

        const isSelected =
          conn.sourceId === selectedNodeId || conn.targetId === selectedNodeId

        const { cx: x1, cy: y1 } = getNodeCenter(source)
        const { cx: x2, cy: y2 } = getNodeCenter(target)
        const initialPath = getBezierPath(x1, y1, x2, y2, 0, index)

        const colorMap = NODE_COLOR_MAP[source.color as keyof typeof NODE_COLOR_MAP] ?? NODE_COLOR_MAP.indigo
        const strokeColor = source.completed ? colorMap.progress : colorMap.progress
        const strokeWidth = isSelected ? 2.5 : source.isRoot ? 1.8 : 1.2
        const opacity = isSelected ? 0.9 : source.completed ? 0.65 : 0.3

        return (
          <g key={conn.id} filter={isSelected ? 'url(#conn-glow)' : undefined}>
            {/* Glow layer */}
            <path
              ref={el => {
                if (el) pathRefs.current.set(conn.id + '_glow', el)
                else pathRefs.current.delete(conn.id + '_glow')
              }}
              d={initialPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 4}
              strokeOpacity={opacity * 0.12}
              strokeLinecap="round"
            />
            {/* Main connection */}
            <path
              ref={el => {
                if (el) pathRefs.current.set(conn.id + '_main', el)
                else pathRefs.current.delete(conn.id + '_main')
              }}
              d={initialPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
            {/* Flow particle on completed connections */}
            {source.completed && (
              <circle r={isSelected ? 4 : 3} fill={strokeColor} opacity="0.85">
                <animateMotion
                  dur={`${2.5 + index * 0.3}s`}
                  repeatCount="indefinite"
                  path={initialPath}
                />
              </circle>
            )}
          </g>
        )
      })}
    </svg>
  )
}
