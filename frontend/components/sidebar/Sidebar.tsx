'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, BarChart3, Calendar, Settings,
  Flame, CheckCircle2, Target, Clock,
  Download, Upload, RotateCcw, Brain, NotebookPen,
  Folders, LogOut,
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { NODE_COLOR_MAP } from '@/types/roadmap'

// ─── Nav items ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/',          icon: Map,         label: 'Canvas'    },
  { href: '/roadmaps',  icon: Folders,     label: 'Workspace' },
  { href: '/analytics', icon: BarChart3,   label: 'Analytics' },
  { href: '/timeline',  icon: Calendar,    label: 'Timeline'  },
  { href: '/focus',     icon: Brain,       label: 'Focus'     },
  { href: '/notes',     icon: NotebookPen, label: 'Journal'   },
  { href: '/settings',  icon: Settings,    label: 'Settings'  },
]

// ─── Hamburger icon (3 lines) ─────────────────────────────────────────────

function HamburgerIcon({ open }: { open: boolean }) {
  const bar = (y: number, width: string, delay: number) => (
    <motion.span
      animate={{ width, opacity: 1 }}
      transition={{ duration: 0.22, delay }}
      style={{
        display: 'block',
        height: 2,
        width,
        background: 'rgba(255,255,255,0.55)',
        borderRadius: 9999,
        transformOrigin: 'left center',
      }}
    />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 18 }}>
      {bar(0,  '100%', 0)}
      {bar(1,  open ? '70%' : '100%', 0.04)}
      {bar(2,  '100%', 0.08)}
    </div>
  )
}

// ─── Mini stat chip ───────────────────────────────────────────────────────

function SidebarStat({ icon, value, label, color }: {
  icon: React.ReactNode; value: string | number; label: string; color?: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
      padding: '8px 10px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 9,
      flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color ?? 'rgba(255,255,255,0.35)' }}>
        {icon}
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{
        fontSize: 16, fontWeight: 700,
        color: 'rgba(255,255,255,0.88)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>{value}</span>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { stats, state, exportJSON, importJSON, resetToDefault, roadmapsList, currentRoadmapId } = useRoadmapContext()
  const { user, signOut } = useAuth()
  const [confirmReset, setConfirmReset] = useState(false)

  const activeRoadmapName = roadmapsList.find(r => r.id === currentRoadmapId)?.name || 'FlowMap'
  const importRef = React.useRef<HTMLInputElement>(null)

  const W = collapsed ? 60 : 220

  return (
    <motion.aside
      animate={{ width: W }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        height: '100vh',
        background: 'rgba(5,8,16,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* ── Header: hamburger + logo ──────────────────────────── */}
      <div style={{
        height: 60,
        padding: '0 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        {/* Hamburger toggle — always at top-left of sidebar */}
        <motion.button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileHover={{ background: 'rgba(255,255,255,0.07)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 32, height: 32,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <HamburgerIcon open={!collapsed} />
        </motion.button>

        {/* Logo + name — only when expanded */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}
            >
              <motion.div
                animate={{ rotate: [0, 6, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.2))',
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(99,102,241,0.2)',
                }}
              >
                <Map size={14} color="#818CF8" />
              </motion.div>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 800, letterSpacing: '-0.03em', whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #c7d2fe, #818CF8, #6ee7b7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>FlowMap</div>
                <div style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                }}>
                  {activeRoadmapName}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {/* ── Nav links ─────────────────────────────────────────── */}
        <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }} title={collapsed ? label : undefined}>
              <motion.div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px 14px' : '9px 12px',
                  borderRadius: 10,
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                  cursor: 'pointer', overflow: 'hidden', position: 'relative',
                }}
                whileHover={{ background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav"
                    style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #6366F1, #10B981)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={16}
                  color={active ? '#818CF8' : 'rgba(255,255,255,0.4)'}
                  style={{ flexShrink: 0, marginLeft: active ? 4 : 0 }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap',
                        color: active ? '#c7d2fe' : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* ── Stats (expanded only) ──────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '12px 10px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', paddingLeft: 2 }}>
                Overview
              </span>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Overall</span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#818CF8' }}>{stats.overallProgress}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${stats.overallProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #10B981)', borderRadius: 9999 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <SidebarStat icon={<Flame size={10} />} value={stats.streak} label="Streak" color="#F59E0B" />
                <SidebarStat icon={<CheckCircle2 size={10} />} value={stats.completedNodes} label="Done" color="#10B981" />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <SidebarStat icon={<Target size={10} />} value={stats.totalNodes} label="Total" />
                <SidebarStat icon={<Clock size={10} />} value={`${stats.completedHours}h`} label="Hours" color="#06B6D4" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                {state.rootIds.slice(0, 4).map(id => {
                  const node = state.nodes[id]
                  if (!node) return null
                  const colorMap = NODE_COLOR_MAP[node.color]
                  return (
                    <div key={id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{node.title}</span>
                        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: colorMap.progress, flexShrink: 0 }}>{node.progress}%</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 9999, overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${node.progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ height: '100%', background: colorMap.progress, borderRadius: 9999 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Data actions (expanded only) ───────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', paddingLeft: 2, marginBottom: 2, display: 'block' }}>Data</span>
              {[
                { icon: <Download size={12} />, label: 'Export JSON', action: exportJSON, color: '#6366F1' },
                { icon: <Upload size={12} />, label: 'Import JSON', action: () => importRef.current?.click(), color: '#10B981' },
                {
                  icon: <RotateCcw size={12} />,
                  label: confirmReset ? 'Confirm reset?' : 'Reset to default',
                  action: () => {
                    if (confirmReset) { resetToDefault(); setConfirmReset(false) }
                    else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000) }
                  },
                  color: confirmReset ? '#EF4444' : 'rgba(255,255,255,0.4)',
                },
              ].map(({ icon, label, action, color }) => (
                <motion.button
                  key={label}
                  onClick={action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8, cursor: 'pointer', width: '100%',
                    color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'left',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.04)', color }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span style={{ color }}>{icon}</span>
                  {label}
                </motion.button>
              ))}
              <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) importJSON(f); e.target.value = '' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ── User profile ──────────────────────────────────────── */}
      {user && (
        <div style={{
          padding: '10px 8px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          {!collapsed ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 8, padding: '6px 8px', borderRadius: 8,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #10B981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {user.email?.[0].toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
              <button onClick={signOut} title="Sign Out" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button onClick={signOut} title={`Sign Out (${user.email})`} style={{
              width: '100%', height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogOut size={12} />
            </button>
          )}
        </div>
      )}
    </motion.aside>
  )
}
