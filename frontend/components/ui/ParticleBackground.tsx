'use client'

import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  opacityDelta: number
  color: string
}

const COLORS = [
  'rgba(99,102,241,',   // indigo
  'rgba(129,140,248,',  // violet
  'rgba(16,185,129,',   // emerald
  'rgba(6,182,212,',    // cyan
]

const PARTICLE_COUNT = 55

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      sizeRef.current = { w: canvas.width, h: canvas.height }
    }

    function createParticle(): Particle {
      const { w, h } = sizeRef.current
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        opacityDelta: (Math.random() - 0.5) * 0.004,
        color,
      }
    }

    resize()
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, createParticle)

    function draw() {
      if (!ctx || !canvas) return
      const { w, h } = sizeRef.current
      ctx.clearRect(0, 0, w, h)

      particlesRef.current.forEach(p => {
        // Move
        p.x += p.vx
        p.y += p.vy

        // Opacity breathing
        p.opacity += p.opacityDelta
        if (p.opacity > 0.55 || p.opacity < 0.05) {
          p.opacityDelta *= -1
        }

        // Wrap
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.opacity.toFixed(2)})`
        ctx.fill()

        // Soft glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4)
        gradient.addColorStop(0, `${p.color}${(p.opacity * 0.3).toFixed(2)})`)
        gradient.addColorStop(1, `${p.color}0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    window.addEventListener('resize', resize)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.7,
      }}
    />
  )
}
