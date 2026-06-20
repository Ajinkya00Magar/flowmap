'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, SkipForward, Coffee, Brain,
  Link2, X, Flame, Clock, CheckCircle2, TrendingUp
} from 'lucide-react'
import { usePomodoro, type TimerMode } from '@/hooks/usePomodoro'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { NODE_COLOR_MAP } from '@/types/roadmap'

// ─── Mode config ──────────────────────────────────────────────────────────

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; icon: React.ReactNode }> = {
  focus:      { label: 'Focus',       color: '#6366F1', icon: <Brain size={14} /> },
  shortBreak: { label: 'Short Break', color: '#10B981', icon: <Coffee size={14} /> },
  longBreak:  { label: 'Long Break',  color: '#06B6D4', icon: <Coffee size={14} /> },
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Node link picker ─────────────────────────────────────────────────────

function NodeLinkPicker({
  selectedId, onSelect,
}: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const { state } = useRoadmapContext()
  const [open, setOpen] = useState(false)

  const incompleteNodes = useMemo(() => {
    return Object.values(state.nodes)
      .filter(n => !n.completed && n.childIds.length === 0)
      .slice(0, 30)
  }, [state.nodes])

  const selectedNode = selectedId ? state.nodes[selectedId] : null

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          background: selectedNode ? `${NODE_COLOR_MAP[selectedNode.color].progress}15` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selectedNode ? NODE_COLOR_MAP[selectedNode.color].border : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, cursor: 'pointer',
          color: selectedNode ? NODE_COLOR_MAP[selectedNode.color].text : 'rgba(255,255,255,0.4)',
          fontSize: 13, maxWidth: 280,
        }}
        whileHover={{ background: 'rgba(255,255,255,0.07)' }}
        whileTap={{ scale: 0.98 }}
      >
        <Link2 size={13} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedNode ? selectedNode.title : 'Link a focus topic...'}
        </span>
        {selectedNode && (
          <X
            size={12}
            onClick={(e) => { e.stopPropagation(); onSelect(null) }}
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{
                position: 'absolute', top: '110%', left: 0,
                width: 280, maxHeight: 320, overflowY: 'auto',
                background: 'rgba(8,13,24,0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: 6,
                zIndex: 100,
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              }}
            >
              {incompleteNodes.map(node => {
                const colorMap = NODE_COLOR_MAP[node.color]
                return (
                  <motion.button
                    key={node.id}
                    onClick={() => { onSelect(node.id); setOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', background: 'transparent', border: 'none',
                      borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    }}
                    whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: colorMap.progress, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.title}
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── FocusView ────────────────────────────────────────────────────────────

export default function FocusView() {
  const { state, dispatch } = useRoadmapContext()
  const [linkedNodeId, setLinkedNodeId] = useState<string | null>(null)

  const pomo = usePomodoro(linkedNodeId)
  const cfg = MODE_CONFIG[pomo.mode]
  const progress = 1 - pomo.secondsLeft / pomo.totalSeconds

  const r = 110
  const circumference = 2 * Math.PI * r

  // Recent sessions grouped
  const recentSessions = useMemo(() => {
    return [...pomo.sessions].reverse().slice(0, 8)
  }, [pomo.sessions])

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px', gap: 32,
    }}>
      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map(m => (
          <motion.button
            key={m}
            onClick={() => pomo.switchMode(m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9, border: 'none',
              background: pomo.mode === m ? `${MODE_CONFIG[m].color}25` : 'transparent',
              color: pomo.mode === m ? MODE_CONFIG[m].color : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 13, fontWeight: pomo.mode === m ? 600 : 400,
            }}
            whileHover={{ background: `${MODE_CONFIG[m].color}15` }}
            whileTap={{ scale: 0.97 }}
          >
            {MODE_CONFIG[m].icon}
            {MODE_CONFIG[m].label}
          </motion.button>
        ))}
      </div>

      {/* Timer ring */}
      <div style={{ position: 'relative', width: 260, height: 260 }}>
        <svg width={260} height={260} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={130} cy={130} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
          <motion.circle
            cx={130} cy={130} r={r} fill="none"
            stroke={cfg.color} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.5, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 12px ${cfg.color}80)` }}
          />
        </svg>

        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <motion.div
            key={pomo.mode}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: cfg.color, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {cfg.icon} {cfg.label}
          </motion.div>
          <div style={{
            fontSize: 52, fontWeight: 800, color: 'rgba(255,255,255,0.92)',
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em',
          }}>
            {formatTime(pomo.secondsLeft)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            Cycle {pomo.cyclesCompleted % 4 + 1} of 4
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.button
          onClick={pomo.reset}
          title="Reset"
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          whileHover={{ background: 'rgba(255,255,255,0.09)' }}
          whileTap={{ scale: 0.92 }}
        >
          <RotateCcw size={16} />
        </motion.button>

        <motion.button
          onClick={pomo.isRunning ? pomo.pause : pomo.start}
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
            border: 'none', cursor: 'pointer', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 32px ${cfg.color}50`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
        >
          {pomo.isRunning ? <Pause size={26} /> : <Play size={26} />}
        </motion.button>

        <motion.button
          onClick={pomo.skipToNext}
          title="Skip to next"
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          whileHover={{ background: 'rgba(255,255,255,0.09)' }}
          whileTap={{ scale: 0.92 }}
        >
          <SkipForward size={16} />
        </motion.button>
      </div>

      {/* Node link picker */}
      <NodeLinkPicker selectedId={linkedNodeId} onSelect={setLinkedNodeId} />

      {/* Today stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { icon: <Flame size={14} />, label: 'Sessions today', value: pomo.todayFocusCount, color: '#F59E0B' },
          { icon: <Clock size={14} />, label: 'Minutes focused', value: Math.round(pomo.totalFocusMinutesToday), color: '#6366F1' },
          { icon: <TrendingUp size={14} />, label: 'Total cycles', value: pomo.cyclesCompleted, color: '#10B981' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '12px 18px',
            background: 'rgba(13,17,23,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, minWidth: 110,
          }}>
            <span style={{ color }}>{icon}</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.88)' }}>{value}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>
            Recent sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentSessions.map(s => {
              const node = s.linkedNodeId ? state.nodes[s.linkedNodeId] : null
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 9,
                }}>
                  <span style={{ color: MODE_CONFIG[s.mode].color }}>
                    {s.mode === 'focus' ? <Brain size={12} /> : <Coffee size={12} />}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1 }}>
                    {node ? node.title : MODE_CONFIG[s.mode].label}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(s.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  )
}
