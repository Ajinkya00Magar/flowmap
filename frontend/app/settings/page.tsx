'use client'

import dynamic from 'next/dynamic'
import AppShell from '@/components/sidebar/AppShell'
import ParticleBackground from '@/components/ui/ParticleBackground'

const SettingsView = dynamic(() => import('@/components/settings/SettingsView'), { ssr: false })

export default function SettingsPage() {
  return (
    <AppShell>
      <div style={{ position: 'relative', height: '100%' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <SettingsView />
        </div>
      </div>
    </AppShell>
  )
}
