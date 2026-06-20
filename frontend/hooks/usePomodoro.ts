'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

const SESSIONS_KEY = 'flowmap_pomodoro_sessions'

export interface PomodoroSession {
  id: string
  mode: TimerMode
  completedAt: string
  linkedNodeId: string | null
  durationSeconds: number
}

function loadLocalSessions(): PomodoroSession[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveLocalSessions(sessions: PomodoroSession[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(-200)))
}

export function usePomodoro(linkedNodeId: string | null = null) {
  const { user } = useAuth()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus)
  const [isRunning, setIsRunning] = useState(false)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [loaded, setLoaded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load sessions from Supabase (if logged in) or Local Storage
  useEffect(() => {
    if (!user) {
      setSessions(loadLocalSessions())
      setLoaded(true)
      return
    }

    const fetchSessions = async () => {
      setLoaded(false)
      try {
        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: true })
          .limit(200)

        if (error) throw error

        const mapped: PomodoroSession[] = (data || []).map((item: any) => ({
          id: item.id,
          mode: item.mode as TimerMode,
          completedAt: item.completed_at,
          linkedNodeId: item.linked_node_id,
          durationSeconds: item.duration_seconds,
        }))

        setSessions(mapped)
      } catch (err) {
        console.error('Failed to fetch pomodoro sessions from Supabase:', err)
        setSessions(loadLocalSessions())
      } finally {
        setLoaded(true)
      }
    }

    fetchSessions()
  }, [user])

  // Tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = useCallback(async () => {
    setIsRunning(false)

    // Record session
    const session: PomodoroSession = {
      id: `pomo-${Date.now()}`,
      mode,
      completedAt: new Date().toISOString(),
      linkedNodeId,
      durationSeconds: DURATIONS[mode],
    }

    setSessions(prev => {
      const next = [...prev, session]
      if (!user) {
        saveLocalSessions(next)
      }
      return next
    })

    if (user) {
      try {
        const { error } = await supabase
          .from('pomodoro_sessions')
          .insert({
            id: session.id,
            user_id: user.id,
            mode: session.mode,
            completed_at: session.completedAt,
            linked_node_id: session.linkedNodeId,
            duration_seconds: session.durationSeconds,
          })
        if (error) throw error
      } catch (err) {
        console.error('Failed to insert pomodoro session in Supabase:', err)
      }
    }

    // Play notification sound via Web Audio (simple beep)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = mode === 'focus' ? 880 : 440
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch {
      // ignore audio errors
    }

    // Auto-advance mode
    if (mode === 'focus') {
      const nextCycles = cyclesCompleted + 1
      setCyclesCompleted(nextCycles)
      if (nextCycles % 4 === 0) {
        setMode('longBreak')
        setSecondsLeft(DURATIONS.longBreak)
      } else {
        setMode('shortBreak')
        setSecondsLeft(DURATIONS.shortBreak)
      }
    } else {
      setMode('focus')
      setSecondsLeft(DURATIONS.focus)
    }
  }, [mode, cyclesCompleted, linkedNodeId, user])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setSecondsLeft(DURATIONS[mode])
  }, [mode])

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setSecondsLeft(DURATIONS[newMode])
  }, [])

  const skipToNext = useCallback(() => {
    setIsRunning(false)
    handleComplete()
  }, [handleComplete])

  // Today's focus session count
  const todayFocusCount = sessions.filter(s => {
    return s.mode === 'focus' && new Date(s.completedAt).toDateString() === new Date().toDateString()
  }).length

  const totalFocusMinutesToday = sessions
    .filter(s => s.mode === 'focus' && new Date(s.completedAt).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.durationSeconds / 60, 0)

  return {
    mode,
    secondsLeft,
    totalSeconds: DURATIONS[mode],
    isRunning,
    cyclesCompleted,
    sessions,
    todayFocusCount,
    totalFocusMinutesToday,
    start,
    pause,
    reset,
    switchMode,
    skipToNext,
    loaded,
  }
}
