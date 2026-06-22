'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { RoadmapAction, RoadmapState, RoadmapNode } from '@/types/roadmap'
import { useHistory } from './useHistory'
import { useLocalStorage } from './useLocalStorage'
import {
  createDefaultState,
  createBlankState,
  createNode,
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

const STORAGE_KEY = 'flowmap_state_v1'

// ─── Reducer ──────────────────────────────────────────────────────────────

function roadmapReducer(state: RoadmapState, action: RoadmapAction): RoadmapState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload

    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload }

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

    case 'TOGGLE_EXPAND':
      return toggleExpandInState(state, action.payload)

    case 'TOGGLE_COMPLETE':
      return toggleCompleteInState(state, action.payload)

    case 'TOGGLE_SUBTASK': {
      const { nodeId, taskId } = action.payload
      const node = state.nodes[nodeId]
      if (!node) return state

      const childTasks = node.childTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )

      const completedCount = childTasks.filter(t => t.completed).length
      const progress = childTasks.length > 0 ? Math.round((completedCount / childTasks.length) * 100) : node.progress

      let next = updateNodeInState(state, nodeId, {
        childTasks,
        progress,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
        completed: progress === 100,
      })

      if (node.parentId) {
        next = recalculateProgress(next, node.parentId)
      }
      return next
    }

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

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useRoadmap() {
  const [persisted, setPersisted] = useLocalStorage<RoadmapState | null>(STORAGE_KEY, null)
  const initialized = useRef(false)

  const initialState = useMemo(() => {
    return persisted ?? createDefaultState()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    state,
    push,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  } = useHistory(initialState)

  // Sync persisted state on first load
  useEffect(() => {
    if (!initialized.current && persisted) {
      reset(persisted)
      initialized.current = true
    }
  }, [persisted, reset])

  // Auto-save to localStorage when state changes
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setPersisted(state)
    }, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, setPersisted])

  // Dispatch with history tracking
  const dispatch = useCallback((action: RoadmapAction) => {
    // Actions that should create history snapshots
    const historyActions = new Set([
      'ADD_NODE', 'DELETE_NODE', 'DUPLICATE_NODE', 'TOGGLE_COMPLETE',
      'UPDATE_PROGRESS', 'REPARENT_NODE', 'IMPORT_STATE', 'TOGGLE_SUBTASK'
    ])

    const shouldSnapshot = historyActions.has(action.type)

    if (shouldSnapshot) {
      const next = roadmapReducer(state, action)
      push(next)
    } else {
      // For frequent updates (MOVE_NODE, UPDATE_NODE), skip snapshot to save memory
      const next = roadmapReducer(state, action)
      reset(next) // updates state without touching history
    }
  }, [state, push, reset])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
        }
        if (e.key === 'y') {
          e.preventDefault()
          redo()
        }
        if (e.key === 's') {
          e.preventDefault()
          setPersisted(state) // Manual save
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, state, setPersisted])

  const stats = useMemo(() => computeStats(state), [state])
  const selectedNode = state.selectedNodeId ? state.nodes[state.selectedNodeId] ?? null : null

  const exportJSON = useCallback(() => exportStateToJSON(state), [state])

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

  return {
    state,
    dispatch,
    stats,
    selectedNode,
    undo,
    redo,
    canUndo,
    canRedo,
    exportJSON,
    importJSON,
    resetToDefault,
  }
}
