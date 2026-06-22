// ─── Core Roadmap Types ────────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type NodeColor =
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'cyan'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'teal'

export type NodeStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export interface Resource {
  id: string
  title: string
  url: string
  type: 'video' | 'article' | 'course' | 'book' | 'tool' | 'other'
}

export interface ChildTask {
  id: string
  title: string
  completed: boolean
}

export interface RoadmapNode {
  // Identity
  id: string
  title: string
  description: string

  // Hierarchy
  parentId: string | null
  childIds: string[]

  // Visual Position
  position: { x: number; y: number }

  // Metadata
  color: NodeColor
  priority: Priority
  status: NodeStatus
  progress: number          // 0–100, auto-computed for parent nodes

  // Scheduling
  deadline: string | null   // ISO date string
  estimatedHours: number

  // Content
  notes: string
  resources: Resource[]
  prerequisites: string[]   // node ids
  childTasks: ChildTask[]

  // Flags
  isExpanded: boolean
  isRoot: boolean           // top-level category node
  completed: boolean
  width?: number
  height?: number
  hideCheckbox?: boolean
  hideStrikethrough?: boolean

  // Timestamps (ready for Supabase migration)
  createdAt: string
  updatedAt: string
}

// ─── Roadmap State ─────────────────────────────────────────────────────────

export interface RoadmapState {
  nodes: Record<string, RoadmapNode>
  rootIds: string[]                    // ordered top-level category ids
  selectedNodeId: string | null
  selectedNodeIds: string[]            // newly added for multi-selection lasso
  version: number                      // incremented on every mutation
  lastSaved: string
  layout?: string                      // optional layout structure to apply
}

export interface RoadmapOwner {
  id: string
  email: string
  display_name: string | null
}

export interface RoadmapListItem {
  id: string
  name: string
  folder_id: string | null
  updated_at: string
  user_id: string
  isOwner: boolean
  shared: boolean
  role: 'owner' | 'editor' | 'viewer'
  owner?: RoadmapOwner
}

export interface Collaborator {
  id: string
  email: string
  display_name: string | null
  role: 'editor' | 'viewer'
}

// ─── Dashboard / Stats ─────────────────────────────────────────────────────

export interface RoadmapStats {
  totalNodes: number
  completedNodes: number
  inProgressNodes: number
  overallProgress: number              // 0–100
  totalEstimatedHours: number
  completedHours: number
  streak: number
  todayCompleted: number
  currentFocus: string | null
}

// ─── Canvas State ──────────────────────────────────────────────────────────

export interface CanvasTransform {
  x: number
  y: number
  scale: number
}

export interface CanvasState {
  transform: CanvasTransform
  isDragging: boolean
  dragNodeId: string | null
}

// ─── History (Undo/Redo) ───────────────────────────────────────────────────

export interface HistoryEntry {
  state: RoadmapState
  description: string
  timestamp: string
}

// ─── Actions ───────────────────────────────────────────────────────────────

export type RoadmapAction =
  | { type: 'SET_STATE'; payload: RoadmapState }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'TOGGLE_SELECT_NODE'; payload: string }
  | { type: 'SELECT_MULTIPLE_NODES'; payload: string[] }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<RoadmapNode> } }
  | { type: 'ADD_NODE'; payload: RoadmapNode }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'DUPLICATE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'MOVE_NODES'; payload: { ids: string[]; delta: { dx: number; dy: number } } }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'TOGGLE_COMPLETE'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'REPARENT_NODE'; payload: { id: string; newParentId: string | null } }
  | { type: 'RESET_TO_DEFAULT' }
  | { type: 'IMPORT_STATE'; payload: RoadmapState }

// ─── Context ───────────────────────────────────────────────────────────────

export interface UserPreferences {
  animations: boolean
  particles: boolean
  autoSave: boolean
  compactNodes: boolean
}

export interface RoadmapContextValue {
  state: RoadmapState
  dispatch: React.Dispatch<RoadmapAction>
  stats: RoadmapStats
  selectedNode: RoadmapNode | null
  editingNode: RoadmapNode | null
  openNodeEditor: (id: string | null) => void
  closeNodeEditor: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  exportJSON: () => void
  importJSON: (file: File) => void
  resetToDefault: () => void

  // Workspace explorer extensions
  folders: Array<{ id: string; name: string; created_at: string }>
  roadmapsList: RoadmapListItem[]
  currentRoadmapId: string | null
  setCurrentRoadmapId: (id: string | null) => void
  createFolder: (name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  createRoadmap: (name: string, folderId: string | null, customState?: RoadmapState) => Promise<string | null>
  deleteRoadmap: (id: string) => Promise<void>
  renameRoadmap: (id: string, name: string) => Promise<void>
  moveRoadmapToFolder: (id: string, folderId: string | null) => Promise<void>
  duplicateRoadmap: (id: string) => Promise<void>
  shareRoadmap: (roadmapId: string, collaboratorEmail: string, role?: 'viewer' | 'editor') => Promise<boolean>
  loadRoadmapCollaborators: (roadmapId: string) => Promise<void>
  roadmapCollaborators: Record<string, Collaborator[]>
  currentRoadmapRole: 'owner' | 'editor' | 'viewer'
  canEditCurrentRoadmap: boolean
  isLoadingWorkspace: boolean
  prefs: UserPreferences
  updatePref: (key: keyof UserPreferences, val: boolean) => void
}

// ─── Node Color Map (for styling) ─────────────────────────────────────────

export const NODE_COLOR_MAP: Record<NodeColor, {
  bg: string
  border: string
  glow: string
  text: string
  progress: string
}> = {
  indigo: {
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.35)',
    glow: 'rgba(99,102,241,0.4)',
    text: '#a5b4fc',
    progress: '#6366F1',
  },
  violet: {
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.35)',
    glow: 'rgba(139,92,246,0.4)',
    text: '#c4b5fd',
    progress: '#8B5CF6',
  },
  emerald: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    glow: 'rgba(16,185,129,0.4)',
    text: '#6ee7b7',
    progress: '#10B981',
  },
  cyan: {
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.35)',
    glow: 'rgba(6,182,212,0.4)',
    text: '#67e8f9',
    progress: '#06B6D4',
  },
  amber: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    glow: 'rgba(245,158,11,0.4)',
    text: '#fcd34d',
    progress: '#F59E0B',
  },
  rose: {
    bg: 'rgba(244,63,94,0.12)',
    border: 'rgba(244,63,94,0.35)',
    glow: 'rgba(244,63,94,0.4)',
    text: '#fda4af',
    progress: '#F43F5E',
  },
  blue: {
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    glow: 'rgba(59,130,246,0.4)',
    text: '#93c5fd',
    progress: '#3B82F6',
  },
  teal: {
    bg: 'rgba(20,184,166,0.12)',
    border: 'rgba(20,184,166,0.35)',
    glow: 'rgba(20,184,166,0.4)',
    text: '#5eead4',
    progress: '#14B8A6',
  },
}

export const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#6b7280' },
  medium: { label: 'Medium', color: '#F59E0B' },
  high: { label: 'High', color: '#F97316' },
  critical: { label: 'Critical', color: '#EF4444' },
}

export const STATUS_MAP: Record<NodeStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: '#6b7280' },
  in_progress: { label: 'In Progress', color: '#6366F1' },
  completed: { label: 'Completed', color: '#10B981' },
  blocked: { label: 'Blocked', color: '#EF4444' },
}

