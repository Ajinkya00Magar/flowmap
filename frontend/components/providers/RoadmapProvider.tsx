'use client'

import React, { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import type { Collaborator, RoadmapContextValue, RoadmapState, RoadmapAction, RoadmapNode, RoadmapListItem } from '@/types/roadmap'
import { useAuth } from './AuthProvider'
import { useToast } from './ToastProvider'
import { supabase } from '@/lib/supabaseClient'
import {
  createDefaultState,
  createBlankState,
  updateNodeInState,
  addNodeToState,
  deleteNodeFromState,
  duplicateNodeInState,
  moveNodeInState,
  toggleExpandInState,
  toggleCompleteInState,
  recalculateProgress,
  exportStateToJSON,
  parseImportedJSON,
} from '@/lib/roadmapUtils'
import { computeStats } from '@/lib/progressUtils'

// ─── Context ──────────────────────────────────────────────────────────────
const RoadmapContext = createContext<RoadmapContextValue | null>(null)

// Reducer function (extracted from useRoadmap.ts)
function roadmapReducer(state: RoadmapState, action: RoadmapAction): RoadmapState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload

    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload, selectedNodeIds: action.payload ? [action.payload] : [] }

    case 'TOGGLE_SELECT_NODE': {
      const isSelected = state.selectedNodeIds.includes(action.payload)
      const newSelectedIds = isSelected
        ? state.selectedNodeIds.filter(id => id !== action.payload)
        : [...state.selectedNodeIds, action.payload]
      return { ...state, selectedNodeIds: newSelectedIds, selectedNodeId: newSelectedIds.length === 1 ? newSelectedIds[0] : null }
    }

    case 'SELECT_MULTIPLE_NODES':
      return { ...state, selectedNodeIds: action.payload, selectedNodeId: action.payload.length === 1 ? action.payload[0] : null }

    case 'UPDATE_NODE':
      return updateNodeInState(state, action.payload.id, action.payload.updates)

    case 'ADD_NODE':
      return addNodeToState(state, action.payload)

    case 'DELETE_NODE':
      return deleteNodeFromState(state, action.payload)

    case 'DUPLICATE_NODE':
      return duplicateNodeInState(state, action.payload)

    case 'MOVE_NODE':
      return moveNodeInState(state, action.payload.id, action.payload.position)

    case 'MOVE_NODES': {
      let next = { ...state, version: state.version + 1, lastSaved: new Date().toISOString() }
      action.payload.ids.forEach(id => {
        const node = next.nodes[id]
        if (node) {
          next.nodes[id] = {
            ...node,
            position: { x: node.position.x + action.payload.delta.dx, y: node.position.y + action.payload.delta.dy }
          }
        }
      })
      return next
    }

    case 'TOGGLE_EXPAND':
      return toggleExpandInState(state, action.payload)

    case 'TOGGLE_COMPLETE':
      return toggleCompleteInState(state, action.payload)

    case 'UPDATE_PROGRESS': {
      let next = updateNodeInState(state, action.payload.id, {
        progress: action.payload.progress,
        status: action.payload.progress === 100
          ? 'completed'
          : action.payload.progress > 0
            ? 'in_progress'
            : 'not_started',
        completed: action.payload.progress === 100,
      })
      const node = state.nodes[action.payload.id]
      if (node?.parentId) {
        next = recalculateProgress(next, node.parentId)
      }
      return next
    }

    case 'REPARENT_NODE': {
      const { id, newParentId } = action.payload
      const node = state.nodes[id]
      if (!node) return state

      let next = { ...state }

      // Remove from old parent
      if (node.parentId && next.nodes[node.parentId]) {
        next = {
          ...next,
          nodes: {
            ...next.nodes,
            [node.parentId]: {
              ...next.nodes[node.parentId],
              childIds: next.nodes[node.parentId].childIds.filter(cId => cId !== id),
            },
          },
        }
      }

      // Add to new parent
      if (newParentId && next.nodes[newParentId]) {
        next = {
          ...next,
          nodes: {
            ...next.nodes,
            [newParentId]: {
              ...next.nodes[newParentId],
              childIds: [...next.nodes[newParentId].childIds, id],
            },
            [id]: {
              ...next.nodes[id],
              parentId: newParentId,
              isRoot: false,
            },
          },
        }
      }

      return { ...next, version: next.version + 1 }
    }

    case 'RESET_TO_DEFAULT':
      return createBlankState()

    case 'IMPORT_STATE':
      return { ...action.payload, selectedNodeId: null }

    default:
      return state
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function RoadmapProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { success, error, info } = useToast()

  // Workspace lists states
  const [folders, setFolders] = useState<any[]>([])
  const [roadmapsList, setRoadmapsList] = useState<RoadmapListItem[]>([])
  const [roadmapCollaborators, setRoadmapCollaborators] = useState<Record<string, Collaborator[]>>({})
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string | null>(null)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true)

  // Active roadmap canvas state
  const [activeState, setActiveState] = useState<RoadmapState | null>(null)
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  // Undo/Redo history stacks
  const pastRef = useRef<RoadmapState[]>([])
  const futureRef = useRef<RoadmapState[]>([])

  // Database Save Debouncer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Save changes to database (debounced)
  const persistState = useCallback((roadmapId: string, stateToSave: RoadmapState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const { error: dbErr } = await supabase
        .from('roadmaps')
        .update({ state: stateToSave })
        .eq('id', roadmapId)
      
      if (dbErr) {
        console.error('Failed to auto-save roadmap:', dbErr)
      } else {
        // Update updated_at locally in the list
        setRoadmapsList(prev => prev.map(r => r.id === roadmapId ? { ...r, updated_at: new Date().toISOString() } : r))
      }
    }, 1000)
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // 1. Fetch folders and roadmaps metadata when user session shifts
  useEffect(() => {
    if (!user) {
      setFolders([])
      setRoadmapsList([])
      setCurrentRoadmapId(null)
      setActiveState(null)
      setIsLoadingWorkspace(false)
      return
    }

    const loadWorkspace = async () => {
      setIsLoadingWorkspace(true)
      try {
        // Fetch folders
        const { data: folderData, error: folderErr } = await supabase
          .from('folders')
          .select('*')
          .order('created_at', { ascending: true })

        if (folderErr) throw folderErr
        setFolders(folderData || [])

        // Fetch memberships for this user so shared roadmaps are included
        let sharedRoadmapIds: string[] = []
        const sharedRoadmapRoles: Record<string, 'editor' | 'viewer'> = {}
        const { data: membershipData, error: membershipErr } = await supabase
          .from('roadmap_memberships')
          .select('roadmap_id, role')
          .eq('user_id', user.id)

        if (membershipErr) {
          const missingTable = membershipErr.message?.includes('roadmap_memberships')
          if (missingTable) {
            console.warn('Supabase schema missing roadmap_memberships; loading owned roadmaps only.')
          } else {
            throw membershipErr
          }
        } else {
          sharedRoadmapIds = membershipData?.map((row: any) => row.roadmap_id) || []
          membershipData?.forEach((row: any) => {
            sharedRoadmapRoles[row.roadmap_id] = row.role === 'viewer' ? 'viewer' : 'editor'
          })
        }

        // Fetch roadmaps the user owns or has membership access to
        let roadmapQuery = supabase
          .from('roadmaps')
          .select('id, name, folder_id, updated_at, user_id')
          .order('updated_at', { ascending: false })

        if (sharedRoadmapIds.length > 0) {
          roadmapQuery = roadmapQuery.or(
            `user_id.eq.${user.id},id.in.(${sharedRoadmapIds.join(',')})`
          )
        } else {
          roadmapQuery = roadmapQuery.eq('user_id', user.id)
        }

        const { data: roadmapData, error: roadmapErr } = await roadmapQuery

        if (roadmapErr) throw roadmapErr

        const ownerIds = Array.from(new Set((roadmapData || []).map((roadmap: any) => roadmap.user_id)))
        let ownerProfiles: any = null
        let ownerErr: any = null

        const ownerQuery = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', ownerIds)

        if (!ownerQuery.error) {
          ownerProfiles = ownerQuery.data
        } else if (ownerQuery.error.message?.includes('display_name')) {
          const fallback = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', ownerIds)

          ownerProfiles = fallback.data
          ownerErr = fallback.error
        } else {
          ownerErr = ownerQuery.error
        }

        if (ownerErr) throw ownerErr

        const ownerMap = (ownerProfiles || []).reduce((acc: Record<string, any>, owner: any) => {
          acc[owner.id] = owner
          return acc
        }, {})

        setRoadmapsList((roadmapData || []).map((roadmap: any) => ({
          ...roadmap,
          isOwner: roadmap.user_id === user.id,
          shared: roadmap.user_id !== user.id,
          role: roadmap.user_id === user.id ? 'owner' : (sharedRoadmapRoles[roadmap.id] || 'viewer'),
          owner: ownerMap[roadmap.user_id] || null,
        })))

        // Select active roadmap
        let activeId = localStorage.getItem(`flowmap_active_id_${user.id}`)
        const matchesCached = roadmapData?.some(r => r.id === activeId)

        if (!activeId || !matchesCached) {
          if (roadmapData && roadmapData.length > 0) {
            activeId = roadmapData[0].id
          } else {
            // Create a default first roadmap
            const defaultState = createDefaultState()
            const { data: newRoadmap, error: createErr } = await supabase
              .from('roadmaps')
              .insert({
                name: 'My Learning Space',
                user_id: user.id,
                state: defaultState,
                folder_id: null
              })
              .select()
              .single()

            if (createErr) throw createErr
            if (newRoadmap) {
              setRoadmapsList([{
                ...newRoadmap,
                isOwner: true,
                shared: false,
                owner: {
                  id: user.id,
                  email: user.email,
                  display_name: null,
                }
              }])
              activeId = newRoadmap.id
            }
          }
        }

        if (activeId) {
          setCurrentRoadmapId(activeId)
          localStorage.setItem(`flowmap_active_id_${user.id}`, activeId)
        }
      } catch (err: any) {
        error(`Failed to load workspace: ${err.message || err}`)
      } finally {
        setIsLoadingWorkspace(false)
      }
    }

    loadWorkspace()
  }, [user, error])

  // 2. Fetch full Roadmap State when active ID changes
  useEffect(() => {
    if (!user || !currentRoadmapId) {
      setActiveState(null)
      return
    }

    let isMounted = true

    const fetchRoadmapState = async () => {
      setIsLoadingRoadmap(true)
      try {
        const { data, error: stateErr } = await supabase
          .from('roadmaps')
          .select('state')
          .eq('id', currentRoadmapId)
          .single()

        if (!isMounted) return

        if (stateErr) throw stateErr
        if (data?.state) {
          const loadedState = {
            ...data.state,
            selectedNodeIds: data.state.selectedNodeIds || []
          } as RoadmapState
          setActiveState(loadedState)
          // Reset history stacks
          pastRef.current = []
          futureRef.current = []
          localStorage.setItem(`flowmap_active_id_${user.id}`, currentRoadmapId)
        }
      } catch (err: any) {
        if (isMounted) error(`Failed to load roadmap canvas: ${err.message || err}`)
      } finally {
        if (isMounted) setIsLoadingRoadmap(false)
      }
    }

    fetchRoadmapState()

    // --- Real-time collaboration subscription ---
    const channel = supabase
      .channel(`roadmap-${currentRoadmapId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'roadmaps', filter: `id=eq.${currentRoadmapId}` },
        (payload) => {
          const newState = payload.new.state as RoadmapState
          if (newState && newState.version !== undefined) {
            setActiveState(prev => {
              // Only accept remote state if it is newer than our local state
              // This prevents our own debounced writes from echoing back and resetting fast local edits
              if (!prev || newState.version > prev.version) {
                return newState
              }
              return prev
            })
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [currentRoadmapId, user, error])

  // ─── Workspace CRUD Operations ───────────────────────────────────────────
  const createFolder = useCallback(async (name: string) => {
    try {
      const { data, error: dbErr } = await supabase
        .from('folders')
        .insert({ name, user_id: user.id })
        .select()
        .single()

      if (dbErr) throw dbErr
      setFolders(prev => [...prev, data])
      success(`Folder "${name}" created`)
    } catch (err: any) {
      error(`Failed to create folder: ${err.message || err}`)
    }
  }, [user?.id, success, error])

  const deleteFolder = useCallback(async (id: string) => {
    try {
      const folderName = folders.find(f => f.id === id)?.name || ''
      const { error: dbErr } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

      if (dbErr) throw dbErr
      setFolders(prev => prev.filter(f => f.id !== id))
      // Unlink roadmaps locally
      setRoadmapsList(prev => prev.map(r => r.folder_id === id ? { ...r, folder_id: null } : r))
      info(`Folder "${folderName}" deleted`)
    } catch (err: any) {
      error(`Failed to delete folder: ${err.message || err}`)
    }
  }, [folders, error, info])

  const renameFolder = useCallback(async (id: string, name: string) => {
    try {
      const { error: dbErr } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', id)

      if (dbErr) throw dbErr
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
      success('Folder renamed')
    } catch (err: any) {
      error(`Failed to rename folder: ${err.message || err}`)
    }
  }, [success, error])

  const createRoadmap = useCallback(async (name: string, folderId: string | null, customState?: RoadmapState) => {
    try {
      const initialState = customState || createDefaultState()
      const { data, error: dbErr } = await supabase
        .from('roadmaps')
        .insert({
          name,
          user_id: user.id,
          folder_id: folderId,
          state: initialState
        })
        .select()
        .single()

      if (dbErr) throw dbErr
      setRoadmapsList(prev => [{
        ...data,
        isOwner: true,
        shared: false,
        role: 'owner',
        owner: {
          id: user.id,
          email: user.email || '',
          display_name: null,
        },
      }, ...prev])

      // Ensure collaboration metadata exists: create an owner membership record
      // so the roadmap immediately supports collaborator listing and sharing.
      try {
        await supabase
          .from('roadmap_memberships')
          .insert({ roadmap_id: data.id, user_id: user.id, role: 'owner' })
      } catch (memErr) {
        // Non-fatal: if the memberships table isn't present (migrations missing), continue silently
        // We'll surface a warning in loadRoadmapCollaborators when needed.
        console.warn('Could not create roadmap_membership for new roadmap:', memErr)
      }
      success(`Roadmap "${name}" created`)
      return data.id
    } catch (err: any) {
      error(`Failed to create roadmap: ${err.message || err}`)
      return null
    }
  }, [user?.id, user?.email, success, error])

  const deleteRoadmap = useCallback(async (id: string) => {
    try {
      const roadmapName = roadmapsList.find(r => r.id === id)?.name || ''
      const { error: dbErr } = await supabase
        .from('roadmaps')
        .delete()
        .eq('id', id)

      if (dbErr) throw dbErr
      
      const filteredList = roadmapsList.filter(r => r.id !== id)
      setRoadmapsList(filteredList)

      info(`Roadmap "${roadmapName}" deleted`)

      // If we deleted the active roadmap, switch to another
      if (id === currentRoadmapId) {
        if (filteredList.length > 0) {
          setCurrentRoadmapId(filteredList[0].id)
        } else {
          // If all deleted, trigger workspace re-init default creation
          setCurrentRoadmapId(null)
        }
      }
    } catch (err: any) {
      error(`Failed to delete roadmap: ${err.message || err}`)
    }
  }, [roadmapsList, currentRoadmapId, info, error])

  const renameRoadmap = useCallback(async (id: string, name: string) => {
    try {
      const { error: dbErr } = await supabase
        .from('roadmaps')
        .update({ name })
        .eq('id', id)

      if (dbErr) throw dbErr
      setRoadmapsList(prev => prev.map(r => r.id === id ? { ...r, name } : r))
      success('Roadmap renamed')
    } catch (err: any) {
      error(`Failed to rename roadmap: ${err.message || err}`)
    }
  }, [success, error])

  const moveRoadmapToFolder = useCallback(async (id: string, folderId: string | null) => {
    try {
      const { error: dbErr } = await supabase
        .from('roadmaps')
        .update({ folder_id: folderId })
        .eq('id', id)

      if (dbErr) throw dbErr
      setRoadmapsList(prev => prev.map(r => r.id === id ? { ...r, folder_id: folderId } : r))
      success('Roadmap moved')
    } catch (err: any) {
      error(`Failed to move roadmap: ${err.message || err}`)
    }
  }, [success, error])

  const duplicateRoadmap = useCallback(async (id: string) => {
    try {
      const original = roadmapsList.find(r => r.id === id)
      if (!original) return

      // Load full state
      const { data: stateData, error: stateErr } = await supabase
        .from('roadmaps')
        .select('state')
        .eq('id', id)
        .single()

      if (stateErr) throw stateErr

      await createRoadmap(`Copy of ${original.name}`, original.folder_id, stateData.state)
    } catch (err: any) {
      error(`Failed to duplicate roadmap: ${err.message || err}`)
    }
  }, [roadmapsList, createRoadmap, error])

  const loadRoadmapCollaborators = useCallback(async (roadmapId: string) => {
    try {
      const { data: membershipData, error: membershipErr } = await supabase
        .from('roadmap_memberships')
        .select('user_id, role')
        .eq('roadmap_id', roadmapId)

      if (membershipErr) {
        const missingTable = membershipErr.message?.includes('roadmap_memberships')
        if (missingTable) {
          console.warn('Supabase schema missing roadmap_memberships; collaborator details unavailable.')
          setRoadmapCollaborators(prev => ({ ...prev, [roadmapId]: [] }))
          return
        }
        throw membershipErr
      }

      const collaborators: Collaborator[] = (membershipData || []).map((row: any) => ({
        id: row.user_id,
        email: row.user_id,
        display_name: null,
        role: row.role === 'viewer' ? 'viewer' : 'editor' as 'viewer' | 'editor',
      }))

      const userIds = collaborators.map(c => c.id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds)

        if (!profileErr && profileData) {
          const profileMap = (profileData || []).reduce((acc: Record<string, any>, profile: any) => {
            acc[profile.id] = profile
            return acc
          }, {})

          for (const collaborator of collaborators) {
            if (profileMap[collaborator.id]) {
              collaborator.email = profileMap[collaborator.id].email || collaborator.email
              collaborator.display_name = profileMap[collaborator.id].display_name || null
            }
          }
        }
      }

      setRoadmapCollaborators(prev => ({
        ...prev,
        [roadmapId]: collaborators,
      }))
    } catch (err: any) {
      console.error('Failed to load roadmap collaborators:', err)
      setRoadmapCollaborators(prev => ({ ...prev, [roadmapId]: [] }))
    }
  }, [])

  const shareRoadmap = useCallback(async (roadmapId: string, collaboratorEmail: string, role: 'viewer' | 'editor' = 'editor') => {
    try {
      if (!user) throw new Error('You must be signed in to share roadmaps.')
      const email = collaboratorEmail.trim().toLowerCase()

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', email)
        .limit(1)
        .maybeSingle()

      if (profileErr) throw profileErr
      if (!profileData) throw new Error(`No FlowMap account found for ${email}. Ask them to sign up first, then try sharing again.`)
      if (profileData.id === user.id) {
        info('This roadmap is already owned by you.')
        return false
      }

      const { error: membershipErr } = await supabase
        .from('roadmap_memberships')
        .upsert(
          { roadmap_id: roadmapId, user_id: profileData.id, role },
          { onConflict: 'roadmap_id,user_id' }
        )

      if (membershipErr) {
        const missingTable = membershipErr.message?.includes('roadmap_memberships')
        if (missingTable) {
          throw new Error('Sharing is unavailable until database migrations are applied.')
        }

        if (membershipErr.code === '23505') {
          const { error: updateErr } = await supabase
            .from('roadmap_memberships')
            .update({ role })
            .eq('roadmap_id', roadmapId)
            .eq('user_id', profileData.id)

          if (updateErr) {
            throw updateErr
          }
          info(`Updated ${email} to ${role}`)
          await loadRoadmapCollaborators(roadmapId)
          return true
        }
        throw membershipErr
      }

      await loadRoadmapCollaborators(roadmapId)
      success(`Roadmap shared with ${email} as ${role}`)
      return true
    } catch (err: any) {
      error(`Failed to share roadmap: ${err.message || err}`)
      return false
    }
  }, [user, info, error, loadRoadmapCollaborators, success])

  // ─── Dispatch with Undo / Redo ──────────────────────────────────────────
  const dispatch = useCallback((action: RoadmapAction) => {
    if (!activeState || !currentRoadmapId) return
    const currentRole = roadmapsList.find(r => r.id === currentRoadmapId)?.role ?? 'viewer'
    const canEdit = currentRole === 'owner' || currentRole === 'editor'

    const writeActions = new Set([
      'ADD_NODE', 'DELETE_NODE', 'DUPLICATE_NODE', 'TOGGLE_COMPLETE',
      'UPDATE_PROGRESS', 'REPARENT_NODE', 'IMPORT_STATE', 'RESET_TO_DEFAULT',
    ])

    if (!canEdit && writeActions.has(action.type)) {
      info('You have view-only access to this roadmap.')
      return
    }

    const historyActions = new Set([
      'ADD_NODE', 'DELETE_NODE', 'DUPLICATE_NODE', 'TOGGLE_COMPLETE',
      'UPDATE_PROGRESS', 'REPARENT_NODE', 'IMPORT_STATE',
    ])

    const shouldSnapshot = historyActions.has(action.type)

    setActiveState(prevState => {
      if (!prevState) return prevState
      const nextState = roadmapReducer(prevState, action)

      if (action.type === 'RESET_TO_DEFAULT') {
        pastRef.current = []
        futureRef.current = []
      } else if (shouldSnapshot) {
        pastRef.current = [...pastRef.current, prevState]
        futureRef.current = [] // clear redo stack
      }

      persistState(currentRoadmapId, nextState)
      return nextState
    })

    // Fire toast on primary actions
    switch (action.type) {
      case 'ADD_NODE':
        info(`Node "${action.payload.title}" created`)
        break
      case 'DELETE_NODE': {
        const node = activeState.nodes[action.payload]
        if (node) info(`"${node.title}" deleted`)
        break
      }
      case 'DUPLICATE_NODE': {
        const node = activeState.nodes[action.payload]
        if (node) info(`"${node.title}" duplicated`)
        break
      }
      case 'TOGGLE_COMPLETE': {
        const node = activeState.nodes[action.payload]
        if (node) {
          if (!node.completed) success(`✓ "${node.title}" completed!`)
          else info(`"${node.title}" marked incomplete`)
        }
        break
      }
      case 'RESET_TO_DEFAULT':
        info('Roadmap reset to default')
        break
      case 'IMPORT_STATE':
        success('Roadmap imported successfully')
        break
    }
  }, [activeState, currentRoadmapId, persistState, info, success, roadmapsList])

  // Undo/Redo methods
  const undo = useCallback(() => {
    if (pastRef.current.length === 0 || !currentRoadmapId || !activeState) return
    const prev = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [activeState, ...futureRef.current]

    setActiveState(prev)
    persistState(currentRoadmapId, prev)
    info('Undo action')
  }, [activeState, currentRoadmapId, persistState, info])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0 || !currentRoadmapId || !activeState) return
    const next = futureRef.current[0]
    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [...pastRef.current, activeState]

    setActiveState(next)
    persistState(currentRoadmapId, next)
    info('Redo action')
  }, [activeState, currentRoadmapId, persistState, info])

  const canUndo = pastRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          if (e.shiftKey) redo()
          else undo()
        }
        if (e.key === 'y') {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Compute stats on active state
  const stats = useMemo(() => {
    return activeState ? computeStats(activeState) : {
      totalNodes: 0,
      completedNodes: 0,
      inProgressNodes: 0,
      overallProgress: 0,
      totalEstimatedHours: 0,
      completedHours: 0,
      streak: 0,
      todayCompleted: 0,
      currentFocus: null
    }
  }, [activeState])

  const editingNode = useMemo(() => {
    if (!activeState || !editingNodeId) return null
    return activeState.nodes[editingNodeId] ?? null
  }, [activeState, editingNodeId])

  useEffect(() => {
    if (editingNodeId && activeState && !activeState.nodes[editingNodeId]) {
      setEditingNodeId(null)
    }
  }, [activeState, editingNodeId])

  const openNodeEditor = useCallback((id: string | null) => {
    setEditingNodeId(id)
  }, [])

  const closeNodeEditor = useCallback(() => {
    setEditingNodeId(null)
  }, [])

  const selectedNode = useMemo(() => {
    if (!activeState || !activeState.selectedNodeId) return null
    return activeState.nodes[activeState.selectedNodeId] ?? null
  }, [activeState])

  const exportJSON = useCallback(() => {
    if (activeState) exportStateToJSON(activeState)
  }, [activeState])

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const json = e.target?.result as string
      const parsed = parseImportedJSON(json)
      if (parsed) {
        dispatch({ type: 'IMPORT_STATE', payload: parsed })
      }
    }
    reader.readAsText(file)
  }, [dispatch])

  const resetToDefault = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULT' })
  }, [dispatch])

  const currentRole = currentRoadmapId
    ? roadmapsList.find(r => r.id === currentRoadmapId)?.role ?? 'viewer'
    : 'viewer'

  const value = useMemo<RoadmapContextValue>(() => ({
    // Current Roadmap Canvas
    state: activeState || { nodes: {}, rootIds: [], selectedNodeId: null, selectedNodeIds: [], version: 0, lastSaved: '' },
    dispatch,
    stats,
    selectedNode,
    editingNode,
    openNodeEditor,
    closeNodeEditor,
    undo,
    redo,
    canUndo,
    canRedo,
    exportJSON,
    importJSON,
    resetToDefault,

    // Workspaces Folders and Multi-Roadmaps Explorer API
    folders,
    roadmapsList,
    currentRoadmapId,
    setCurrentRoadmapId,
    createFolder,
    deleteFolder,
    renameFolder,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    moveRoadmapToFolder,
    duplicateRoadmap,
    shareRoadmap,
    loadRoadmapCollaborators,
    roadmapCollaborators,
    currentRoadmapRole: currentRole,
    canEditCurrentRoadmap: currentRole === 'owner' || currentRole === 'editor',
    isLoadingWorkspace: isLoadingWorkspace || isLoadingRoadmap
  }), [
    activeState, dispatch, stats, selectedNode, editingNode, openNodeEditor, closeNodeEditor, undo, redo, canUndo, canRedo,
    exportJSON, importJSON, resetToDefault, folders, roadmapsList, currentRoadmapId, createFolder, deleteFolder,
    renameFolder, createRoadmap, deleteRoadmap, renameRoadmap, moveRoadmapToFolder, duplicateRoadmap, shareRoadmap,
    loadRoadmapCollaborators, roadmapCollaborators, currentRole, isLoadingWorkspace, isLoadingRoadmap
  ])

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  )
}

// Consumer hook
export function useRoadmapContext(): RoadmapContextValue {
  const ctx = useContext(RoadmapContext)
  if (!ctx) throw new Error('useRoadmapContext must be used within a RoadmapProvider')
  return ctx
}




