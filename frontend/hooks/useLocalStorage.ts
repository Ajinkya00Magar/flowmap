'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Generic localStorage hook ────────────────────────────────────────────

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const initialized = useRef(false)

  // Initialize from localStorage on mount (client only)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item))
      }
    } catch (err) {
      console.warn(`[FlowMap] Failed to read localStorage key "${key}":`, err)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue(prev => {
          const next = value instanceof Function ? value(prev) : value
          window.localStorage.setItem(key, JSON.stringify(next))
          return next
        })
      } catch (err) {
        console.warn(`[FlowMap] Failed to write localStorage key "${key}":`, err)
      }
    },
    [key]
  )

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (err) {
      console.warn(`[FlowMap] Failed to remove localStorage key "${key}":`, err)
    }
  }, [key, initialValue])

  return [storedValue, setValue, remove]
}

// ─── Debounced persistence hook ───────────────────────────────────────────

export function useDebouncedLocalStorage<T>(
  key: string,
  value: T,
  delay = 800
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (err) {
        console.warn(`[FlowMap] Debounced save failed for "${key}":`, err)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [key, value, delay])
}
