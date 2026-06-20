'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, Circle, Flag
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { NODE_COLOR_MAP, PRIORITY_MAP } from '@/types/roadmap'
import type { RoadmapNode } from '@/types/roadmap'

// ─── Helpers ──────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const now  = new Date(); now.setHours(0,0,0,0)
  const date = new Date(dateStr); date.setHours(0,0,0,0)
  return Math.ceil((date.getTime() - now.getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function deadlineColor(days: number): string {
  if (days < 0)  return '#EF4444'
  if (days <= 3) return '#F97316'
  if (days <= 7) return '#F59E0B'
  return '#10B981'
}

function deadlineLabel(days: number): string {
  if (days < 0)  return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d left`
}

// ─── Timeline item ────────────────────────────────────────────────────────

function TimelineItem({
  node, days, onSelect,
}: { node: RoadmapNode; days: number; onSelect: (id: string) => void }) {
  const colorMap = NODE_COLOR_MAP[node.color]
  const urgColor = deadlineColor(days)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      onClick={() => onSelect(node.id)}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 0,
        cursor: 'pointer',
      }}
    >
      {/* Timeline spine dot */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginRight: 16, flexShrink: 0,
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: node.completed ? '#10B981' : urgColor,
          boxShadow: `0 0 8px ${node.completed ? '#10B98166' : urgColor + '66'}`,
          border: '2px solid rgba(5,8,16,1)',
          marginTop: 14,
        }} />
        <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.06)', minHeight: 16 }} />
      </div>

      {/* Card */}
      <motion.div
        style={{
          flex: 1,
          background: 'rgba(13,17,23,0.7)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${node.completed ? 'rgba(16,185,129,0.15)' : days < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
          borderLeft: `3px solid ${node.completed ? '#10B981' : urgColor}`,
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 10,
        }}
        whileHover={{ background: 'rgba(20,26,40,0.8)', scale: 1.005 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* Status icon */}
          <span style={{ color: node.completed ? '#10B981' : 'rgba(255,255,255,0.25)', marginTop: 1, flexShrink: 0 }}>
            {node.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: node.completed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)',
                textDecoration: node.completed ? 'line-through' : 'none',
              }}>
                {node.title}
              </span>
              {/* Priority badge */}
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: '2px 6px', borderRadius: 4,
                background: `${PRIORITY_MAP[node.priority].color}20`,
                color: PRIORITY_MAP[node.priority].color,
                textTransform: 'capitalize',
              }}>
                {node.priority}
              </span>
            </div>

            {/* Parent breadcrumb */}
            {node.parentId && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {/* We don't have access to state here inline, but parent color dot works */}
                <span style={{ color: colorMap.progress }}>●</span>
                {' Category node'}
              </div>
            )}

            {node.description && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.5 }}>
                {node.description.slice(0, 100)}{node.description.length > 100 ? '…' : ''}
              </div>
            )}
          </div>

          {/* Right side — date + urgency */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: urgColor }}>
              {deadlineLabel(days)}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatDate(node.deadline!)}
            </span>
            {node.estimatedHours > 0 && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={10} /> {node.estimatedHours}h
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {node.progress > 0 && !node.completed && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Progress</span>
              <span style={{ fontSize: 10, color: colorMap.progress, fontFamily: 'JetBrains Mono, monospace' }}>{node.progress}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${node.progress}%` }}
                transition={{ duration: 0.8 }}
                style={{ height: '100%', background: colorMap.progress, borderRadius: 9999 }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Mini calendar ─────────────────────────────────────────────────────────

function MiniCalendar({
  deadlineDates,
  selectedMonth,
  onChangeMonth,
}: {
  deadlineDates: Set<string>
  selectedMonth: Date
  onChangeMonth: (d: Date) => void
}) {
  const year  = selectedMonth.getFullYear()
  const month = selectedMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{
      background: 'rgba(13,17,23,0.7)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: 16,
    }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <motion.button
          onClick={() => onChangeMonth(new Date(year, month - 1, 1))}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
        >
          <ChevronLeft size={14} />
        </motion.button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <motion.button
          onClick={() => onChangeMonth(new Date(year, month + 1, 1))}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
        >
          <ChevronRight size={14} />
        </motion.button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const hasDeadline = deadlineDates.has(dateStr)
          const isToday = dateStr === todayStr
          return (
            <motion.div
              key={dateStr}
              style={{
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6,
                fontSize: 11,
                background: isToday ? 'rgba(99,102,241,0.2)'
                          : hasDeadline ? 'rgba(245,158,11,0.12)'
                          : 'transparent',
                border: isToday ? '1px solid rgba(99,102,241,0.4)'
                       : hasDeadline ? '1px solid rgba(245,158,11,0.3)'
                       : '1px solid transparent',
                color: isToday ? '#818CF8'
                     : hasDeadline ? '#FCD34D'
                     : 'rgba(255,255,255,0.45)',
                position: 'relative',
                cursor: hasDeadline ? 'pointer' : 'default',
                fontWeight: isToday || hasDeadline ? 600 : 400,
              }}
              whileHover={hasDeadline ? { scale: 1.15 } : {}}
            >
              {day}
              {hasDeadline && (
                <div style={{
                  position: 'absolute', bottom: 2, width: 4, height: 4,
                  borderRadius: '50%', background: '#F59E0B',
                }} />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TimelineView ─────────────────────────────────────────────────────────

const FILTERS = ['all', 'overdue', 'this week', 'upcoming', 'completed'] as const
type Filter = typeof FILTERS[number]

export default function TimelineView() {
  const { state, dispatch } = useRoadmapContext()
  const [filter, setFilter]         = useState<Filter>('all')
  const [calMonth, setCalMonth]     = useState(new Date())

  const nodesWithDeadlines = useMemo(() => {
    return Object.values(state.nodes)
      .filter(n => n.deadline)
      .map(n => ({ node: n, days: daysUntil(n.deadline!) }))
      .sort((a, b) => a.days - b.days)
  }, [state.nodes])

  const deadlineDates = useMemo(() => {
    const s = new Set<string>()
    nodesWithDeadlines.forEach(({ node }) => { if (node.deadline) s.add(node.deadline) })
    return s
  }, [nodesWithDeadlines])

  const filtered = useMemo(() => {
    return nodesWithDeadlines.filter(({ node, days }) => {
      switch (filter) {
        case 'overdue':    return days < 0 && !node.completed
        case 'this week':  return days >= 0 && days <= 7 && !node.completed
        case 'upcoming':   return days > 7 && !node.completed
        case 'completed':  return node.completed
        default:           return true
      }
    })
  }, [nodesWithDeadlines, filter])

  const overdueCnt   = nodesWithDeadlines.filter(({ days, node }) => days < 0 && !node.completed).length
  const thisWeekCnt  = nodesWithDeadlines.filter(({ days, node }) => days >= 0 && days <= 7 && !node.completed).length

  const handleSelect = (id: string) => dispatch({ type: 'SELECT_NODE', payload: id })

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
    }}>
      {/* Main timeline */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 9,
                background: filter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === f ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: filter === f ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
              whileHover={{ background: 'rgba(99,102,241,0.12)' }}
              whileTap={{ scale: 0.96 }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'overdue'   && overdueCnt  > 0 && (
                <span style={{ marginLeft: 6, background: '#EF4444', color: 'white', borderRadius: 9999, fontSize: 10, padding: '0px 5px', fontWeight: 700 }}>{overdueCnt}</span>
              )}
              {f === 'this week' && thisWeekCnt > 0 && (
                <span style={{ marginLeft: 6, background: '#F59E0B', color: 'white', borderRadius: 9999, fontSize: 10, padding: '0px 5px', fontWeight: 700 }}>{thisWeekCnt}</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Summary chips */}
        {overdueCnt > 0 && (filter === 'all' || filter === 'overdue') && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
            }}
          >
            <AlertTriangle size={14} color="#EF4444" />
            <span style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 500 }}>
              {overdueCnt} overdue task{overdueCnt !== 1 ? 's' : ''} — needs attention
            </span>
          </motion.div>
        )}

        {/* Timeline items */}
        <div style={{ position: 'relative' }}>
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map(({ node, days }) => (
                <TimelineItem key={node.id} node={node} days={days} onSelect={handleSelect} />
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '48px 24px', textAlign: 'center',
                  color: 'rgba(255,255,255,0.25)', fontSize: 14,
                  background: 'rgba(13,17,23,0.5)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: 16,
                }}
              >
                <Calendar size={32} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 12px' }} />
                <div>No tasks match this filter</div>
                <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.15)' }}>
                  Add deadlines to nodes in the editor panel
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ height: 24 }} />
      </div>

      {/* Right sidebar — mini calendar + upcoming summary */}
      <div style={{
        width: 240, flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        padding: 20, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <MiniCalendar
          deadlineDates={deadlineDates}
          selectedMonth={calMonth}
          onChangeMonth={setCalMonth}
        />

        {/* Quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Summary
          </span>
          {[
            { label: 'Total with deadlines', value: nodesWithDeadlines.length, color: 'rgba(255,255,255,0.6)' },
            { label: 'Overdue',  value: overdueCnt,  color: '#EF4444' },
            { label: 'This week', value: thisWeekCnt, color: '#F59E0B' },
            { label: 'Completed', value: nodesWithDeadlines.filter(({ node }) => node.completed).length, color: '#10B981' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
