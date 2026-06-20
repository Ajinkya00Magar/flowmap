'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import AppShell from '@/components/sidebar/AppShell'

const ParticleBackground   = dynamic(() => import('@/components/ui/ParticleBackground'),   { ssr: false })
const FloatingCanvas       = dynamic(() => import('@/components/canvas/FloatingCanvas'),   { ssr: false })
const FloatingActionButton = dynamic(() => import('@/components/ui/FloatingActionButton'), { ssr: false })
const FloatingToolbar      = dynamic(() => import('@/components/ui/FloatingToolbar'),       { ssr: false })
const SplashScreen         = dynamic(() => import('@/components/ui/SplashScreen'),          { ssr: false })

export default function HomePage() {
  const [splashDone, setSplashDone] = useState(false)

  // Only show splash once per session
  useEffect(() => {
    if (sessionStorage.getItem('flowmap_splashed')) {
      setSplashDone(true)
    }
  }, [])

  const handleSplashDone = () => {
    sessionStorage.setItem('flowmap_splashed', '1')
    setSplashDone(true)
  }

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashDone} />}

      <AppShell>
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* Ambient particles */}
          <ParticleBackground />

          {/* Canvas */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <FloatingCanvas />
          </div>

          {/* Canvas-only UI — FAB and shortcut bar */}
          <FloatingActionButton />
          <FloatingToolbar />
        </div>
      </AppShell>
    </>
  )
}
