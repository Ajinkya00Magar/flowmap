import { v4 as uuidv4 } from 'uuid'
import type { RoadmapNode, RoadmapState, NodeColor } from '@/types/roadmap'
import { buildDefaultNodes, DEFAULT_ROOT_IDS } from './defaultRoadmap'

// ─── State Factory ────────────────────────────────────────────────────────

export function createDefaultState(): RoadmapState {
  return {
    nodes: buildDefaultNodes(),
    rootIds: DEFAULT_ROOT_IDS,
    selectedNodeId: null,
    selectedNodeIds: [],
    version: 0,
    lastSaved: new Date().toISOString(),
  }
}

export function createBlankState(): RoadmapState {
  return {
    nodes: {},
    rootIds: [],
    selectedNodeId: null,
    selectedNodeIds: [],
    version: 0,
    lastSaved: new Date().toISOString(),
  }
}

// ─── Node Creation ────────────────────────────────────────────────────────

export function createNode(
  parentId: string | null,
  position: { x: number; y: number },
  color: NodeColor = 'indigo',
  title = 'New Node'
): RoadmapNode {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    title,
    description: '',
    parentId,
    childIds: [],
    position,
    color,
    priority: 'medium',
    status: 'not_started',
    progress: 0,
    deadline: null,
    estimatedHours: 0,
    notes: '',
    resources: [],
    prerequisites: [],
    childTasks: [],
    isExpanded: true,
    isRoot: parentId === null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Node Updates ─────────────────────────────────────────────────────────

export function updateNodeInState(
  state: RoadmapState,
  id: string,
  updates: Partial<RoadmapNode>
): RoadmapState {
  const node = state.nodes[id]
  if (!node) return state

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [id]: {
        ...node,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    },
    version: state.version + 1,
    lastSaved: new Date().toISOString(),
  }
}

// ─── Add Node ─────────────────────────────────────────────────────────────

export function addNodeToState(state: RoadmapState, newNode: RoadmapNode): RoadmapState {
  const nextNodes = { ...state.nodes, [newNode.id]: newNode }
  let nextRootIds = [...state.rootIds]

  // Attach to parent
  if (newNode.parentId && nextNodes[newNode.parentId]) {
    nextNodes[newNode.parentId] = {
      ...nextNodes[newNode.parentId],
      childIds: [...nextNodes[newNode.parentId].childIds, newNode.id],
      updatedAt: new Date().toISOString(),
    }
  } else if (!newNode.parentId) {
    nextRootIds = [...nextRootIds, newNode.id]
  }

  return {
    ...state,
    nodes: nextNodes,
    rootIds: nextRootIds,
    version: state.version + 1,
    lastSaved: new Date().toISOString(),
  }
}

// ─── Delete Node (recursive) ──────────────────────────────────────────────

export function deleteNodeFromState(state: RoadmapState, id: string): RoadmapState {
  const node = state.nodes[id]
  if (!node) return state

  // Collect all descendants
  const toDelete = new Set<string>()
  function collectDescendants(nodeId: string) {
    toDelete.add(nodeId)
    const n = state.nodes[nodeId]
    if (n) {
      n.childIds.forEach(collectDescendants)
    }
  }
  collectDescendants(id)

  const nextNodes = { ...state.nodes }
  toDelete.forEach(dId => delete nextNodes[dId])

  // Remove from parent
  if (node.parentId && nextNodes[node.parentId]) {
    nextNodes[node.parentId] = {
      ...nextNodes[node.parentId],
      childIds: nextNodes[node.parentId].childIds.filter(cId => cId !== id),
      updatedAt: new Date().toISOString(),
    }
  }

  const nextRootIds = state.rootIds.filter(rId => rId !== id)

  return {
    ...state,
    nodes: nextNodes,
    rootIds: nextRootIds,
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    version: state.version + 1,
    lastSaved: new Date().toISOString(),
  }
}

// ─── Duplicate Node ───────────────────────────────────────────────────────

export function duplicateNodeInState(state: RoadmapState, id: string): RoadmapState {
  const node = state.nodes[id]
  if (!node) return state

  const now = new Date().toISOString()
  const newNode: RoadmapNode = {
    ...node,
    id: uuidv4(),
    title: `${node.title} (copy)`,
    position: { x: node.position.x + 180, y: node.position.y + 40 },
    childIds: [],
    completed: false,
    progress: 0,
    createdAt: now,
    updatedAt: now,
  }

  return addNodeToState(state, newNode)
}

// ─── Move Node ────────────────────────────────────────────────────────────

export function moveNodeInState(
  state: RoadmapState,
  id: string,
  position: { x: number; y: number }
): RoadmapState {
  return updateNodeInState(state, id, { position })
}

// ─── Toggle Expand ────────────────────────────────────────────────────────

export function toggleExpandInState(state: RoadmapState, id: string): RoadmapState {
  const node = state.nodes[id]
  if (!node) return state
  return updateNodeInState(state, id, { isExpanded: !node.isExpanded })
}

// ─── Toggle Complete ──────────────────────────────────────────────────────

function setSubtreeCompletion(state: RoadmapState, id: string, completed: boolean): RoadmapState {
  const subtreeIds = getSubtree(state, id)
  let nextState = state

  subtreeIds.forEach(nodeId => {
    const target = nextState.nodes[nodeId]
    if (!target) return

    nextState = updateNodeInState(nextState, nodeId, {
      completed,
      status: completed ? 'completed' : 'not_started',
      progress: completed ? 100 : 0,
    })
  })

  return nextState
}

export function toggleCompleteInState(state: RoadmapState, id: string): RoadmapState {
  const node = state.nodes[id]
  if (!node) return state

  const completed = !node.completed
  const subtreeIds = getSubtree(state, id)

  let nextState = setSubtreeCompletion(state, id, completed)
  const exempt = new Set<string>(subtreeIds)
  nextState = resolvePrerequisiteBlocking(nextState, exempt)
  nextState = recalculateProgressForParents(nextState, subtreeIds)

  return nextState
}

function recalculateProgressForParents(state: RoadmapState, nodeIds: string[]): RoadmapState {
  const parentIds = new Set<string>()

  nodeIds.forEach(nodeId => {
    let current = state.nodes[nodeId]
    while (current?.parentId) {
      parentIds.add(current.parentId)
      current = state.nodes[current.parentId]
    }
  })

  const sortedParentIds = Array.from(parentIds).sort((a, b) =>
    getAncestors(state, b).length - getAncestors(state, a).length
  )

  return sortedParentIds.reduce((nextState, parentId) => recalculateProgress(nextState, parentId), state)
}

// ─── Progress Recalculation ───────────────────────────────────────────────

export function recalculateProgress(state: RoadmapState, nodeId: string): RoadmapState {
  const node = state.nodes[nodeId]
  if (!node) return state

  if (node.status === 'blocked' || hasIncompletePrerequisites(state, nodeId)) {
    let nextState = updateNodeInState(state, nodeId, {
      completed: false,
      status: 'blocked',
      progress: 0,
    })

    if (node.parentId) {
      nextState = recalculateProgress(nextState, node.parentId)
    }

    return nextState
  }

  if (node.childIds.length === 0) return state

  const children = node.childIds.map(id => state.nodes[id]).filter(Boolean)
  const totalProgress = children.reduce((sum, c) => sum + c.progress, 0)
  const avgProgress = Math.round(totalProgress / children.length)
  const allCompleted = children.every(c => c.completed)

  let nextState = updateNodeInState(state, nodeId, {
    progress: avgProgress,
    completed: allCompleted,
    status: allCompleted ? 'completed' : avgProgress > 0 ? 'in_progress' : 'not_started',
  })

  // Bubble up to grandparent
  if (node.parentId) {
    nextState = recalculateProgress(nextState, node.parentId)
  }

  return nextState
}

// ─── Prerequisite helpers ─────────────────────────────────────────────────

export function hasIncompletePrerequisites(
  state: RoadmapState,
  nodeId: string,
  exemptIds?: Set<string>
): boolean {
  const node = state.nodes[nodeId]
  if (!node) return false

  return node.prerequisites.some(prereqId => {
    if (exemptIds && exemptIds.has(prereqId)) return false
    return !state.nodes[prereqId]?.completed
  })
}

export function resolvePrerequisiteBlocking(state: RoadmapState, exemptIds?: Set<string>): RoadmapState {
  const nextNodes = { ...state.nodes }
  let changed = false
  const now = new Date().toISOString()

  Object.values(state.nodes).forEach(node => {
    const blocked = hasIncompletePrerequisites(state, node.id, exemptIds)

    if (blocked) {
      if (node.completed || node.status !== 'blocked' || node.progress !== 0) {
        nextNodes[node.id] = {
          ...node,
          completed: false,
          status: 'blocked',
          progress: 0,
          updatedAt: now,
        }
        changed = true
      }
    } else if (node.status === 'blocked') {
      nextNodes[node.id] = {
        ...node,
        status: node.completed ? 'completed' : node.progress > 0 ? 'in_progress' : 'not_started',
        updatedAt: now,
      }
      changed = true
    }
  })

  if (!changed) return state

  return {
    ...state,
    nodes: nextNodes,
    version: state.version + 1,
    lastSaved: now,
  }
}

// ─── Get Ancestors ────────────────────────────────────────────────────────

export function getAncestors(state: RoadmapState, nodeId: string): string[] {
  const ancestors: string[] = []
  let current = state.nodes[nodeId]
  while (current?.parentId) {
    ancestors.push(current.parentId)
    current = state.nodes[current.parentId]
  }
  return ancestors
}

// ─── Get Subtree ──────────────────────────────────────────────────────────

export function getSubtree(state: RoadmapState, nodeId: string): string[] {
  const ids: string[] = [nodeId]
  function collect(id: string) {
    const node = state.nodes[id]
    if (!node) return
    node.childIds.forEach(cId => {
      ids.push(cId)
      collect(cId)
    })
  }
  collect(nodeId)
  return ids
}

// ─── Connection pairs (for SVG lines) ─────────────────────────────────────

export interface Connection {
  id: string
  sourceId: string
  targetId: string
}

export function getVisibleConnections(state: RoadmapState): Connection[] {
  const connections: Connection[] = []
  const { nodes } = state

  Object.values(nodes).forEach(node => {
    if (node.parentId) {
      const parent = nodes[node.parentId]
      if (parent && parent.isExpanded) {
        connections.push({
          id: `${node.parentId}->${node.id}`,
          sourceId: node.parentId,
          targetId: node.id,
        })
      }
    }

    node.prerequisites.forEach(prereqId => {
      if (!nodes[prereqId]) return
      connections.push({
        id: `${prereqId}->${node.id}:prereq`,
        sourceId: prereqId,
        targetId: node.id,
      })
    })
  })

  return connections
}

// ─── JSON export/import ───────────────────────────────────────────────────

export function exportStateToJSON(state: RoadmapState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flowmap-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportedJSON(json: string): RoadmapState | null {
  try {
    const parsed = JSON.parse(json)
    if (!parsed.nodes || !parsed.rootIds) return null
    return {
      ...parsed,
      selectedNodeIds: parsed.selectedNodeIds || []
    } as RoadmapState
  } catch {
    return null
  }
}

// ─── Snap position to grid ────────────────────────────────────────────────

export function snapToGrid(pos: { x: number; y: number }, gridSize = 20): { x: number; y: number } {
  return {
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  }
}
