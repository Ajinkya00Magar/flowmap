'use client'

import dynamic from 'next/dynamic'
import AppShell from '@/components/sidebar/AppShell'
import ParticleBackground from '@/components/ui/ParticleBackground'

const NotesView = dynamic(() => import('@/components/notes/NotesView'), { ssr: false })

export default function NotesPage() {
  return (
    <AppShell>
      <div style={{ position: 'relative', height: '100%' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <NotesView />
        </div>
      </div>
    </AppShell>
  )
}
