'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Search, Undo2, Redo2 } from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'

interface TopBarProps {
  title: string
  subtitle?: string
  onOpenSearch: () => void
  actions?: React.ReactNode
}

const btnStyle: React.CSSProperties = {
  width: 32, height: 32,
  borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.45)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}

export default function TopBar({ title, subtitle, onOpenSearch, actions }: TopBarProps) {
  const { undo, redo, canUndo, canRedo } = useRoadmapContext()

  return (
    <motion.div
      className="flowmap-topbar"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      style={{
        height: 56,
        background: 'rgba(5,8,16,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Title */}
      <div className="flowmap-topbar-title" style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          margin: 0, fontSize: 15, fontWeight: 700,
          color: 'rgba(255,255,255,0.88)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Custom actions slot */}
      {actions}

      {/* Undo / Redo */}
      <div className="flowmap-topbar-history" style={{ display: 'flex', gap: 4 }}>
        <motion.button
          onClick={undo} disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{ ...btnStyle, opacity: canUndo ? 1 : 0.3 }}
          whileHover={canUndo ? { background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)' } : {}}
          whileTap={canUndo ? { scale: 0.92 } : {}}
        >
          <Undo2 size={14} />
        </motion.button>
        <motion.button
          onClick={redo} disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{ ...btnStyle, opacity: canRedo ? 1 : 0.3 }}
          whileHover={canRedo ? { background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)' } : {}}
          whileTap={canRedo ? { scale: 0.92 } : {}}
        >
          <Redo2 size={14} />
        </motion.button>
      </div>

      {/* Search */}
      <motion.button
        onClick={onOpenSearch}
        title="Search (Ctrl+K)"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 9,
          color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer', fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        }}
        whileHover={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.25)', color: '#818CF8' }}
        whileTap={{ scale: 0.97 }}
      >
        <Search size={13} />
        <span className="flowmap-search-label">Search</span>
        <kbd className="flowmap-search-kbd" style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4, padding: '1px 5px', fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.3)',
        }}>
          ⌘K
        </kbd>
      </motion.button>
    </motion.div>
  )
}
