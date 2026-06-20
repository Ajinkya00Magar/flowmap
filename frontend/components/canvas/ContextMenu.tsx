'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Copy, Trash2, Check, ChevronRight,
  ChevronDown, Edit3, ExternalLink
} from 'lucide-react'
import type { RoadmapNode } from '@/types/roadmap'
import { NODE_COLOR_MAP } from '@/types/roadmap'

export interface ContextMenuState {
  x: number
  y: number
  nodeId: string
}

interface ContextMenuProps {
  menu: ContextMenuState | null
  node: RoadmapNode | null
  onClose: () => void
  onSelect: (id: string) => void
  onOpenEditor: (id: string) => void
  onAddChild: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggleComplete: (id: string) => void
  onToggleExpand: (id: string) => void
  onStartConnect: (id: string) => void
}

interface MenuItem {
  icon: React.ReactNode
  label: string
  shortcut?: string
  action: () => void
  danger?: boolean
  divider?: boolean
}

export default function ContextMenu({
  menu,
  node,
  onClose,
  onSelect,
  onOpenEditor,
  onAddChild,
  onDuplicate,
  onDelete,
  onToggleComplete,
  onToggleExpand,
  onStartConnect,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!menu) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [menu, onClose])

  if (!node) return null

  const colorMap = NODE_COLOR_MAP[node.color] ?? NODE_COLOR_MAP.indigo

  const items: MenuItem[] = [
    {
      icon: <Edit3 size={13} />,
      label: 'Open editor',
      shortcut: 'Click',
      action: () => { onOpenEditor(node.id); onClose() },
    },
    {
      icon: <Plus size={13} />,
      label: 'Add child node',
      shortcut: 'Hover → +',
      action: () => { onAddChild(node.id); onClose() },
      divider: true,
    },
    {
      icon: node.completed ? <Check size={13} /> : <Check size={13} />,
      label: node.completed ? 'Mark incomplete' : 'Mark complete',
      action: () => { onToggleComplete(node.id); onClose() },
    },
    ...(node.childIds.length > 0 ? [{
      icon: node.isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />,
      label: node.isExpanded ? 'Collapse children' : 'Expand children',
      action: () => { onToggleExpand(node.id); onClose() },
      divider: true,
    }] : [{ icon: null, label: '', action: () => {}, divider: true } as MenuItem]),
    {
      icon: <Plus size={13} />,
      label: 'Connect to another node',
      shortcut: 'Click target',
      action: () => { onStartConnect(node.id); onClose() },
      divider: true,
    },
    {
      icon: <Copy size={13} />,
      label: 'Duplicate node',
      shortcut: 'Ctrl+D',
      action: () => { onDuplicate(node.id); onClose() },
    },
    {
      icon: <Trash2 size={13} />,
      label: node.childIds.length > 0
        ? `Delete node + ${node.childIds.length} children`
        : 'Delete node',
      shortcut: 'Del',
      action: () => { onDelete(node.id); onClose() },
      danger: true,
    },
  ]

  // Adjust position to stay on screen
  const adjustedX = Math.min(menu?.x ?? 0, window.innerWidth - 220)
  const adjustedY = Math.min(menu?.y ?? 0, window.innerHeight - items.length * 38 - 20)

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          ref={ref}
          key="context-menu"
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            left: adjustedX,
            top: adjustedY,
            zIndex: 800,
            background: 'rgba(8,13,24,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12,
            padding: '6px',
            minWidth: 210,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            userSelect: 'none',
          }}
        >
          {/* Node title header */}
          <div style={{
            padding: '6px 10px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colorMap.progress,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.75)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {node.title}
              </span>
            </div>
            <div style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
              marginTop: 2,
              paddingLeft: 14,
            }}>
              {node.progress}% complete
              {node.estimatedHours > 0 && ` · ${node.estimatedHours}h est.`}
            </div>
          </div>

          {/* Menu items */}
          {items.map((item, i) => {
            if (item.divider && !item.label) {
              return <div key={`div-${i}`} style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            }

            return (
              <React.Fragment key={item.label}>
                {item.divider && item.label && (
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                )}
                <motion.button
                  onClick={item.action}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 7,
                    cursor: 'pointer',
                    color: item.danger ? '#EF4444' : 'rgba(255,255,255,0.72)',
                    fontSize: 13,
                    textAlign: 'left',
                  }}
                  whileHover={{
                    background: item.danger
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(255,255,255,0.06)',
                    color: item.danger ? '#FCA5A5' : 'rgba(255,255,255,0.95)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.shortcut && (
                    <span style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'JetBrains Mono, monospace',
                      flexShrink: 0,
                    }}>
                      {item.shortcut}
                    </span>
                  )}
                </motion.button>
              </React.Fragment>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
