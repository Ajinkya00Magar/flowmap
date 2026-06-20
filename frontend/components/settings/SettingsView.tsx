'use client'

import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Palette, Keyboard, Info, Download, Upload,
  RotateCcw, Trash2, CheckCircle2, AlertTriangle, ExternalLink,
  Github, Star, Map, Zap, User, LogOut
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { useAuth } from '@/components/providers/AuthProvider'

// ─── Section wrapper ──────────────────────────────────────────────────────

function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      style={{
        background: 'rgba(13,17,23,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ color: '#818CF8' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{title}</h3>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────

function Row({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '4px 0',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '2px 0' }} />
}

// ─── Toggle switch ────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22,
        background: value ? '#6366F1' : 'rgba(255,255,255,0.1)',
        borderRadius: 11, border: 'none',
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          position: 'absolute', top: 3,
          width: 16, height: 16, borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </motion.button>
  )
}

// ─── Danger button ────────────────────────────────────────────────────────

function DangerButton({
  icon, label, confirmLabel, onConfirm,
}: { icon: React.ReactNode; label: string; confirmLabel: string; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)

  const handleClick = () => {
    if (confirming) { onConfirm(); setConfirming(false) }
    else { setConfirming(true); setTimeout(() => setConfirming(false), 3000) }
  }

  return (
    <motion.button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: confirming ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${confirming ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 9, cursor: 'pointer',
        color: confirming ? '#FCA5A5' : 'rgba(255,255,255,0.5)',
        fontSize: 13, fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s',
      }}
      whileHover={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}
      whileTap={{ scale: 0.97 }}
    >
      {icon}
      {confirming ? confirmLabel : label}
    </motion.button>
  )
}

// ─── Keyboard shortcut row ────────────────────────────────────────────────

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {keys.map((k, i) => (
          <kbd key={i} style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 5, padding: '3px 8px',
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(255,255,255,0.6)',
          }}>
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )
}

// ─── SettingsView ──────────────────────────────────────────────────────────

export default function SettingsView() {
  const { state, exportJSON, importJSON, resetToDefault, stats } = useRoadmapContext()
  const { user, profile, updateProfile, signOut } = useAuth()
  const { success, info } = useToast()
  const importRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  // Local preference state (persisted to localStorage)
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === 'undefined') return { animations: true, particles: true, autoSave: true, compactNodes: false }
    try { return JSON.parse(localStorage.getItem('flowmap_prefs') ?? '{}') } catch { return {} }
  })

  const setPref = (key: string, val: boolean) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    if (typeof window !== 'undefined') localStorage.setItem('flowmap_prefs', JSON.stringify(next))
    info(`${key.charAt(0).toUpperCase() + key.slice(1)} ${val ? 'enabled' : 'disabled'}`)
  }

  React.useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile])

  const handleSaveProfile = async () => {
    if (!profile || displayName === profile.display_name) return
    const { error } = await updateProfile({ display_name: displayName.trim() || null })
    if (error) {
      info('Unable to save profile name')
    } else {
      success('Profile updated')
    }
  }

  const nodeCount  = Object.keys(state.nodes).length
  const storageStr = typeof window !== 'undefined'
    ? (() => {
        const raw = localStorage.getItem('flowmap_state_v1') ?? ''
        const bytes = new Blob([raw]).size
        return bytes < 1024 ? `${bytes} B` : `${(bytes/1024).toFixed(1)} KB`
      })()
    : '—'

  return (
    <div style={{ padding: '28px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left column ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Appearance */}
          <Section icon={<Palette size={16} />} title="Appearance">
            <Row label="Particle background" description="Floating ambient particles on the canvas">
              <Toggle value={prefs.particles ?? true} onChange={v => setPref('particles', v)} />
            </Row>
            <Divider />
            <Row label="Spring animations" description="Physics-based motion throughout the UI">
              <Toggle value={prefs.animations ?? true} onChange={v => setPref('animations', v)} />
            </Row>
            <Divider />
            <Row label="Compact node size" description="Smaller nodes on the canvas for dense roadmaps">
              <Toggle value={prefs.compactNodes ?? false} onChange={v => setPref('compactNodes', v)} />
            </Row>
          </Section>

          {/* Data management */}
          <Section icon={<Database size={16} />} title="Data">
            <Row label="Auto-save" description="Automatically save changes to localStorage">
              <Toggle value={prefs.autoSave ?? true} onChange={v => setPref('autoSave', v)} />
            </Row>
            <Divider />

            <Row label="Storage used" description="Local storage consumed by FlowMap">
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#818CF8' }}>
                {storageStr}
              </span>
            </Row>
            <Row label="Total nodes" description="Nodes in your current roadmap">
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#10B981' }}>
                {nodeCount}
              </span>
            </Row>
            <Divider />

            {/* Import / Export */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <motion.button
                onClick={exportJSON}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 9, cursor: 'pointer',
                  color: '#a5b4fc', fontSize: 13, fontFamily: 'Inter, sans-serif',
                }}
                whileHover={{ background: 'rgba(99,102,241,0.22)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Download size={13} /> Export JSON
              </motion.button>

              <motion.button
                onClick={() => importRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 9, cursor: 'pointer',
                  color: '#6ee7b7', fontSize: 13, fontFamily: 'Inter, sans-serif',
                }}
                whileHover={{ background: 'rgba(16,185,129,0.2)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Upload size={13} /> Import JSON
              </motion.button>
            </div>

            <input
              ref={importRef} type="file" accept=".json" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) importJSON(f); e.target.value = '' }}
            />
          </Section>

          {/* Danger zone */}
          <Section icon={<AlertTriangle size={16} />} title="Danger Zone">
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              These actions are irreversible. Your current roadmap will be lost.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <DangerButton
                icon={<RotateCcw size={13} />}
                label="Reset to default roadmap"
                confirmLabel="Confirm reset"
                onConfirm={resetToDefault}
              />
              <DangerButton
                icon={<Trash2 size={13} />}
                label="Clear all data"
                confirmLabel="Confirm clear all"
                onConfirm={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('flowmap_state_v1')
                    localStorage.removeItem('flowmap_streak')
                    window.location.reload()
                  }
                }}
              />
            </div>
          </Section>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Account */}
          {user && (
            <Section icon={<User size={16} />} title="Account & Session">
              <Row label="Email Address" description="Currently authenticated user account">
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.email}
                </span>
              </Row>
              <Divider />
              <Row label="Display name" description="Your public profile label">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Add a display name"
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, outline: 'none', width: 180
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'rgba(99,102,241,0.15)', color: '#c7d2fe', cursor: 'pointer', fontSize: 12 }}
                  >
                    Save
                  </button>
                </div>
              </Row>
              <Divider />
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  onClick={signOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 9, cursor: 'pointer',
                    color: '#FCA5A5', fontSize: 13, fontFamily: 'Inter, sans-serif',
                  }}
                  whileHover={{ background: 'rgba(239,68,68,0.18)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <LogOut size={13} /> Sign Out
                </motion.button>
              </div>
            </Section>
          )}

          {/* Keyboard shortcuts */}
          <Section icon={<Keyboard size={16} />} title="Keyboard Shortcuts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { keys: ['Ctrl', 'K'], label: 'Open search' },
                { keys: ['Ctrl', 'Z'], label: 'Undo' },
                { keys: ['Ctrl', 'Y'], label: 'Redo' },
                { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo (alt)' },
                { keys: ['Ctrl', 'S'], label: 'Force save' },
                { keys: ['Del'], label: 'Delete selected node' },
                { keys: ['Esc'], label: 'Close panel / Deselect' },
                { keys: ['Scroll'], label: 'Zoom canvas' },
                { keys: ['Click + Drag'], label: 'Pan canvas' },
                { keys: ['Dbl-click'], label: 'Add node at cursor' },
                { keys: ['Right-click'], label: 'Context menu on node' },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <ShortcutRow keys={s.keys} label={s.label} />
                  {i < 10 && <Divider />}
                </React.Fragment>
              ))}
            </div>
          </Section>

          {/* About */}
          <Section icon={<Info size={16} />} title="About FlowMap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Logo row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(16,185,129,0.15))',
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Map size={22} color="#818CF8" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #c7d2fe, #818CF8, #6ee7b7)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>FlowMap</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                    v2.0 · Your Learning Universe
                  </div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                FlowMap is a premium interactive learning roadmap visualizer. Navigate your knowledge
                as floating connected islands, track progress, and keep your learning universe alive.
              </p>

              {/* Stats summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Topics tracked',    value: nodeCount },
                  { label: 'Completed',          value: stats.completedNodes },
                  { label: 'Hours estimated',    value: `${stats.totalEstimatedHours}h` },
                  { label: 'Overall progress',   value: `${stats.overallProgress}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 9,
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.88)', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Tech stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  Built with
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Next.js 14', 'React 18', 'TypeScript', 'Framer Motion', 'Recharts', 'Tailwind CSS'].map(t => (
                    <span key={t} style={{
                      fontSize: 11, padding: '3px 8px',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: 5, color: '#a5b4fc',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
