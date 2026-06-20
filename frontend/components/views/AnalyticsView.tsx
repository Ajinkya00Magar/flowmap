'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, CheckCircle2, Clock, Target,
  Zap, Trophy, BookOpen, Flame, ArrowUp, ArrowDown
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { NODE_COLOR_MAP } from '@/types/roadmap'
import { formatHours } from '@/lib/progressUtils'

// ─── Helpers ──────────────────────────────────────────────────────────────

function cardStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: 'rgba(13,17,23,0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 20,
    ...extra,
  }
}

// ─── Stat card ────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sublabel, color, trend,
}: {
  icon: React.ReactNode; label: string; value: string | number
  sublabel?: string; color?: string; trend?: 'up' | 'down' | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={cardStyle({ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' })}
    >
      {/* Glow bg */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: color ? `${color}18` : 'rgba(99,102,241,0.08)',
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: color ? `${color}18` : 'rgba(99,102,241,0.12)',
          border: `1px solid ${color ? `${color}30` : 'rgba(99,102,241,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color ?? '#818CF8',
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, color: trend === 'up' ? '#10B981' : '#EF4444',
          }}>
            {trend === 'up' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          </div>
        )}
      </div>

      <div>
        <div style={{
          fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.92)',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
            {sublabel}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{
        margin: 0, fontSize: 15, fontWeight: 700,
        color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em',
      }}>{title}</h2>
      {subtitle && (
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{subtitle}</p>
      )}
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8,13,24,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          {p.name}: {p.value}{p.unit ?? ''}
        </div>
      ))}
    </div>
  )
}

// ─── Simulated weekly activity (last 7 days) ──────────────────────────────

function useWeeklyActivity(state: any) {
  return useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    // Use node updatedAt to group completions by day-of-week
    const counts: Record<string, number> = {}
    days.forEach(d => (counts[d] = 0))

    Object.values(state.nodes as Record<string, any>).forEach((node: any) => {
      if (!node.completed) return
      const dow = new Date(node.updatedAt).toLocaleDateString('en-US', { weekday: 'short' })
      if (counts[dow] !== undefined) counts[dow]++
    })

    return days.map(d => ({ day: d, completed: counts[d] }))
  }, [state.nodes])
}

// ─── AnalyticsView ────────────────────────────────────────────────────────

export default function AnalyticsView() {
  const { state, stats } = useRoadmapContext()
  const weeklyData = useWeeklyActivity(state)

  // Category breakdown data
  const categoryData = useMemo(() => {
    return state.rootIds.map(id => {
      const node = state.nodes[id]
      if (!node) return null
      const colorMap = NODE_COLOR_MAP[node.color]
      const total = node.childIds.length
      const completed = node.childIds.filter(cId => state.nodes[cId]?.completed).length
      return {
        name: node.title,
        progress: node.progress,
        completed,
        total,
        remaining: total - completed,
        hours: node.estimatedHours,
        color: colorMap.progress,
      }
    }).filter(Boolean) as any[]
  }, [state])

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    Object.values(state.nodes).forEach(n => { counts[n.priority] = (counts[n.priority] ?? 0) + 1 })
    return [
      { name: 'Critical', value: counts.critical, color: '#EF4444' },
      { name: 'High',     value: counts.high,     color: '#F97316' },
      { name: 'Medium',   value: counts.medium,   color: '#F59E0B' },
      { name: 'Low',      value: counts.low,      color: '#6b7280' },
    ].filter(d => d.value > 0)
  }, [state.nodes])

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { completed: 0, in_progress: 0, not_started: 0, blocked: 0 }
    Object.values(state.nodes).forEach(n => { counts[n.status] = (counts[n.status] ?? 0) + 1 })
    return [
      { name: 'Completed',   value: counts.completed,   color: '#10B981' },
      { name: 'In Progress', value: counts.in_progress, color: '#6366F1' },
      { name: 'Not Started', value: counts.not_started, color: '#374151' },
      { name: 'Blocked',     value: counts.blocked,     color: '#EF4444' },
    ].filter(d => d.value > 0)
  }, [state.nodes])

  // Estimated hours by category
  const hoursData = useMemo(() => {
    return state.rootIds.map(id => {
      const node = state.nodes[id]
      if (!node) return null
      const colorMap = NODE_COLOR_MAP[node.color]
      const totalH = [id, ...node.childIds].reduce((s, cId) => s + (state.nodes[cId]?.estimatedHours ?? 0), 0)
      const doneH  = [id, ...node.childIds].filter(cId => state.nodes[cId]?.completed)
                       .reduce((s, cId) => s + (state.nodes[cId]?.estimatedHours ?? 0), 0)
      return { name: node.title.slice(0, 8), total: totalH, done: doneH, color: colorMap.progress }
    }).filter(Boolean) as any[]
  }, [state])

  const hoursRemaining = stats.totalEstimatedHours - stats.completedHours
  const completionRate  = stats.totalNodes > 0
    ? Math.round((stats.completedNodes / stats.totalNodes) * 100) : 0

  return (
    <div style={{
      padding: '28px 28px',
      display: 'flex', flexDirection: 'column', gap: 28,
      overflowY: 'auto', height: '100%',
      background: 'transparent',
    }}>

      {/* ── Stat cards row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Overall Progress"
          value={`${stats.overallProgress}%`}
          sublabel={`${stats.completedNodes} of ${stats.totalNodes} topics`}
          color="#6366F1"
        />
        <StatCard
          icon={<CheckCircle2 size={16} />}
          label="Completed Topics"
          value={stats.completedNodes}
          sublabel={`${completionRate}% completion rate`}
          color="#10B981"
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Hours Invested"
          value={formatHours(stats.completedHours)}
          sublabel={`${formatHours(hoursRemaining)} remaining`}
          color="#06B6D4"
        />
        <StatCard
          icon={<Flame size={16} />}
          label="Day Streak"
          value={stats.streak}
          sublabel="Keep it up!"
          color="#F59E0B"
        />
      </div>

      {/* ── Weekly activity + Category progress ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Weekly completions bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          style={cardStyle()}
        >
          <SectionHeader title="Weekly Activity" subtitle="Topics completed by day" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={28}>
              <XAxis
                dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]}>
                {weeklyData.map((_, i) => (
                  <Cell key={i} fill={`rgba(99,102,241,${0.4 + (weeklyData[i].completed > 0 ? 0.4 : 0)})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category radial progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          style={cardStyle()}
        >
          <SectionHeader title="Category Progress" subtitle="Completion % per area" />
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="20%" outerRadius="90%"
              data={categoryData.map(d => ({ ...d, fullMark: 100 }))}
              startAngle={90} endAngle={-270}
            >
              <RadialBar dataKey="progress" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.04)' }}>
                {categoryData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </RadialBar>
              <Tooltip
                content={<CustomTooltip />}
                formatter={(v: any) => [`${v}%`, 'Progress']}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Category bar breakdown ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        style={cardStyle()}
      >
        <SectionHeader title="Category Breakdown" subtitle="Completed vs remaining topics" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={categoryData} barGap={4} barCategoryGap="25%">
            <XAxis
              dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="completed" name="Done" radius={[4, 4, 0, 0]} stackId="a">
              {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
            <Bar dataKey="remaining" name="Remaining" stackId="a" radius={[4, 4, 0, 0]}
              fill="rgba(255,255,255,0.06)" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Hours + Status + Priority row ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>

        {/* Hours area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
          style={cardStyle()}
        >
          <SectionHeader title="Estimated Hours" subtitle="Total vs completed by category" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hoursData} barGap={2} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="done" name="Done" unit="h" radius={[4, 4, 0, 0]}>
                {hoursData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
              </Bar>
              <Bar dataKey="total" name="Total" unit="h" fill="rgba(255,255,255,0.07)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 200 }}
          style={cardStyle({ display: 'flex', flexDirection: 'column', gap: 12 })}
        >
          <SectionHeader title="Status" />
          <div style={{ flex: 1, minHeight: 120 }}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={30} outerRadius={50}
                  dataKey="value" paddingAngle={3}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {statusData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.7)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Priority pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          style={cardStyle({ display: 'flex', flexDirection: 'column', gap: 12 })}
        >
          <SectionHeader title="Priority" />
          <div style={{ flex: 1, minHeight: 120 }}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={30} outerRadius={50}
                  dataKey="value" paddingAngle={3}>
                  {priorityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {priorityData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.7)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Top incomplete items ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
        style={cardStyle()}
      >
        <SectionHeader title="Next Up" subtitle="High-priority incomplete topics" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.values(state.nodes)
            .filter(n => !n.completed && n.childIds.length === 0)
            .sort((a, b) => {
              const prio = { critical: 4, high: 3, medium: 2, low: 1 }
              return (prio[b.priority] ?? 0) - (prio[a.priority] ?? 0)
            })
            .slice(0, 8)
            .map(node => {
              const colorMap = NODE_COLOR_MAP[node.color]
              const parent = node.parentId ? state.nodes[node.parentId] : null
              return (
                <div key={node.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: colorMap.progress, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>
                      {node.title}
                    </div>
                    {parent && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        {parent.title}
                      </div>
                    )}
                  </div>
                  {node.estimatedHours > 0 && (
                    <span style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.3)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {node.estimatedHours}h
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: '2px 7px', borderRadius: 5,
                    background: node.priority === 'critical' ? 'rgba(239,68,68,0.15)'
                              : node.priority === 'high' ? 'rgba(249,115,22,0.15)'
                              : 'rgba(245,158,11,0.1)',
                    color: node.priority === 'critical' ? '#FCA5A5'
                         : node.priority === 'high' ? '#FDBA74'
                         : '#FCD34D',
                    textTransform: 'capitalize',
                  }}>
                    {node.priority}
                  </span>
                </div>
              )
            })}
        </div>
      </motion.div>

      <div style={{ height: 24 }} />
    </div>
  )
}
