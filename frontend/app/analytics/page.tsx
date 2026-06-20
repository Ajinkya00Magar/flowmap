'use client'

import dynamic from 'next/dynamic'
import AppShell from '@/components/sidebar/AppShell'
import ParticleBackground from '@/components/ui/ParticleBackground'

const AnalyticsView = dynamic(() => import('@/components/views/AnalyticsView'), { ssr: false })

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div style={{ position: 'relative', height: '100%' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <AnalyticsView />
        </div>
      </div>
    </AppShell>
  )
}
