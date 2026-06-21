'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanvasTransform } from '@/types/roadmap'

const MIN_SCALE = 0.25
const MAX_SCALE = 2.5
const ZOOM_SENSITIVITY = 0.001

interface UseCanvasOptions {
  initialTransform?: CanvasTransform
}

export function useCanvas({ initialTransform }: UseCanvasOptions = {}) {
  const [transform, setTransform] = useState<CanvasTransform>(
    initialTransform ?? { x: 0, y: 0, scale: 0.5 }
  )
  const [isPanning, setIsPanning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // ── Pan (mouse drag on canvas background) ───────────────────────────

  const startPan = useCallback((e: React.MouseEvent) => {
    // Only pan on left-click directly on canvas (not on nodes)
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-node]')) return

    setIsPanning(true)
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    }
    e.preventDefault()
  }, [transform])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!panStart.current) return

    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    const tx = panStart.current.tx
    const ty = panStart.current.ty

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(() => {
      setTransform(prev => ({
        ...prev,
        x: tx + dx,
        y: ty + dy,
      }))
    })
  }, [])

  const stopPan = useCallback(() => {
    setIsPanning(false)
    panStart.current = null
  }, [])

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', stopPan)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', stopPan)
    }
  }, [isPanning, handleMouseMove, stopPan])

  // ── Zoom (wheel) ─────────────────────────────────────────────────────

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const delta = e.ctrlKey ? e.deltaY * 0.01 : e.deltaY * ZOOM_SENSITIVITY
    const zoomFactor = Math.exp(-delta)

    setTransform(prev => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * zoomFactor))
      const scaleRatio = nextScale / prev.scale

      return {
        scale: nextScale,
        x: mouseX - (mouseX - prev.x) * scaleRatio,
        y: mouseY - (mouseY - prev.y) * scaleRatio,
      }
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Zoom controls ─────────────────────────────────────────────────────

  const zoomTo = useCallback((scale: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2

    setTransform(prev => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
      const scaleRatio = nextScale / prev.scale
      return {
        scale: nextScale,
        x: cx - (cx - prev.x) * scaleRatio,
        y: cy - (cy - prev.y) * scaleRatio,
      }
    })
  }, [])

  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const next = Math.min(MAX_SCALE, prev.scale * 1.2)
      return { ...prev, scale: next }
    })
  }, [])

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const next = Math.max(MIN_SCALE, prev.scale / 1.2)
      return { ...prev, scale: next }
    })
  }, [])

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 0.5 })
  }, [])

  const fitToScreen = useCallback((
    nodePositions: Array<{ x: number; y: number }>,
    nodeWidth = 160,
    nodeHeight = 60,
    maxFitScale = MAX_SCALE
  ) => {
    const container = containerRef.current
    if (!container || nodePositions.length === 0) return

    const rect = container.getBoundingClientRect()
    const padding = 80

    const minX = Math.min(...nodePositions.map(p => p.x))
    const minY = Math.min(...nodePositions.map(p => p.y))
    const maxX = Math.max(...nodePositions.map(p => p.x)) + nodeWidth
    const maxY = Math.max(...nodePositions.map(p => p.y)) + nodeHeight

    const contentW = maxX - minX
    const contentH = maxY - minY

    const scaleX = (rect.width - padding * 2) / contentW
    const scaleY = (rect.height - padding * 2) / contentH
    const scale = Math.min(Math.min(scaleX, scaleY), maxFitScale)

    const x = (rect.width - contentW * scale) / 2 - minX * scale
    const y = (rect.height - contentH * scale) / 2 - minY * scale

    setTransform({ x, y, scale })
  }, [])

  // ── Screen ↔ Canvas coordinate conversion ─────────────────────────────

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: (screenX - rect.left - transform.x) / transform.scale,
      y: (screenY - rect.top - transform.y) / transform.scale,
    }
  }, [transform])

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: canvasX * transform.scale + transform.x + rect.left,
      y: canvasY * transform.scale + transform.y + rect.top,
    }
  }, [transform])

  return {
    transform,
    setTransform,
    containerRef,
    isPanning,
    startPan,
    zoomIn,
    zoomOut,
    zoomTo,
    resetView,
    fitToScreen,
    screenToCanvas,
    canvasToScreen,
  }
}
