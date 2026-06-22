'use client'

import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import type { RoadmapNode, NodeColor, Priority, NodeStatus, ChildTask } from '@/types/roadmap'
import { NODE_COLOR_MAP, PRIORITY_MAP, STATUS_MAP } from '@/types/roadmap'
import ResourcesList from './ResourcesList'

// ─── Section wrapper ──────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// ─── Progress slider ──────────────────────────────────────────────────────

function ProgressSlider({ value, color, onChange }: { value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 9999,
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${value}%`,
          height: 4,
          background: color,
          borderRadius: 9999,
          transition: 'width 0.2s ease',
        }} />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            opacity: 0,
            cursor: 'pointer',
            height: 20,
            margin: 0,
          }}
        />
      </div>
      <span style={{
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
        color: 'rgba(255,255,255,0.6)',
        minWidth: 32,
        textAlign: 'right',
      }}>
        {value}%
      </span>
    </div>
  )
}

// ─── Color picker ─────────────────────────────────────────────────────────

const ALL_COLORS: NodeColor[] = ['indigo', 'violet', 'emerald', 'cyan', 'amber', 'rose', 'blue', 'teal']

function ColorPicker({ value, onChange }: { value: NodeColor; onChange: (c: NodeColor) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {ALL_COLORS.map(color => {
        const map = NODE_COLOR_MAP[color]
        return (
          <motion.button
            key={color}
            title={color}
            onClick={() => onChange(color)}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: map.progress,
              border: value === color
                ? `2px solid rgba(255,255,255,0.8)`
                : '2px solid transparent',
              cursor: 'pointer',
              boxShadow: value === color ? `0 0 8px ${map.progress}` : 'none',
              transition: 'all 0.15s',
            }}
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 0.9 }}
          />
        )
      })}
    </div>
  )
}

// ─── Child tasks ──────────────────────────────────────────────────────────

function ChildTaskList({ tasks, onChange }: { tasks: ChildTask[]; onChange: (tasks: ChildTask[]) => void }) {
  const [localNew, setLocalNew] = React.useState('')

  const addTask = () => {
    if (!localNew.trim()) return
    onChange([...tasks, { id: uuidv4(), title: localNew.trim(), completed: false }])
    setLocalNew('')
  }

  const toggleTask = (id: string) => {
    onChange(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id: string) => {
    onChange(tasks.filter(t => t.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {tasks.map(task => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <button
            onClick={() => toggleTask(task.id)}
            style={{
              width: 15,
              height: 15,
              borderRadius: 3,
              border: `1.5px solid ${task.completed ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
              background: task.completed ? '#10B981' : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: 'white',
            }}
          >
            {task.completed ? '✓' : ''}
          </button>
          <span style={{
            flex: 1,
            fontSize: 12,
            color: task.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.72)',
            textDecoration: task.completed ? 'line-through' : 'none',
          }}>
            {task.title}
          </span>
          <button
            onClick={() => deleteTask(task.id)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.2)',
              cursor: 'pointer', fontSize: 12, padding: 2,
            }}
          >×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="flowmap-input"
          placeholder="Add sub-task..."
          value={localNew}
          onChange={e => setLocalNew(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask() }}
          style={{ fontSize: 12, flex: 1 }}
        />
        <motion.button
          onClick={addTask}
          style={{
            padding: '0 10px',
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 7,
            color: '#a5b4fc',
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          whileHover={{ background: 'rgba(99,102,241,0.35)' }}
          whileTap={{ scale: 0.97 }}
        >
          +
        </motion.button>
      </div>
    </div>
  )
}

// ─── Main NodeEditorFields ─────────────────────────────────────────────────

interface NodeEditorFieldsProps {
  node: RoadmapNode
  onChange: (updates: Partial<RoadmapNode>) => void
  onProgressChange: (progress: number) => void
}

export default function NodeEditorFields({ node, onChange, onProgressChange }: NodeEditorFieldsProps) {
  const colorMap = NODE_COLOR_MAP[node.color]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Title */}
      <Section label="Title">
        <input
          className="flowmap-input"
          value={node.title}
          onChange={e => onChange({ title: e.target.value })}
          style={{ fontSize: 15, fontWeight: 600 }}
        />
      </Section>

      {/* Description */}
      <Section label="Description">
        <textarea
          className="flowmap-input"
          value={node.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="What is this about?"
          rows={3}
          style={{ resize: 'vertical', lineHeight: 1.6, fontSize: 13 }}
        />
      </Section>

      {/* Progress */}
      <Section label={`Progress — ${node.progress}%`}>
        <ProgressSlider
          value={node.progress}
          color={colorMap.progress}
          onChange={onProgressChange}
        />
      </Section>

      {/* Status & Priority */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Section label="Status">
          <select
            className="flowmap-input"
            value={node.status}
            onChange={e => onChange({ status: e.target.value as NodeStatus })}
            style={{ fontSize: 12 }}
          >
            {(Object.keys(STATUS_MAP) as NodeStatus[]).map(s => (
              <option key={s} value={s} style={{ background: '#0D1117' }}>
                {STATUS_MAP[s].label}
              </option>
            ))}
          </select>
        </Section>

        <Section label="Priority">
          <select
            className="flowmap-input"
            value={node.priority}
            onChange={e => onChange({ priority: e.target.value as Priority })}
            style={{ fontSize: 12 }}
          >
            {(Object.keys(PRIORITY_MAP) as Priority[]).map(p => (
              <option key={p} value={p} style={{ background: '#0D1117' }}>
                {PRIORITY_MAP[p].label}
              </option>
            ))}
          </select>
        </Section>
      </div>

      {/* Hide Checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={!!node.hideCheckbox}
          onChange={e => onChange({ hideCheckbox: e.target.checked })}
          style={{ cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Hide Completion Checkbox</span>
      </label>

      {/* Deadline & Estimated hours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Section label="Deadline">
          <input
            type="date"
            className="flowmap-input"
            value={node.deadline ?? ''}
            onChange={e => onChange({ deadline: e.target.value || null })}
            style={{
              fontSize: 12,
              colorScheme: 'dark',
            }}
          />
        </Section>

        <Section label="Estimated hours">
          <input
            type="number"
            className="flowmap-input"
            value={node.estimatedHours || ''}
            min={0}
            onChange={e => onChange({ estimatedHours: Number(e.target.value) })}
            placeholder="0"
            style={{ fontSize: 12 }}
          />
        </Section>
      </div>

      {/* Color */}
      <Section label="Color tag">
        <ColorPicker value={node.color} onChange={color => onChange({ color })} />
      </Section>

      {/* Notes */}
      <Section label="Notes">
        <textarea
          className="flowmap-input"
          value={node.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Personal notes, hints, observations..."
          rows={4}
          style={{ resize: 'vertical', lineHeight: 1.6, fontSize: 13 }}
        />
      </Section>

      {/* Sub-tasks */}
      <Section label="Sub-tasks">
        <ChildTaskList
          tasks={node.childTasks}
          onChange={childTasks => onChange({ childTasks })}
        />
      </Section>

      {/* Resources */}
      <Section label="Learning resources">
        <ResourcesList
          resources={node.resources}
          onChange={resources => onChange({ resources })}
        />
      </Section>
    </div>
  )
}
