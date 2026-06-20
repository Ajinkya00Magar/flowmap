'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid3X3 } from 'lucide-react'

interface CanvasControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onReset: () => void
  showGrid: boolean
  onToggleGrid: () => void
}

export default function CanvasControls({
  scale,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  showGrid,
  onToggleGrid,
}: CanvasControlsProps) {
  const buttons = [
    { icon: ZoomIn, onClick: onZoomIn, label: 'Zoom in' },
    { icon: ZoomOut, onClick: onZoomOut, label: 'Zoom out' },
    { icon: Maximize2, onClick: onFit, label: 'Fit to screen' },
    { icon: RotateCcw, onClick: onReset, label: 'Reset view' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 50,
      }}
    >
      {/* Scale indicator */}
      <div style={{
        background: 'rgba(13,17,23,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
        padding: '4px 10px',
        textAlign: 'center',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.02em',
      }}>
        {Math.round(scale * 100)}%
      </div>

      {/* Control buttons */}
      <div style={{
        background: 'rgba(13,17,23,0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {buttons.map(({ icon: Icon, onClick, label }, i) => (
          <motion.button
            key={label}
            title={label}
            onClick={onClick}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderBottom: i < buttons.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
            }}
            whileHover={{
              backgroundColor: 'rgba(99,102,241,0.15)',
              color: 'rgba(255,255,255,0.9)',
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon size={15} />
          </motion.button>
        ))}

        {/* Grid toggle */}
        <motion.button
          title="Toggle grid"
          onClick={onToggleGrid}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showGrid ? 'rgba(99,102,241,0.2)' : 'transparent',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            color: showGrid ? '#818CF8' : 'rgba(255,255,255,0.5)',
          }}
          whileHover={{
            backgroundColor: 'rgba(99,102,241,0.15)',
            color: 'rgba(255,255,255,0.9)',
          }}
          whileTap={{ scale: 0.9 }}
        >
          <Grid3X3 size={15} />
        </motion.button>
      </div>
    </motion.div>
  )
}
