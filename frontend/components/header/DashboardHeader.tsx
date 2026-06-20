'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, CheckCircle2, Circle, Target, Zap,
  ChevronDown, ChevronUp, Download, Upload, RotateCcw,
  Undo2, Redo2, Map, Search
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import ProgressWidget from './ProgressWidget'
import { NODE_COLOR_MAP } from '@/types/roadmap'

// ─── Stat pill ─────────────────────────────────────────────────────────────

function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  color?: string
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '6px 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      flexShrink: 0,
    }}>
      <span style={{ color: color ?? 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.2,
        }}>
          {value}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
    </div>
  )
}

// ─── Import file input ref helper ─────────────────────────────────────────

function ImportButton({ onImport }: { onImport: (file: File) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onImport(file)
          e.target.value = ''
        }}
      />
      <motion.button
        title="Import roadmap JSON"
        onClick={() => inputRef.current?.click()}
        style={toolBtnStyle}
        whileHover={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
        whileTap={{ scale: 0.93 }}
      >
        <Upload size={13} />
      </motion.button>
    </>
  )
}

const toolBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.45)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

// ─── DashboardHeader ──────────────────────────────────────────────────────

interface DashboardHeaderProps {
  onOpenSearch?: () => void
}

export default function DashboardHeader({ onOpenSearch }: DashboardHeaderProps) {
  const { stats, state, dispatch, undo, redo, canUndo, canRedo, exportJSON, importJSON, resetToDefault } = useRoadmapContext()
  const [expanded, setExpanded] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleReset = () => {
    if (confirmReset) {
      resetToDefault()
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 3000)
    }
  }

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.2 }}
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        maxWidth: '95vw',
      }}
    >
      {/* Main header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: 'rgba(8,13,24,0.88)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: expanded ? '16px 16px 0 0' : 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'border-radius 0.2s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Map size={16} color="#818CF8" />
          </motion.div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #818CF8, #10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            FlowMap
          </span>
        </div>

        {/* Overall progress ring */}
        <ProgressWidget
          progress={stats.overallProgress}
          size={40}
          strokeWidth={3}
          color="#6366F1"
          showNumber
        />

        {/* Stat pills */}
        <StatPill
          icon={<Flame size={13} />}
          value={stats.streak}
          label="streak"
          color="#F59E0B"
        />
        <StatPill
          icon={<CheckCircle2 size={13} />}
          value={stats.completedNodes}
          label="done"
          color="#10B981"
        />
        <StatPill
          icon={<Circle size={13} />}
          value={stats.totalNodes - stats.completedNodes}
          label="left"
          color="rgba(255,255,255,0.3)"
        />

        {/* Current focus */}
        {stats.currentFocus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8,
            flexShrink: 0,
          }}>
            <Zap size={11} color="#818CF8" />
            <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 500 }}>
              {stats.currentFocus}
            </span>
          </div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

        {/* Tool buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <motion.button
            title="Search (Ctrl+K)"
            onClick={onOpenSearch}
            style={toolBtnStyle}
            whileHover={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
            whileTap={{ scale: 0.93 }}
          >
            <Search size={13} />
          </motion.button>
          <motion.button
            title="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={!canUndo}
            style={{ ...toolBtnStyle, opacity: canUndo ? 1 : 0.3 }}
            whileHover={canUndo ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' } : {}}
            whileTap={canUndo ? { scale: 0.93 } : {}}
          >
            <Undo2 size={13} />
          </motion.button>
          <motion.button
            title="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={!canRedo}
            style={{ ...toolBtnStyle, opacity: canRedo ? 1 : 0.3 }}
            whileHover={canRedo ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' } : {}}
            whileTap={canRedo ? { scale: 0.93 } : {}}
          >
            <Redo2 size={13} />
          </motion.button>
          <motion.button
            title="Export JSON"
            onClick={exportJSON}
            style={toolBtnStyle}
            whileHover={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
            whileTap={{ scale: 0.93 }}
          >
            <Download size={13} />
          </motion.button>
          <ImportButton onImport={importJSON} />
          <motion.button
            title={confirmReset ? 'Confirm reset?' : 'Reset to default roadmap'}
            onClick={handleReset}
            style={{
              ...toolBtnStyle,
              background: confirmReset ? 'rgba(239,68,68,0.15)' : toolBtnStyle.background,
              borderColor: confirmReset ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)',
              color: confirmReset ? '#EF4444' : 'rgba(255,255,255,0.45)',
            }}
            whileHover={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
            whileTap={{ scale: 0.93 }}
          >
            <RotateCcw size={13} />
          </motion.button>
        </div>

        {/* Expand toggle */}
        <motion.button
          onClick={() => setExpanded(v => !v)}
          style={{
            ...toolBtnStyle,
            background: expanded ? 'rgba(99,102,241,0.15)' : toolBtnStyle.background,
            color: expanded ? '#818CF8' : 'rgba(255,255,255,0.45)',
          }}
          whileHover={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
          whileTap={{ scale: 0.93 }}
          title="Toggle detailed view"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </motion.button>
      </div>

      {/* Expanded category breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{ overflow: 'hidden', width: '100%' }}
          >
            <div style={{
              padding: '14px 16px',
              background: 'rgba(8,13,24,0.92)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {state.rootIds.map(rootId => {
                const root = state.nodes[rootId]
                if (!root) return null
                const colorMap = NODE_COLOR_MAP[root.color]

                return (
                  <ProgressWidget
                    key={rootId}
                    progress={root.progress}
                    size={44}
                    strokeWidth={3}
                    color={colorMap.progress}
                    label={root.title}
                    sublabel={`${root.childIds.length} topics`}
                    showNumber
                  />
                )
              })}

              {/* Today's completed */}
              {stats.todayCompleted > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 10,
                    alignSelf: 'center',
                  }}
                >
                  <Flame size={13} color="#10B981" />
                  <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
                    {stats.todayCompleted} completed today
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
