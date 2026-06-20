'use client'

import dynamic from 'next/dynamic'
import AppShell from '@/components/sidebar/AppShell'
import ParticleBackground from '@/components/ui/ParticleBackground'

const TimelineView = dynamic(() => import('@/components/views/TimelineView'), { ssr: false })

export default function TimelinePage() {
  return (
    <AppShell>
      <div style={{ position: 'relative', height: '100%' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <TimelineView />
        </div>
      </div>
    </AppShell>
  )
}
