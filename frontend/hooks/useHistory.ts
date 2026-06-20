'use client'

import { useCallback, useRef, useState } from 'react'
import type { RoadmapState } from '@/types/roadmap'

const MAX_HISTORY = 50

interface HistoryStack {
  past: RoadmapState[]
  future: RoadmapState[]
}

export function useHistory(initialState: RoadmapState) {
  const [current, setCurrent] = useState<RoadmapState>(initialState)
  const stack = useRef<HistoryStack>({ past: [], future: [] })

  const push = useCallback((nextState: RoadmapState) => {
    stack.current = {
      past: [...stack.current.past.slice(-MAX_HISTORY + 1), current],
      future: [],
    }
    setCurrent(nextState)
  }, [current])

  const undo = useCallback(() => {
    const { past, future } = stack.current
    if (past.length === 0) return

    const previous = past[past.length - 1]
    stack.current = {
      past: past.slice(0, -1),
      future: [current, ...future],
    }
    setCurrent(previous)
  }, [current])

  const redo = useCallback(() => {
    const { past, future } = stack.current
    if (future.length === 0) return

    const next = future[0]
    stack.current = {
      past: [...past, current],
      future: future.slice(1),
    }
    setCurrent(next)
  }, [current])

  const reset = useCallback((state: RoadmapState) => {
    stack.current = { past: [], future: [] }
    setCurrent(state)
  }, [])

  return {
    state: current,
    push,
    undo,
    redo,
    reset,
    canUndo: stack.current.past.length > 0,
    canRedo: stack.current.future.length > 0,
  }
}
