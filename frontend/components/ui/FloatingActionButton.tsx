'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderPlus, GitBranch, X } from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { createNode } from '@/lib/roadmapUtils'
import { NODE_COLOR_MAP } from '@/types/roadmap'

const COLORS = ['indigo', 'emerald', 'cyan', 'amber', 'rose', 'violet'] as const

export default function FloatingActionButton() {
  const { state, dispatch } = useRoadmapContext()
  const [open, setOpen] = useState(false)
  const [colorIdx, setColorIdx] = useState(0)

  const handleAddCategory = () => {
    const color = COLORS[colorIdx % COLORS.length]
    const rootCount = state.rootIds.length
    const newNode = createNode(
      null,
      { x: 200 + rootCount * 220, y: 100 },
      color,
      'New Category'
    )
    dispatch({ type: 'ADD_NODE', payload: newNode })
    dispatch({ type: 'SELECT_NODE', payload: newNode.id })
    setColorIdx(c => c + 1)
    setOpen(false)
  }

  const handleAddChildToSelected = () => {
    const selectedId = state.selectedNodeId
    if (!selectedId) return
    const parent = state.nodes[selectedId]
    if (!parent) return

    const newNode = createNode(
      selectedId,
      {
        x: parent.position.x + 180 + Math.random() * 60,
        y: parent.position.y + 80,
      },
      parent.color,
      'New Topic'
    )
    dispatch({ type: 'ADD_NODE', payload: newNode })
    dispatch({ type: 'SELECT_NODE', payload: newNode.id })
    setOpen(false)
  }

  const actions = [
    {
      icon: FolderPlus,
      label: 'Add Category',
      color: '#6366F1',
      onClick: handleAddCategory,
    },
    {
      icon: GitBranch,
      label: 'Add Child Node',
      color: '#10B981',
      onClick: handleAddChildToSelected,
      disabled: !state.selectedNodeId,
    },
  ]

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 24,
      zIndex: 150,
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      {/* Action items */}
      <AnimatePresence>
        {open && actions.map(({ icon: Icon, label, color, onClick, disabled }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: disabled ? 0.4 : 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, delay: i * 0.06 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            {/* Label */}
            <motion.span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                background: 'rgba(8,13,24,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '5px 10px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {label}
              {disabled && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>(select a node first)</span>}
            </motion.span>

            {/* Button */}
            <motion.button
              onClick={disabled ? undefined : onClick}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: disabled ? 'rgba(255,255,255,0.05)' : `${color}25`,
                border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : color + '55'}`,
                color: disabled ? 'rgba(255,255,255,0.3)' : color,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: disabled ? 'none' : `0 4px 16px ${color}30`,
              }}
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.92 } : {}}
            >
              <Icon size={16} />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: open
            ? 'rgba(239,68,68,0.15)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(129,140,248,0.6))',
          border: open
            ? '1px solid rgba(239,68,68,0.3)'
            : '1px solid rgba(99,102,241,0.5)',
          color: open ? '#EF4444' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: open
            ? 'none'
            : '0 4px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.2)',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {open ? <X size={20} /> : <Plus size={20} />}
      </motion.button>
    </div>
  )
}
