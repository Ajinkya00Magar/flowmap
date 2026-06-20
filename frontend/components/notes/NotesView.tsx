'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smile, Meh, Frown, Sparkles, CloudRain,
  Trash2, Calendar, Link2, X, BookOpen
} from 'lucide-react'
import { useJournal, type JournalEntry } from '@/hooks/useJournal'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { NODE_COLOR_MAP } from '@/types/roadmap'

// ─── Mood config ──────────────────────────────────────────────────────────

const MOODS: { key: JournalEntry['mood']; icon: React.ReactNode; label: string; color: string }[] = [
  { key: 'great', icon: <Sparkles size={16} />, label: 'Great',  color: '#10B981' },
  { key: 'good',  icon: <Smile size={16} />,    label: 'Good',   color: '#6366F1' },
  { key: 'okay',  icon: <Meh size={16} />,      label: 'Okay',   color: '#F59E0B' },
  { key: 'tough', icon: <CloudRain size={16} />,label: 'Tough',  color: '#EF4444' },
]

function moodConfig(mood: JournalEntry['mood']) {
  return MOODS.find(m => m.key === mood) ?? null
}

// ─── Node tag picker ──────────────────────────────────────────────────────

function NodeTagPicker({
  selectedIds, onChange,
}: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const { state } = useRoadmapContext()
  const [open, setOpen] = useState(false)

  const allNodes = useMemo(() => Object.values(state.nodes).slice(0, 40), [state.nodes])

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {selectedIds.map(id => {
          const node = state.nodes[id]
          if (!node) return null
          const colorMap = NODE_COLOR_MAP[node.color]
          return (
            <span key={id} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6,
              background: `${colorMap.progress}18`,
              border: `1px solid ${colorMap.border}`,
              fontSize: 11, color: colorMap.text,
            }}>
              {node.title}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => toggle(id)} />
            </span>
          )
        })}
        <motion.button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer',
          }}
          whileHover={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}
        >
          <Link2 size={10} /> Tag topic
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                position: 'absolute', top: '120%', left: 0, zIndex: 100,
                width: 260, maxHeight: 260, overflowY: 'auto',
                background: 'rgba(8,13,24,0.97)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 6,
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              {allNodes.map(node => {
                const colorMap = NODE_COLOR_MAP[node.color]
                const checked = selectedIds.includes(node.id)
                return (
                  <button
                    key={node.id}
                    onClick={() => toggle(node.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 9px', background: checked ? 'rgba(99,102,241,0.1)' : 'transparent',
                      border: 'none', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: colorMap.progress, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{node.title}</span>
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Entry card (history) ────────────────────────────────────────────────

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: string) => void }) {
  const { state } = useRoadmapContext()
  const mood = moodConfig(entry.mood)
  const dateObj = new Date(entry.date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'rgba(13,17,23,0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mood && <span style={{ color: mood.color }}>{mood.icon}</span>}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <motion.button
          onClick={() => onDelete(entry.id)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
          whileHover={{ color: '#EF4444' }}
        >
          <Trash2 size={13} />
        </motion.button>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {entry.content || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No notes recorded</span>}
      </p>

      {entry.linkedNodeIds.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {entry.linkedNodeIds.map(id => {
            const node = state.nodes[id]
            if (!node) return null
            const colorMap = NODE_COLOR_MAP[node.color]
            return (
              <span key={id} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 5,
                background: `${colorMap.progress}15`, color: colorMap.text,
              }}>
                {node.title}
              </span>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── NotesView ────────────────────────────────────────────────────────────

export default function NotesView() {
  const { todayEntry, upsertToday, entries, deleteEntry } = useJournal()
  const { success } = useToast()
  const [content, setContent] = useState(todayEntry?.content ?? '')
  const [linkedIds, setLinkedIds] = useState<string[]>(todayEntry?.linkedNodeIds ?? [])
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from loaded entry once
  React.useEffect(() => {
    if (todayEntry) {
      setContent(todayEntry.content)
      setLinkedIds(todayEntry.linkedNodeIds)
    }
  }, [todayEntry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentChange = (val: string) => {
    setContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      upsertToday({ content: val })
    }, 600)
  }

  const handleMoodSelect = (mood: JournalEntry['mood']) => {
    upsertToday({ mood })
    success(`Mood logged: ${moodConfig(mood)?.label}`)
  }

  const handleLinkedChange = (ids: string[]) => {
    setLinkedIds(ids)
    upsertToday({ linkedNodeIds: ids })
  }

  const pastEntries = entries.filter(e => e.date !== new Date().toISOString().split('T')[0])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720, margin: '0 auto' }}>

      {/* Today's entry editor */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(13,17,23,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 18, padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Calendar size={16} color="#818CF8" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
            Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Mood selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {MOODS.map(m => (
            <motion.button
              key={m.key}
              onClick={() => handleMoodSelect(m.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '10px 0', borderRadius: 12,
                background: todayEntry?.mood === m.key ? `${m.color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${todayEntry?.mood === m.key ? `${m.color}50` : 'rgba(255,255,255,0.06)'}`,
                color: todayEntry?.mood === m.key ? m.color : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {m.icon}
              <span style={{ fontSize: 10, fontWeight: 600 }}>{m.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Journal textarea */}
        <textarea
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          placeholder="What did you learn today? Any breakthroughs, blockers, or reflections..."
          rows={6}
          className="flowmap-input"
          style={{ fontSize: 13, lineHeight: 1.7, resize: 'vertical', marginBottom: 14 }}
        />

        {/* Tag related topics */}
        <NodeTagPicker selectedIds={linkedIds} onChange={handleLinkedChange} />
      </motion.div>

      {/* Past entries */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <BookOpen size={14} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Past entries · {pastEntries.length}
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {pastEntries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '32px 20px', textAlign: 'center',
                color: 'rgba(255,255,255,0.2)', fontSize: 13,
                border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 14,
              }}
            >
              Your journal history will appear here as you write daily entries
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ height: 20 }} />
    </div>
  )
}
