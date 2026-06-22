'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/providers/AuthProvider'

export interface ActiveUser {
  id: string
  name: string
  email: string
}

export function usePresence(roadmapId: string | null) {
  const { user, profile } = useAuth()
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])

  useEffect(() => {
    if (!roadmapId || !user) {
      setActiveUsers([])
      return
    }

    const channelName = `presence-roadmap-${roadmapId}`
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: ActiveUser[] = []

        for (const id in state) {
          // state[id] is an array of presences for that key
          const presences = state[id] as any[]
          if (presences.length > 0) {
            users.push({
              id,
              name: presences[0].name,
              email: presences[0].email,
            })
          }
        }

        setActiveUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: profile?.display_name || user.email?.split('@')[0] || 'Anonymous',
            email: user.email,
          })
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [roadmapId, user, profile])

  // Filter out the current user so we only see *other* people
  const otherUsers = activeUsers.filter(u => u.id !== user?.id)

  return { activeUsers, otherUsers }
}
