'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], label: 'Undo' },
  { keys: ['Ctrl', 'Y'], label: 'Redo' },
  { keys: ['Ctrl', 'S'], label: 'Save' },
  { keys: ['Del'], label: 'Delete selected node' },
  { keys: ['Esc'], label: 'Close panel / Deselect' },
  { keys: ['Scroll'], label: 'Zoom canvas' },
  { keys: ['Drag'], label: 'Pan canvas' },
  { keys: ['Dbl-click'], label: 'Add node at position' },
]

function KeyBadge({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 6px',
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 5,
      fontSize: 10,
      fontFamily: 'JetBrains Mono, monospace',
      color: 'rgba(255,255,255,0.65)',
      lineHeight: 1.4,
    }}>
      {text}
    </span>
  )
}

export default function FloatingToolbar() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 84,
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              background: 'rgba(8,13,24,0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 24px',
              width: 'min(320px, calc(100vw - 96px))',
              minWidth: 260,
              maxWidth: 320,
            }}
          >
            <div style={{
              gridColumn: '1 / -1',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 4,
            }}>
              Keyboard shortcuts
            </div>
            {SHORTCUTS.map(({ keys, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {keys.map(k => <KeyBadge key={k} text={k} />)}
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          background: open ? 'rgba(99,102,241,0.15)' : 'rgba(8,13,24,0.8)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10,
          color: open ? '#818CF8' : 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: 11,
        }}
        whileHover={{ color: '#818CF8', borderColor: 'rgba(99,102,241,0.3)' }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X size={12} /> : <Keyboard size={12} />}
        <span>{open ? 'Close' : 'Shortcuts'}</span>
      </motion.button>
    </div>
  )
}
