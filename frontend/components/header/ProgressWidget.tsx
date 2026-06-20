'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useSpring } from 'framer-motion'

interface ProgressWidgetProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  sublabel?: string
  showNumber?: boolean
}

export default function ProgressWidget({
  progress,
  size = 64,
  strokeWidth = 4,
  color = '#6366F1',
  label,
  sublabel,
  showNumber = true,
}: ProgressWidgetProps) {
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  const spring = useSpring(0, { stiffness: 80, damping: 20 })

  useEffect(() => {
    spring.set(progress)
  }, [progress, spring])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Glow copy */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 2}
            strokeOpacity={0.15}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ filter: 'blur(3px)', transition: 'stroke-dashoffset 0.8s ease' }}
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Center number */}
        {showNumber && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <motion.span style={{
              fontSize: size > 48 ? 14 : 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1,
            }}>
              {Math.round(progress)}
              <span style={{ fontSize: size > 48 ? 9 : 7, opacity: 0.6 }}>%</span>
            </motion.span>
          </div>
        )}
      </div>

      {/* Text labels */}
      {(label || sublabel) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {label && (
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
