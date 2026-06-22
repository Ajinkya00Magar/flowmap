'use client'

import React from 'react'
import { Users } from 'lucide-react'
import { usePresence } from '@/hooks/usePresence'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'

// Helper to get initials
const getInitials = (name: string) => {
  return name.slice(0, 2).toUpperCase()
}

// Fixed color palette for avatars based on name hash
const getAvatarColor = (name: string) => {
  const colors = [
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#10B981', // emerald
    '#06B6D4', // cyan
    '#F59E0B', // amber
    '#F43F5E', // rose
    '#3B82F6', // blue
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function LiveCollaborators() {
  const { currentRoadmapId } = useRoadmapContext()
  const { otherUsers } = usePresence(currentRoadmapId)

  // Don't render anything if no one else is here
  if (!otherUsers || otherUsers.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 50, // above canvas, below overlays
        background: 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 12px',
        borderRadius: 999,
      }}
    >
      <Users size={14} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <AnimatePresence>
          {otherUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              title={user.name} // Native tooltip on hover
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: getAvatarColor(user.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                boxShadow: '0 0 0 2px #0B101E',
                cursor: 'default',
              }}
            >
              {getInitials(user.name)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>
        Live
      </span>
    </div>
  )
}
