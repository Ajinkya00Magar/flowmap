'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle2, Circle, ChevronRight, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { NODE_COLOR_MAP } from '@/types/roadmap'
import type { RoadmapNode } from '@/types/roadmap'

// ─── Search result item ───────────────────────────────────────────────────

interface SearchResult {
  node: RoadmapNode
  breadcrumb: string[]
  matchScore: number
}

function getResults(
  query: string,
  nodes: Record<string, RoadmapNode>
): SearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase()

  return Object.values(nodes)
    .map(node => {
      const titleMatch = node.title.toLowerCase().includes(q)
      const descMatch = node.description.toLowerCase().includes(q)
      const noteMatch = node.notes.toLowerCase().includes(q)

      if (!titleMatch && !descMatch && !noteMatch) return null

      // Build breadcrumb
      const breadcrumb: string[] = []
      let current: RoadmapNode | undefined = node
      while (current?.parentId) {
        const parent: RoadmapNode | undefined = nodes[current.parentId]
        if (parent) breadcrumb.unshift(parent.title)
        current = parent
      }

      const matchScore =
        (titleMatch ? 10 : 0) +
        (node.title.toLowerCase().startsWith(q) ? 5 : 0) +
        (descMatch ? 2 : 0) +
        (noteMatch ? 1 : 0)

      return { node, breadcrumb, matchScore }
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12)
}

// ─── Single result row ────────────────────────────────────────────────────

function ResultRow({
  result,
  isActive,
  onClick,
}: {
  result: SearchResult
  isActive: boolean
  onClick: () => void
}) {
  const { node, breadcrumb } = result
  const colorMap = NODE_COLOR_MAP[node.color] ?? NODE_COLOR_MAP.indigo
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [isActive])

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      initial={false}
      animate={{
        background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        cursor: 'pointer',
        borderRadius: 8,
        margin: '0 6px',
        borderLeft: isActive ? `2px solid ${colorMap.progress}` : '2px solid transparent',
        transition: 'border-color 0.15s',
      }}
      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Color dot */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colorMap.progress,
        flexShrink: 0,
        boxShadow: `0 0 6px ${colorMap.progress}`,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{crumb}</span>
                {i < breadcrumb.length - 1 && (
                  <ChevronRight size={9} color="rgba(255,255,255,0.2)" />
                )}
              </React.Fragment>
            ))}
            <ChevronRight size={9} color="rgba(255,255,255,0.2)" />
          </div>
        )}

        {/* Title */}
        <span style={{
          fontSize: 14,
          fontWeight: 500,
          color: node.completed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)',
          textDecoration: node.completed ? 'line-through' : 'none',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.title}
        </span>

        {/* Description snippet */}
        {node.description && (
          <span style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: 1,
          }}>
            {node.description}
          </span>
        )}
      </div>

      {/* Status icon */}
      <span style={{ flexShrink: 0, color: node.completed ? '#10B981' : 'rgba(255,255,255,0.2)' }}>
        {node.completed
          ? <CheckCircle2 size={14} />
          : <Circle size={14} />
        }
      </span>

      {/* Active indicator */}
      {isActive && (
        <CornerDownLeft size={12} color="rgba(255,255,255,0.35)" />
      )}
    </motion.div>
  )
}

// ─── Spotlight ────────────────────────────────────────────────────────────

interface SpotlightProps {
  open: boolean
  onClose: () => void
}

export default function Spotlight({ open, onClose }: SpotlightProps) {
  const { state, dispatch } = useRoadmapContext()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(
    () => getResults(query, state.nodes),
    [query, state.nodes]
  )

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset active index when results change
  useEffect(() => setActiveIndex(0), [results])

  const selectResult = useCallback((result: SearchResult) => {
    dispatch({ type: 'SELECT_NODE', payload: result.node.id })
    onClose()
  }, [dispatch, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[activeIndex]) {
        selectResult(results[activeIndex])
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, results, activeIndex, selectResult, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="spotlight-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              background: 'rgba(3,6,8,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Dialog */}
          <motion.div
            key="spotlight-dialog"
            initial={{ opacity: 0, y: -32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{
              position: 'fixed',
              top: '20vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 560,
              maxWidth: '90vw',
              zIndex: 600,
              background: 'rgba(8,13,24,0.97)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderBottom: results.length > 0
                ? '1px solid rgba(255,255,255,0.06)'
                : 'none',
            }}>
              <Search size={16} color="rgba(99,102,241,0.7)" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search nodes, topics, skills..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.88)',
                  fontFamily: 'Inter, sans-serif',
                  caretColor: '#6366F1',
                }}
              />
              {query && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setQuery('')}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: 5,
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: 10,
                  }}
                >
                  clear
                </motion.button>
              )}
              <kbd style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 5,
                color: 'rgba(255,255,255,0.35)',
                fontSize: 11,
                padding: '2px 6px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Esc
              </kbd>
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
              {results.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    maxHeight: 380,
                    overflowY: 'auto',
                    padding: '8px 0',
                  }}
                >
                  {results.map((result, i) => (
                    <ResultRow
                      key={result.node.id}
                      result={result}
                      isActive={i === activeIndex}
                      onClick={() => selectResult(result)}
                    />
                  ))}
                </motion.div>
              ) : query.length > 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 14,
                  }}
                >
                  No results for {`"${query}"`}
                </motion.div>
              ) : (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Quick actions
                  </span>
                  {[
                    { label: 'Search by topic name', example: 'e.g. "React"' },
                    { label: 'Search by description', example: 'e.g. "graph algorithms"' },
                    { label: 'Search your notes', example: 'e.g. "important"' },
                  ].map(({ label, example }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>{example}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer hints */}
            {results.length > 0 && (
              <div style={{
                padding: '8px 18px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: 16,
                alignItems: 'center',
              }}>
                {[
                  { icons: [<ArrowUp size={10} key="up" />, <ArrowDown size={10} key="down" />], label: 'Navigate' },
                  { icons: [<CornerDownLeft size={10} key="corner" />], label: 'Select' },
                  { icons: ['Esc'], label: 'Close' },
                ].map(({ icons, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {icons.map((icon, i) => (
                      <kbd key={`${label}-${i}`} style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 4,
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: 10,
                        padding: '2px 5px',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {icon}
                      </kbd>
                    ))}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{label}</span>
                  </div>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
