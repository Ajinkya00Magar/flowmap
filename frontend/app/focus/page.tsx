'use client'

import dynamic from 'next/dynamic'
import AppShell from '@/components/sidebar/AppShell'
import ParticleBackground from '@/components/ui/ParticleBackground'

const FocusView = dynamic(() => import('@/components/focus/FocusView'), { ssr: false })

export default function FocusPage() {
  return (
    <AppShell>
      <div style={{ position: 'relative', height: '100%' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <FocusView />
        </div>
      </div>
    </AppShell>
  )
}
