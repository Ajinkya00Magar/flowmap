'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Lock, Mail, AlertTriangle, CheckCircle2, UserPlus, LogIn } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/components/providers/ToastProvider'
import ParticleBackground from '@/components/ui/ParticleBackground'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toastError('Please fill in all fields')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      toastError('Please enter a valid email address.')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      toastError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toastError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          console.error('Sign in error:', error)
          const msg = error?.message || error?.error_description || error?.msg || 'Failed to sign in'
          toastError(String(msg))
        } else {
          toastSuccess('Welcome back!')
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          console.error('Sign up error:', error)
          const msg = error?.message || error?.error_description || error?.msg || 'Failed to create account'
          toastError(String(msg))
        } else {
          toastSuccess('Registration successful! A verification link has been sent to your email. Please verify your email before logging in.')
          setIsLogin(true)
          setPassword('')
          setConfirmPassword('')
        }
      }
    } catch (err: any) {
      console.error('Auth unexpected error:', err)
      toastError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050810',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background Particles */}
      <ParticleBackground />

      {/* Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          margin: '0 20px',
          background: 'rgba(10, 15, 30, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '40px 30px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(16, 185, 129, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)',
            marginBottom: 20
          }}
        >
          <Map size={26} color="#818CF8" />
        </motion.div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #ffffff, #c7d2fe, #818CF8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 6px 0'
        }}>
          FlowMap
        </h1>
        <p style={{
          fontSize: 13,
          color: 'rgba(255, 255, 255, 0.45)',
          margin: '0 0 24px 0',
          textAlign: 'center'
        }}>
          Your interactive learning universe awaits
        </p>

        {/* Tabs switcher */}
        <div style={{
          display: 'flex',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 10,
          padding: 4,
          boxSizing: 'border-box',
          marginBottom: 24
        }}>
          <button
            onClick={() => { setIsLogin(true); setEmail(''); setPassword(''); setConfirmPassword(''); }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 0',
              background: isLogin ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: `1px solid ${isLogin ? 'rgba(99, 102, 241, 0.25)' : 'transparent'}`,
              borderRadius: 7,
              color: isLogin ? '#c7d2fe' : 'rgba(255,255,255,0.4)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <LogIn size={14} />
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setEmail(''); setPassword(''); setConfirmPassword(''); }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 0',
              background: !isLogin ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: `1px solid ${!isLogin ? 'rgba(99, 102, 241, 0.25)' : 'transparent'}`,
              borderRadius: 7,
              color: !isLogin ? '#c7d2fe' : 'rgba(255,255,255,0.4)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <UserPlus size={14} />
            Register
          </button>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Email field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 500 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  height: 42,
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  paddingLeft: 38,
                  paddingRight: 16,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: isLogin ? 24 : 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  height: 42,
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  paddingLeft: 38,
                  paddingRight: 16,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
              />
            </div>
          </div>

          {/* Confirm Password field (Sign Up only) */}
          {!isLogin && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 500 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    height: 42,
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    paddingLeft: 38,
                    paddingRight: 16,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
            whileHover={{ scale: loading ? 1 : 1.01, filter: 'brightness(1.1)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <span className="auth-spinner" style={{
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : isLogin ? (
              'Enter Universe'
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Simple global spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
