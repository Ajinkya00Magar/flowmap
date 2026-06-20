'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const Sidebar    = dynamic(() => import('@/components/sidebar/Sidebar'),    { ssr: false })
const TopBar     = dynamic(() => import('@/components/sidebar/TopBar'),     { ssr: false })
const Spotlight  = dynamic(() => import('@/components/ui/Spotlight'),       { ssr: false })
const NodeEditorPanel = dynamic(() => import('@/components/panels/NodeEditorPanel'), { ssr: false })

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/roadmaps':  { title: 'Workspace Explorer', subtitle: 'Organize your folders and learning roadmaps' },
  '/analytics': { title: 'Analytics', subtitle: 'Visualize your learning progress' },
  '/timeline':  { title: 'Timeline',  subtitle: 'Deadlines & scheduled milestones' },
  '/focus':     { title: 'Focus',     subtitle: 'Pomodoro timer for deep work sessions' },
  '/notes':     { title: 'Journal',   subtitle: 'Daily reflections & learning notes' },
  '/settings':  { title: 'Settings',  subtitle: 'Preferences, data & keyboard shortcuts' },
}

interface AppShellProps {
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function AppShell({ children, actions }: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed]       = useState(false)
  const [spotlightOpen, setSpotlight]   = useState(false)

  const meta = PAGE_META[pathname] ?? { title: 'FlowMap', subtitle: '' }

  // Cmd+K
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSpotlight(v => !v)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#050810' }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenSearch={() => setSpotlight(true)}
          actions={actions}
        />

        {/* Page content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        >
          {children}
        </motion.div>
      </div>

      {/* Global overlays */}
      <NodeEditorPanel />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlight(false)} />
    </div>
  )
}
