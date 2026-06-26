'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, Loader2 } from 'lucide-react'
import { useRoadmapContext } from '@/components/providers/RoadmapProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { applyLayout } from '@/lib/layoutEngine'

export default function AiCanvasPrompter() {
  const { state, dispatch } = useRoadmapContext()
  const { success, error } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      const res = await fetch('/api/edit-flowmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, currentState: state }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to modify roadmap')
      }

      const data = await res.json()
      const updatedState = data.updatedState

      if (!updatedState || !updatedState.nodes) {
        throw new Error('Invalid response from AI')
      }

      const layoutName = updatedState.layout || state.layout || 'Classic Top-Down Tree'
      const laidOutNodes = applyLayout(updatedState.nodes, layoutName)

      const nextState = {
        ...state,
        ...updatedState,
        nodes: laidOutNodes,
        version: state.version + 1,
        lastSaved: new Date().toISOString()
      }
      
      dispatch({ type: 'SET_STATE', payload: nextState })
      setPrompt('')
      setIsOpen(false)
      success('Roadmap updated with AI!')
      
    } catch (err: any) {
      console.error(err)
      error('Error editing flowmap: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div 
      className="no-canvas-pan"
      style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              marginBottom: 16,
              background: 'rgba(25, 25, 30, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 24,
              padding: '16px 20px',
              width: 480,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#A78BFA" />
                <span style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14 }}>Tweak with AI</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., 'Make the React Core section more advanced' or 'Add a section about Testing'"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#fff',
                padding: 12,
                fontSize: 14,
                minHeight: 80,
                resize: 'none',
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                style={{
                  background: prompt.trim() ? '#8B5CF6' : 'rgba(139, 92, 246, 0.5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: prompt.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isGenerating ? 'Generating...' : 'Send'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
            border: 'none',
            borderRadius: 30,
            padding: '12px 24px',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(139, 92, 246, 0.6)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles size={18} />
          Edit with AI
        </motion.button>
      )}
    </div>
  )
}
