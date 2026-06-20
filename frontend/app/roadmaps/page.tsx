'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Folder, FolderPlus, FileText, Plus, Trash2, Edit3, Move, 
  Copy, ChevronRight, ArrowLeft, Upload, FileUp, Cpu, X, Check, Loader2, Users 
} from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { useToast } from '@/components/providers/ToastProvider'
import AppShell from '@/components/sidebar/AppShell'
import ParticleBackground from '@/components/ui/ParticleBackground'
import { generateRoadmapFromInput } from '@/lib/roadmapGenerator'
import { createBlankState } from '@/lib/roadmapUtils'

const SAMPLE_ROADMAP_OUTLINE = `Full-Stack Web Developer

Frontend Foundations
  - HTML semantic structure
    Description: Learn the standard markup language for documents designed to be displayed in a web browser.
    Notes: Focus on accessibility tags like ARIA.
    Subtasks: Forms and validation, Semantic tags, SEO basics
    Resources: https://developer.mozilla.org, https://web.dev
  - CSS layout with flexbox and grid
    Description: Master responsive design layouts.
    Notes: Grid for 2D layouts, Flexbox for 1D.
    Subtasks: Media queries, Flexbox froggy, CSS Grid Garden
    Resources: https://css-tricks.com, https://flexboxfroggy.com
  - JavaScript fundamentals
    Description: Core logic and DOM manipulation.
    Notes: Understand closures and the event loop.
    Subtasks: ES6 Syntax, Promises and Async/Await, DOM Selection
    Resources: https://javascript.info

React and Next.js
  - React components and props
    Description: Building reusable UI components.
    Notes: Functional components are preferred over class components.
    Subtasks: useState, useEffect, Context API
  - Next.js App Router
    Description: Server-side rendering and routing framework.
    Notes: v13+ uses the new App Router paradigm.
    Subtasks: Server components, Client components, Data fetching
    Resources: https://nextjs.org/docs

Backend and Data
  - REST API design
    Description: Architecting clean and stateless APIs.
    Notes: Use standard HTTP methods and status codes.
    Subtasks: Endpoint structuring, Authentication middleware, Error handling
  - PostgreSQL basics
    Description: Relational database fundamentals.
    Notes: Practice writing raw SQL before using an ORM.
    Subtasks: Table creation, Joins, Indexes
    Resources: https://postgresql.org

Projects
  - Full-stack Capstone
    Description: Build a complete end-to-end web application.
    Notes: Integrate all the previous skills.
    Subtasks: Database schema design, API implementation, Frontend integration, Deployment
    Resources: https://vercel.com`

export default function RoadmapsPage() {
  const router = useRouter()
  const { error: toastError, success: toastSuccess } = useToast()
  
  const {
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
    currentRoadmapRole,
    canEditCurrentRoadmap,
    isLoadingWorkspace
  } = useRoadmapContext()

  // Explorer states
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  
  // Dialog states
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  const [showRoadmapModal, setShowRoadmapModal] = useState(false)
  const [newRoadmapName, setNewRoadmapName] = useState('')
  const [creationMode, setCreationMode] = useState<'blank' | 'ai'>('blank')
  
  // AI Wizard states
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiFileType, setAiFileType] = useState<'text' | 'file'>('text')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedFileText, setUploadedFileText] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiStep, setAiStep] = useState(0)

  // Rename states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null)
  const [editingRoadmapName, setEditingRoadmapName] = useState('')
  const [sharingRoadmapId, setSharingRoadmapId] = useState<string | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('editor')

  // Creation-time collaboration options
  const [enableCollab, setEnableCollab] = useState(false)
  const [inviteEmailOnCreate, setInviteEmailOnCreate] = useState('')
  const [inviteRoleOnCreate, setInviteRoleOnCreate] = useState<'viewer' | 'editor'>('editor')

  // Context menu state for roadmap right-click
  const [contextMenu, setContextMenu] = useState<{ roadmapId: string; x: number; y: number } | null>(null)

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  // Folder breadcrumb helper
  const activeFolder = folders?.find(f => f && f.id === activeFolderId)

  // Filter lists based on path
  const currentFolders = activeFolderId === null ? (folders || []) : []
  const currentRoadmaps = (roadmapsList || []).filter(r => r && r.folder_id === activeFolderId)
  const contextRoadmap = contextMenu ? roadmapsList.find(r => r.id === contextMenu.roadmapId) : null
  const canManageContextRoadmap = contextRoadmap?.isOwner ?? false

  // Handle roadmap loading
  const handleOpenRoadmap = (id: string) => {
    setCurrentRoadmapId(id)
    router.push('/')
  }

  // Handle Folder submit
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim())
    setNewFolderName('')
    setShowFolderModal(false)
  }

  // Handle Folder rename submit
  const handleRenameFolderSubmit = async (id: string) => {
    if (!editingFolderName.trim()) return
    await renameFolder(id, editingFolderName.trim())
    setEditingFolderId(null)
  }

  // Handle Roadmap rename submit
  const handleRenameRoadmapSubmit = async (id: string) => {
    if (!editingRoadmapName.trim()) return
    await renameRoadmap(id, editingRoadmapName.trim())
    setEditingRoadmapId(null)
  }

  // Simulate file reading for parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    
    // Read the text content of file
    const reader = new FileReader()
    reader.onload = (evt) => {
      setUploadedFileText(evt.target?.result as string || '')
    }
    reader.readAsText(file)
  }

  const handleShareRoadmapSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sharingRoadmapId) return
    if (!shareEmail.trim()) {
      toastError('Enter an email to invite')
      return
    }

    const shared = await shareRoadmap(sharingRoadmapId, shareEmail.trim(), shareRole)
    if (shared) {
      setShareEmail('')
      setShareRole('editor')
      setSharingRoadmapId(null)
    }
  }

  // Handle Roadmap creation wizard submit
  const handleCreateRoadmapSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoadmapName.trim()) {
      toastError('Please specify a title')
      return
    }

    if (creationMode === 'blank') {
      const blankState = createBlankState()
      const id = await createRoadmap(newRoadmapName.trim(), activeFolderId, blankState)
      if (id) {
        // If user chose to enable collaboration at creation, invite the provided email
        if (enableCollab && inviteEmailOnCreate.trim()) {
          await shareRoadmap(id, inviteEmailOnCreate.trim(), inviteRoleOnCreate)
        }

        setShowRoadmapModal(false)
        setNewRoadmapName('')
        setEnableCollab(false)
        setInviteEmailOnCreate('')
        setInviteRoleOnCreate('editor')
        handleOpenRoadmap(id)
      }
    } else {
      // AI Gen Mode
      const inputText = aiFileType === 'text' ? aiPrompt : uploadedFileText
      if (!inputText.trim()) {
        toastError(aiFileType === 'text' ? 'Please write learning goals or paste an outline' : 'Please upload a readable text outline file')
        return
      }

      setAiGenerating(true)
      setAiStep(0) // 0 = Analyzing learning requirements...
      
      let finalParsedText = inputText

      try {
        if (aiFileType === 'text') {
          // Ask Gemini to expand the prompt into a formatted outline
          const res = await fetch('/api/generate-flowmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: inputText })
          })
          const data = await res.json()
          
          if (!res.ok) {
            throw new Error(data.error || 'Failed to generate flowmap via AI')
          }
          finalParsedText = data.result
        }

        // Proceed to other steps
        const steps = [
          'Extracting key learning modules...',
          'Mapping prerequisite dependancies...',
          'Assembling nodes grid layout...',
          'Finalizing roadmap state...'
        ]

        for (let i = 0; i < steps.length; i++) {
          setAiStep(i + 1)
          await new Promise(r => setTimeout(r, 400))
        }

        // Generate the state schema from the AI's response (or file upload)
        const state = generateRoadmapFromInput(
          newRoadmapName.trim(),
          finalParsedText,
          aiFileType === 'file' ? uploadedFileName : undefined
        )

        const id = await createRoadmap(newRoadmapName.trim(), activeFolderId, state)
        setAiGenerating(false)
        
        if (id) {
          // Invite after AI-generated roadmap creation if requested
          if (enableCollab && inviteEmailOnCreate.trim()) {
            await shareRoadmap(id, inviteEmailOnCreate.trim(), inviteRoleOnCreate)
          }

          toastSuccess('Roadmap generated successfully!')
          setShowRoadmapModal(false)
          setNewRoadmapName('')
          setAiPrompt('')
          setUploadedFileName('')
          setUploadedFileText('')
          setEnableCollab(false)
          setInviteEmailOnCreate('')
          setInviteRoleOnCreate('editor')
          handleOpenRoadmap(id)
        }
      } catch (err: any) {
        toastError(err.message)
        setAiGenerating(false)
      }
    }
  }

  return (
    <AppShell>
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto' }}>
        <ParticleBackground />

        {/* Workspace panel */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '24px 30px',
          maxWidth: 1200,
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          {/* Header & Explorer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              {/* Breadcrumb navigator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span 
                  onClick={() => setActiveFolderId(null)}
                  style={{ 
                    fontSize: 11, 
                    color: activeFolderId === null ? '#818CF8' : 'rgba(255,255,255,0.3)', 
                    cursor: 'pointer',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Workspace
                </span>
                {activeFolderId !== null && (
                  <>
                    <ChevronRight size={10} color="rgba(255,255,255,0.2)" />
                    <span style={{ 
                      fontSize: 11, 
                      color: '#818CF8', 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {activeFolder?.name}
                    </span>
                  </>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
                {activeFolderId === null ? 'All Files' : activeFolder?.name}
              </h2>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {activeFolderId === null && (
                <motion.button
                  onClick={() => setShowFolderModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9,
                    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FolderPlus size={14} />
                  New Folder
                </motion.button>
              )}

              {activeFolderId !== null && (
                <motion.button
                  onClick={() => setActiveFolderId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9,
                    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ArrowLeft size={14} />
                  Back
                </motion.button>
              )}

              <motion.button
                onClick={() => setShowRoadmapModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none', borderRadius: 9,
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.2)'
                }}
                whileHover={{ filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus size={14} />
                New Roadmap
              </motion.button>
            </div>
          </div>

          {/* Loading panel */}
          {isLoadingWorkspace ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: 250, gap: 12
            }}>
              <Loader2 size={32} color="#818CF8" className="workspace-spinner" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Loading workspace items...</span>
            </div>
          ) : (
            <>
              {/* Folders and Files Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                
                {/* 1. Folders Render (Only on root level) */}
                {currentFolders.map(folder => (
                  <motion.div
                    key={folder.id}
                    layoutId={`folder-card-${folder.id}`}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}
                    whileHover={{
                      background: 'rgba(99, 102, 241, 0.04)',
                      borderColor: 'rgba(99, 102, 241, 0.25)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    {/* Folder glow border */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: 'linear-gradient(90deg, #F59E0B, #D97706)'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Folder size={32} color="#F59E0B" />
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
                          title="Rename Folder"
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Delete folder "${folder.name}" and all its roadmaps?`)) {
                              deleteFolder(folder.id)
                            }
                          }}
                          title="Delete Folder"
                          style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {editingFolderId === folder.id ? (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={evt => setEditingFolderName(evt.target.value)}
                          style={{
                            background: '#0a0f1e', border: '1px solid rgba(99,102,241,0.5)',
                            borderRadius: 4, color: '#fff', fontSize: 12, padding: '2px 6px', width: '100%'
                          }}
                        />
                        <button 
                          onClick={() => handleRenameFolderSubmit(folder.id)}
                          style={{ background: '#10B981', border: 'none', borderRadius: 4, color: '#fff', padding: '2px 6px', cursor: 'pointer' }}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {folder.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          {roadmapsList.filter(r => r.folder_id === folder.id).length} Roadmaps
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* 2. Roadmaps Render */}
                {currentRoadmaps.map(roadmap => {
                  const isActive = roadmap.id === currentRoadmapId
                  return (
                    <motion.div
                      key={roadmap.id}
                      style={{
                        background: isActive ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 12,
                        padding: 16,
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        boxSizing: 'border-box'
                      }}
                      whileHover={{
                        background: 'rgba(99, 102, 241, 0.04)',
                        borderColor: 'rgba(99, 102, 241, 0.25)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                      }}
                      onClick={() => handleOpenRoadmap(roadmap.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({ roadmapId: roadmap.id, x: e.clientX, y: e.clientY })
                      }}
                    >
                      {/* Active roadmap top glow */}
                      {isActive && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                          background: 'linear-gradient(90deg, #6366F1, #10B981)'
                        }} />
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FileText size={32} color={isActive ? '#818CF8' : 'rgba(255,255,255,0.4)'} />
                        
                        {/* Folder assignment stays visible; roadmap actions are in the right-click menu. */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          {/* Move to Folder select */}
                          <select
                            value={roadmap.folder_id || ''}
                            onChange={evt => moveRoadmapToFolder(roadmap.id, evt.target.value || null)}
                            disabled={roadmap.role === 'viewer'}
                            title={roadmap.role === 'viewer' ? 'View-only users cannot move this roadmap' : 'Move to Folder'}
                            style={{
                              background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 4, color: roadmap.role === 'viewer' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)', fontSize: 10, padding: '2px 4px', cursor: roadmap.role === 'viewer' ? 'not-allowed' : 'pointer',
                              maxWidth: 70
                            }}
                          >
                            <option value="">No Folder</option>
                            {folders.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>


                        </div>
                      </div>

                      {editingRoadmapId === roadmap.id ? (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingRoadmapName}
                            onChange={evt => setEditingRoadmapName(evt.target.value)}
                            style={{
                              background: '#0a0f1e', border: '1px solid rgba(99,102,241,0.5)',
                              borderRadius: 4, color: '#fff', fontSize: 12, padding: '2px 6px', width: '100%'
                            }}
                          />
                          <button 
                            onClick={() => handleRenameRoadmapSubmit(roadmap.id)}
                            style={{ background: '#10B981', border: 'none', borderRadius: 4, color: '#fff', padding: '2px 6px', cursor: 'pointer' }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {roadmap.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span>Updated {new Date(roadmap.updated_at).toLocaleDateString()}</span>
                            {roadmap.shared && (
                              <span style={{ color: '#34d399' }}>
                                Shared by {roadmap.owner?.display_name || roadmap.owner?.email || 'owner'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Empty state browser */}
              {currentFolders.length === 0 && currentRoadmaps.length === 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 250, gap: 12, border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 16, marginTop: 16
                }}>
                  <FileText size={36} color="rgba(255,255,255,0.15)" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>This workspace folder is empty.</span>
                  <motion.button
                    onClick={() => setShowRoadmapModal(true)}
                    style={{
                      padding: '6px 12px', background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6,
                      color: '#818CF8', fontSize: 11, cursor: 'pointer'
                    }}
                    whileHover={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    Add a Roadmap
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        
        {/* 1. Create Folder Modal */}
        {showFolderModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 360, background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#fff' }}>Create New Folder</h3>
              <form onSubmit={handleCreateFolder}>
                <input
                  type="text"
                  placeholder="e.g. DSA Preparation"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%', height: 38, boxSizing: 'border-box', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 12px',
                    color: '#fff', fontSize: 14, outline: 'none', marginBottom: 20
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button 
                    type="button" 
                    onClick={() => setShowFolderModal(false)}
                    style={{ padding: '8px 14px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{ padding: '8px 16px', background: '#F59E0B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2. Create Roadmap Wizard Modal */}
        {showRoadmapModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: 'calc(100% - 32px)', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              {aiGenerating ? (
                /* AI Generation Progress Sequence */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 10px', gap: 20 }}>
                  <Cpu size={40} color="#818CF8" className="ai-cpu-pulse" style={{ animation: 'spin 4s linear infinite' }} />
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      <span>AI Builder Status</span>
                      <span>{Math.round(((aiStep + 1) / 5) * 100)}%</span>
                    </div>
                    {/* Bar */}
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999 }}>
                      <motion.div 
                        animate={{ width: `${((aiStep + 1) / 5) * 100}%` }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #10B981)', borderRadius: 999 }}
                      />
                    </div>
                  </div>
                  
                  {/* Step ticks */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      'Analyzing learning requirements...',
                      'Extracting key learning modules...',
                      'Mapping prerequisite dependancies...',
                      'Assembling nodes grid layout...',
                      'Finalizing roadmap state...'
                    ].map((stepText, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, 
                        color: idx < aiStep ? '#10B981' : idx === aiStep ? '#818CF8' : 'rgba(255,255,255,0.2)',
                        transition: 'color 0.2s'
                      }}>
                        {idx < aiStep ? <Check size={12} /> : idx === aiStep ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <div style={{ width: 12 }} />}
                        <span>{stepText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Wizard Configuration UI */
                <>
                  <button 
                    onClick={() => setShowRoadmapModal(false)}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: '#fff' }}>Create Roadmap</h3>
                  
                  <form onSubmit={handleCreateRoadmapSubmit}>
                    {/* Roadmap Title */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 500 }}>
                        Roadmap Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Next.js Masterclass"
                        value={newRoadmapName}
                        onChange={e => setNewRoadmapName(e.target.value)}
                        autoFocus
                        required
                        style={{
                          width: '100%', height: 38, boxSizing: 'border-box', background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 12px',
                          color: '#fff', fontSize: 14, outline: 'none'
                        }}
                      />
                    </div>

                    {/* Mode Selector */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                      <button
                        type="button"
                        onClick={() => setCreationMode('blank')}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 8,
                          background: creationMode === 'blank' ? 'rgba(99,102,241,0.1)' : 'transparent',
                          border: `1px solid ${creationMode === 'blank' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          color: creationMode === 'blank' ? '#818CF8' : 'rgba(255,255,255,0.5)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                        }}
                      >
                        <FileText size={16} />
                        Blank Canvas
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreationMode('ai')}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 8,
                          background: creationMode === 'ai' ? 'rgba(16,185,129,0.1)' : 'transparent',
                          border: `1px solid ${creationMode === 'ai' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          color: creationMode === 'ai' ? '#34D399' : 'rgba(255,255,255,0.5)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                        }}
                      >
                        <Cpu size={16} />
                        Document Outline Parser
                      </button>
                    </div>

                    {/* Collaboration options at creation time */}
                    <div style={{ marginBottom: 16, marginTop: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        <input type="checkbox" checked={enableCollab} onChange={e => setEnableCollab(e.target.checked)} />
                        <span style={{ fontWeight: 600 }}>Enable collaboration</span>
                      </label>

                      {enableCollab && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Invite by email (optional)</label>
                            <input
                              type="email"
                              placeholder="friend@example.com"
                              value={inviteEmailOnCreate}
                              onChange={e => setInviteEmailOnCreate(e.target.value)}
                              style={{ width: '100%', height: 36, boxSizing: 'border-box', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0 10px', color: '#fff' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Role</label>
                            <select value={inviteRoleOnCreate} onChange={e => setInviteRoleOnCreate(e.target.value as 'viewer' | 'editor')} style={{ height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '0 10px' }}>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Generator Panel */}
                    {creationMode === 'ai' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}
                      >
                        {/* File type switcher */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: 2, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <button
                            type="button"
                            onClick={() => setAiFileType('text')}
                            style={{
                              flex: 1, padding: '4px 0', border: 'none', borderRadius: 4,
                              background: aiFileType === 'text' ? 'rgba(255,255,255,0.05)' : 'transparent',
                              color: aiFileType === 'text' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer'
                            }}
                          >
                            Text Outline
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiFileType('file')}
                            style={{
                              flex: 1, padding: '4px 0', border: 'none', borderRadius: 4,
                              background: aiFileType === 'file' ? 'rgba(255,255,255,0.05)' : 'transparent',
                              color: aiFileType === 'file' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer'
                            }}
                          >
                            File Upload
                          </button>
                        </div>

                        {aiFileType === 'text' ? (
                          <>
                          <textarea
                            placeholder="Describe your learning goals, paste a curriculum, or format list e.g.:
1. Intro to React
  - JSX & Props
2. State Management"
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            required={creationMode === 'ai'}
                            style={{
                              width: '100%', height: 100, boxSizing: 'border-box', background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10,
                              color: '#fff', fontSize: 12, outline: 'none', resize: 'none', fontFamily: 'monospace'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newRoadmapName.trim()) setNewRoadmapName('Full-Stack Web Developer')
                              setAiPrompt(SAMPLE_ROADMAP_OUTLINE)
                            }}
                            style={{
                              alignSelf: 'flex-start', padding: '5px 9px', background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6,
                              color: '#a5b4fc', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Use sample outline
                          </button>
                          </>
                        ) : (
                          <div style={{
                            border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, padding: 20,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.01)', position: 'relative'
                          }}>
                            <input
                              type="file"
                              accept=".txt,.md,.pdf,.ppt,.pptx,.docx"
                              onChange={handleFileUpload}
                              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            />
                            <FileUp size={28} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                              {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Drag & drop outline file here'}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                              Reads plain-text outlines. Real PDF/PPT parsing needs a parser service.
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Submit buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                      <button 
                        type="button" 
                        onClick={() => setShowRoadmapModal(false)}
                        style={{ padding: '8px 14px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        style={{
                          padding: '8px 18px',
                          background: creationMode === 'ai' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {creationMode === 'ai' ? 'Generate Roadmap' : 'Create Blank'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* 3. Share Roadmap Modal */}
        {sharingRoadmapId && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 400, background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                Share Roadmap
              </h3>
              <p style={{ margin: 0, marginBottom: 18, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Invite a collaborator by email. They will get access to this roadmap and can view or edit it once added.
              </p>
              <form onSubmit={handleShareRoadmapSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 500 }}>
                    Roadmap
                  </label>
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13 }}>
                    {roadmapsList.find(r => r.id === sharingRoadmapId)?.name || 'Selected roadmap'}
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 500 }}>
                    Collaborator Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    autoFocus
                    required
                    style={{
                      width: '100%', height: 42, boxSizing: 'border-box', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 12px',
                      color: '#fff', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 500 }}>
                    Role
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['editor', 'viewer'].map(option => (
                      <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff', fontSize: 13 }}>
                        <input
                          type="radio"
                          name="shareRole"
                          value={option}
                          checked={shareRole === option}
                          onChange={() => setShareRole(option as 'viewer' | 'editor')}
                          style={{ accentColor: '#10B981' }}
                        />
                        <span>{option === 'editor' ? 'Can edit' : 'View only'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 18, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
                    Shared collaborators
                  </div>
                  {(sharingRoadmapId && roadmapCollaborators[sharingRoadmapId]?.length > 0) ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {roadmapCollaborators[sharingRoadmapId]?.map(collab => (
                        <div key={collab.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                          <div>
                            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{collab.display_name || collab.email}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{collab.email}</div>
                          </div>
                          <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>{collab.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      No collaborators yet.
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSharingRoadmapId(null)}
                    style={{ padding: '8px 14px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 4. Roadmap Context Menu (Right-click) */}
        {contextMenu && contextRoadmap && (
          <div
            style={{
              position: 'fixed',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              zIndex: 1000,
              background: '#0a0f1e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              minWidth: 180
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                duplicateRoadmap(contextMenu.roadmapId)
                setContextMenu(null)
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Copy size={14} />
              Duplicate
            </button>

            <button
              onClick={() => {
                if (!canManageContextRoadmap) return
                setSharingRoadmapId(contextMenu.roadmapId)
                setShareEmail('')
                setShareRole('editor')
                loadRoadmapCollaborators(contextMenu.roadmapId)
                setContextMenu(null)
              }}
              disabled={!canManageContextRoadmap}
              title={canManageContextRoadmap ? 'Share Roadmap' : 'Only the owner can share this roadmap'}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: canManageContextRoadmap ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                fontSize: 13,
                textAlign: 'left',
                cursor: canManageContextRoadmap ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={e => { if (canManageContextRoadmap) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Users size={14} />
              Share Roadmap
            </button>

            <button
              onClick={() => {
                if (!canManageContextRoadmap) return
                setEditingRoadmapId(contextMenu.roadmapId)
                setEditingRoadmapName(contextRoadmap.name)
                setContextMenu(null)
              }}
              disabled={!canManageContextRoadmap}
              title={canManageContextRoadmap ? 'Rename Roadmap' : 'Only the owner can rename this roadmap'}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: canManageContextRoadmap ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                fontSize: 13,
                textAlign: 'left',
                cursor: canManageContextRoadmap ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={e => { if (canManageContextRoadmap) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Edit3 size={14} />
              Rename
            </button>

            <button
              onClick={() => {
                if (!canManageContextRoadmap) return
                if (window.confirm(`Delete roadmap "${contextRoadmap.name}"?`)) {
                  deleteRoadmap(contextMenu.roadmapId)
                }
                setContextMenu(null)
              }}
              disabled={!canManageContextRoadmap}
              title={canManageContextRoadmap ? 'Delete Roadmap' : 'Only the owner can delete this roadmap'}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: canManageContextRoadmap ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.25)',
                fontSize: 13,
                textAlign: 'left',
                cursor: canManageContextRoadmap ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
              onMouseEnter={e => { if (canManageContextRoadmap) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}

      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  )
}



