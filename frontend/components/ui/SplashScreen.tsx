'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'exit'>('logo')

  useEffect(() => {
    // Sped up loading animation significantly
    const t1 = setTimeout(() => setPhase('tagline'), 200)
    const t2 = setTimeout(() => setPhase('exit'), 800)
    const t3 = setTimeout(() => onComplete(), 1100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="splash"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#050810',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 30% 70%, rgba(16,185,129,0.06) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }} />

          {/* Orbiting ring */}
          <motion.div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity } }}
          />
          <motion.div
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              borderRadius: '50%',
              border: '1px solid rgba(129,140,248,0.08)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />

          {/* Logo icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.2))',
              border: '1px solid rgba(99,102,241,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(99,102,241,0.1)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Map size={32} color="#818CF8" />
            </motion.div>
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <h1 style={{
              fontSize: 36,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #c7d2fe 0%, #818CF8 40%, #6ee7b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              FlowMap
            </h1>

            {/* Tagline fades in second */}
            <AnimatePresence>
              {phase === 'tagline' && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.06em',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  Your learning universe, visualized
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              position: 'absolute',
              bottom: 48,
              width: 120,
              height: 2,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 9999,
              overflow: 'hidden',
              zIndex: 1,
            }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.1 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6366F1, #10B981)',
                borderRadius: 9999,
              }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
