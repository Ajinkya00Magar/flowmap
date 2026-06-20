'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

export interface JournalEntry {
  id: string
  date: string         // YYYY-MM-DD
  content: string
  mood: 'great' | 'good' | 'okay' | 'tough' | null
  linkedNodeIds: string[]
  createdAt: string
  updatedAt: string
}

const JOURNAL_KEY = 'flowmap_journal_v1'

function loadLocalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveLocalEntries(entries: JournalEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries))
}

export function useJournal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  // 1. Fetch entries when user state resolves
  useEffect(() => {
    if (!user) {
      // Offline / Signed Out fallback to local storage
      setEntries(loadLocalEntries())
      setLoaded(true)
      return
    }

    const fetchJournal = async () => {
      setLoaded(false)
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) throw error

        const mapped: JournalEntry[] = (data || []).map((item: any) => ({
          id: item.id,
          date: item.date,
          content: item.content,
          mood: item.mood,
          linkedNodeIds: Array.isArray(item.linked_node_ids) ? item.linked_node_ids : [],
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }))

        setEntries(mapped)
      } catch (err) {
        console.error('Failed to fetch journal entries:', err)
        // Fallback to local
        setEntries(loadLocalEntries())
      } finally {
        setLoaded(true)
      }
    }

    fetchJournal()
  }, [user])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayEntry = entries.find(e => e.date === todayStr) ?? null

  // 2. Upsert helper (handles DB and state sync)
  const upsertToday = useCallback(async (updates: Partial<Omit<JournalEntry, 'id' | 'date' | 'createdAt'>>) => {
    const now = new Date().toISOString()
    
    // Update state locally first for instant UX response
    setEntries(prev => {
      const existing = prev.find(e => e.date === todayStr)
      let next: JournalEntry[]

      if (existing) {
        next = prev.map(e => e.id === existing.id
          ? { ...e, ...updates, updatedAt: now }
          : e)
      } else {
        const entry: JournalEntry = {
          id: Math.random().toString(36).substring(2, 15),
          date: todayStr,
          content: '',
          mood: null,
          linkedNodeIds: [],
          createdAt: now,
          updatedAt: now,
          ...updates,
        }
        next = [...prev, entry]
      }

      if (!user) saveLocalEntries(next)
      return next
    })

    if (!user) return

    try {
      const existing = entries.find(e => e.date === todayStr)
      const mappedUpdates = {
        content: updates.content !== undefined ? updates.content : existing?.content || '',
        mood: updates.mood !== undefined ? updates.mood : existing?.mood || null,
        linked_node_ids: updates.linkedNodeIds !== undefined ? updates.linkedNodeIds : existing?.linkedNodeIds || [],
        updated_at: now
      }

      if (existing) {
        await supabase
          .from('journal_entries')
          .update(mappedUpdates)
          .eq('id', existing.id)
      } else {
        await supabase
          .from('journal_entries')
          .insert({
            date: todayStr,
            user_id: user.id,
            ...mappedUpdates,
            created_at: now
          })
      }
    } catch (err) {
      console.error('Failed to sync journal entry:', err)
    }
  }, [todayStr, user, entries])

  // 3. Delete helper
  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id)
      if (!user) saveLocalEntries(next)
      return next
    })

    if (!user) return

    try {
      await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
    } catch (err) {
      console.error('Failed to delete journal entry:', err)
    }
  }, [user])

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return {
    entries: sortedEntries,
    todayEntry,
    upsertToday,
    deleteEntry,
    loaded,
  }
}
