'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ExternalLink, Video, BookOpen, Wrench, FileText, Globe } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Resource } from '@/types/roadmap'

const RESOURCE_ICONS: Record<Resource['type'], React.ReactNode> = {
  video:   <Video size={12} />,
  article: <FileText size={12} />,
  course:  <BookOpen size={12} />,
  book:    <BookOpen size={12} />,
  tool:    <Wrench size={12} />,
  other:   <Globe size={12} />,
}

const RESOURCE_COLORS: Record<Resource['type'], string> = {
  video:   '#EF4444',
  article: '#6366F1',
  course:  '#F59E0B',
  book:    '#10B981',
  tool:    '#06B6D4',
  other:   '#8B5CF6',
}

interface ResourcesListProps {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
}

export default function ResourcesList({ resources, onChange }: ResourcesListProps) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState<Resource['type']>('article')

  const handleAdd = () => {
    if (!newTitle.trim()) return
    const resource: Resource = {
      id: uuidv4(),
      title: newTitle.trim(),
      url: newUrl.trim(),
      type: newType,
    }
    onChange([...resources, resource])
    setNewTitle('')
    setNewUrl('')
    setNewType('article')
    setAdding(false)
  }

  const handleDelete = (id: string) => {
    onChange(resources.filter(r => r.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Existing resources */}
      <AnimatePresence>
        {resources.map((resource) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8, height: 0, marginBottom: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
            }}
          >
            {/* Type icon */}
            <span style={{
              color: RESOURCE_COLORS[resource.type],
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}>
              {RESOURCE_ICONS[resource.type]}
            </span>

            {/* Title */}
            <span style={{
              flex: 1,
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {resource.title}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {resource.url && (
                <motion.a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ color: '#6366F1', scale: 1.15 }}
                >
                  <ExternalLink size={11} />
                </motion.a>
              )}
              <motion.button
                onClick={() => handleDelete(resource.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  padding: 2,
                }}
                whileHover={{ color: '#EF4444', scale: 1.15 }}
              >
                <Trash2 size={11} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 10,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
            }}>
              <input
                autoFocus
                className="flowmap-input"
                placeholder="Resource title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
                style={{ fontSize: 12 }}
              />
              <input
                className="flowmap-input"
                placeholder="URL (optional)"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                style={{ fontSize: 12 }}
              />
              <select
                className="flowmap-input"
                value={newType}
                onChange={e => setNewType(e.target.value as Resource['type'])}
                style={{ fontSize: 12 }}
              >
                {(['video', 'article', 'course', 'book', 'tool', 'other'] as Resource['type'][]).map(t => (
                  <option key={t} value={t} style={{ background: '#0D1117' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button
                  onClick={handleAdd}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: 'rgba(99,102,241,0.25)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 7,
                    color: '#a5b4fc',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(99,102,241,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Add
                </motion.button>
                <motion.button
                  onClick={() => setAdding(false)}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 7,
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!adding && (
        <motion.button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'transparent',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.35)',
            fontSize: 12,
            cursor: 'pointer',
            width: '100%',
          }}
          whileHover={{
            borderColor: 'rgba(99,102,241,0.4)',
            color: '#818CF8',
            background: 'rgba(99,102,241,0.05)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={12} />
          Add resource
        </motion.button>
      )}
    </div>
  )
}
