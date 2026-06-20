'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType {
  user: any
  profile: any | null
  session: any
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (updates: { display_name?: string }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const finishLoading = async (nextSession: any = null) => {
      if (!mounted) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user) {
        let profileData = null
        let profileError: any = null

        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .eq('id', nextSession.user.id)
          .single()

        if (!error) {
          profileData = data
        } else if (error.message?.includes('display_name')) {
          const fallback = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', nextSession.user.id)
            .single()

          profileData = fallback.data
          profileError = fallback.error
        } else {
          profileError = error
        }

        if (!profileError) {
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    }

    const timeout = window.setTimeout(() => {
      console.warn('Supabase session check timed out; continuing without an active session.')
      finishLoading(null)
    }, 6000)

    // Fetch initial session. Do not let a slow network keep the app on the loading screen forever.
    supabase.auth.getSession()
      .then(({ data }) => {
        window.clearTimeout(timeout)
        finishLoading(data?.session ?? null)
      })
      .catch((err) => {
        window.clearTimeout(timeout)
        console.error('Failed to fetch Supabase session:', err)
        finishLoading(null)
      })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      window.clearTimeout(timeout)
      await finishLoading(currentSession)
    })

    return () => {
      mounted = false
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // Handle redirects based on authentication state
  useEffect(() => {
    if (isLoading) return

    const isAuthPage = pathname === '/auth'

    if (!user && !isAuthPage) {
      router.push('/auth')
    } else if (user && isAuthPage) {
      router.push('/')
    }
  }, [user, isLoading, pathname, router])

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  const updateProfile = async (updates: { display_name?: string }) => {
    try {
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (!error) {
        setProfile(data)
      }

      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  const isAuthPage = pathname === '/auth'

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#050810', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', gap: 16
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#818CF8',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: 12, letterSpacing: '0.05em', fontWeight: 600 }}>CONNECTING TO FLOWMAP UNIVERSE...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  if (!user && !isAuthPage) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
