import type { RoadmapState, RoadmapStats } from '@/types/roadmap'

// ─── Compute global stats ─────────────────────────────────────────────────

export function computeStats(state: RoadmapState): RoadmapStats {
  const nodes = Object.values(state.nodes)
  const leafNodes = nodes.filter(n => n.childIds.length === 0)
  const completedLeafs = leafNodes.filter(n => n.completed)
  const inProgress = nodes.filter(n => n.status === 'in_progress')

  const totalHours = nodes.reduce((sum, n) => sum + n.estimatedHours, 0)
  const completedHours = nodes
    .filter(n => n.completed)
    .reduce((sum, n) => sum + n.estimatedHours, 0)

  const overallProgress =
    leafNodes.length > 0
      ? Math.round((completedLeafs.length / leafNodes.length) * 100)
      : 0

  const rootNodes = state.rootIds.map(id => state.nodes[id]).filter(Boolean)
  const focusNode =
    rootNodes.find(n => n.status === 'in_progress') ||
    rootNodes.find(n => n.status === 'not_started') ||
    null

  const today = new Date().toDateString()
  const todayCompleted = nodes.filter(
    n => n.completed && new Date(n.updatedAt).toDateString() === today
  ).length

  const streak = computeStreak()

  return {
    totalNodes: leafNodes.length,
    completedNodes: completedLeafs.length,
    inProgressNodes: inProgress.length,
    overallProgress,
    totalEstimatedHours: totalHours,
    completedHours,
    streak,
    todayCompleted,
    currentFocus: focusNode?.title ?? null,
  }
}

// ─── Streak tracker ───────────────────────────────────────────────────────

const STREAK_KEY = 'flowmap_streak'

interface StreakData {
  count: number
  lastActiveDate: string
}

function computeStreak(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return 0
    const data: StreakData = JSON.parse(raw)
    const today = new Date().toDateString()
    const last = new Date(data.lastActiveDate).toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (last === today) return data.count
    if (last === yesterday) return data.count
    return 0
  } catch {
    return 0
  }
}

export function recordActivity(): void {
  if (typeof window === 'undefined') return
  try {
    const today = new Date().toDateString()
    const raw = localStorage.getItem(STREAK_KEY)
    let data: StreakData = { count: 1, lastActiveDate: today }
    if (raw) {
      const existing: StreakData = JSON.parse(raw)
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const last = new Date(existing.lastActiveDate).toDateString()
      if (last === today) {
        data = existing
      } else if (last === yesterday) {
        data = { count: existing.count + 1, lastActiveDate: today }
      } else {
        data = { count: 1, lastActiveDate: today }
      }
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify(data))
  } catch {
    // noop
  }
}

// ─── Category progress ────────────────────────────────────────────────────

export interface CategoryProgress {
  id: string
  title: string
  color: string
  progress: number
  completed: number
  total: number
}

export function getCategoryProgress(state: RoadmapState): CategoryProgress[] {
  const results: CategoryProgress[] = []

  state.rootIds.forEach(rootId => {
    const root = state.nodes[rootId]
    if (!root) return

    const leafIds: string[] = []
    function collectLeafs(nodeId: string) {
      const node = state.nodes[nodeId]
      if (!node) return
      if (node.childIds.length === 0) {
        leafIds.push(nodeId)
      } else {
        node.childIds.forEach(collectLeafs)
      }
    }
    collectLeafs(rootId)

    const leafNodes = leafIds.map(id => state.nodes[id]).filter((n): n is NonNullable<typeof n> => Boolean(n))
    const completedCount = leafNodes.filter(n => n.completed).length

    results.push({
      id: rootId,
      title: root.title,
      color: root.color as string,
      progress: leafNodes.length > 0
        ? Math.round((completedCount / leafNodes.length) * 100)
        : 0,
      completed: completedCount,
      total: leafNodes.length,
    })
  })

  return results
}

// ─── Upcoming deadlines ───────────────────────────────────────────────────

export interface DeadlineItem {
  id: string
  title: string
  deadline: string
  daysLeft: number
  color: string
}

export function getUpcomingDeadlines(state: RoadmapState, limit = 5): DeadlineItem[] {
  const now = Date.now()
  return Object.values(state.nodes)
    .filter(n => n.deadline && !n.completed)
    .map(n => {
      const deadline = new Date(n.deadline!).getTime()
      const daysLeft = Math.ceil((deadline - now) / 86400000)
      return {
        id: n.id,
        title: n.title,
        deadline: n.deadline!,
        daysLeft,
        color: n.color as string,
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit)
}

// ─── Format helpers ───────────────────────────────────────────────────────

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 8)
  return `${days}d`
}

export function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `${days}d left`
  if (days < 30) return `${Math.floor(days / 7)}w left`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
