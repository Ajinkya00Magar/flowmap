'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Config ───────────────────────────────────────────────────────────────

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={14} />,
  error:   <XCircle size={14} />,
  warning: <AlertCircle size={14} />,
  info:    <Info size={14} />,
}

const TOAST_COLORS: Record<ToastType, { icon: string; border: string; bg: string }> = {
  success: { icon: '#10B981', border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)' },
  error:   { icon: '#EF4444', border: 'rgba(239,68,68,0.25)',  bg: 'rgba(239,68,68,0.08)' },
  warning: { icon: '#F59E0B', border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.08)' },
  info:    { icon: '#6366F1', border: 'rgba(99,102,241,0.25)', bg: 'rgba(99,102,241,0.08)' },
}

// ─── Provider ─────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration = 3500
  ) => {
    const id = `toast-${++counter.current}`
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }])

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }, [dismiss])

  const success = useCallback((m: string) => toast(m, 'success'), [toast])
  const error   = useCallback((m: string) => toast(m, 'error', 5000), [toast])
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast])
  const info    = useCallback((m: string) => toast(m, 'info'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed',
        bottom: 80,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        alignItems: 'flex-end',
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(t => {
            const cfg = TOAST_COLORS[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${cfg.border}`,
                  borderLeft: `3px solid ${cfg.icon}`,
                  borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  maxWidth: 320,
                  pointerEvents: 'auto',
                  background: cfg.bg,
                }}
              >
                <span style={{ color: cfg.icon, flexShrink: 0, display: 'flex' }}>
                  {TOAST_ICONS[t.type]}
                </span>
                <span style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  flex: 1,
                  lineHeight: 1.4,
                }}>
                  {t.message}
                </span>
                <motion.button
                  onClick={() => dismiss(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    padding: 2,
                    flexShrink: 0,
                    display: 'flex',
                  }}
                  whileHover={{ color: 'rgba(255,255,255,0.8)', scale: 1.1 }}
                >
                  <X size={12} />
                </motion.button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
