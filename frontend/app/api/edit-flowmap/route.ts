import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { prompt, currentState } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 })
    }

    // Try to locate and read the sample import JSON for structure context
    let sampleJsonText = ''
    try {
      const p1 = path.join(process.cwd(), '..', 'samples', 'flowmap-import-sample.json')
      const p2 = path.join(process.cwd(), 'samples', 'flowmap-import-sample.json')
      if (fs.existsSync(p1)) {
        sampleJsonText = fs.readFileSync(p1, 'utf8')
      } else if (fs.existsSync(p2)) {
        sampleJsonText = fs.readFileSync(p2, 'utf8')
      }
    } catch (e) {
      console.error('Failed to read sample json:', e)
    }

    // Use the latest flash model with JSON output configuration
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    })

    const systemInstruction = `You are an expert AI assistant specialized in editing and maintaining learning roadmaps (Flowmaps) formatted as JSON.
The user has an existing learning roadmap and wants to make modifications (e.g., adding nodes, deleting nodes, changing node titles, descriptions, notes, colors, resources, subtasks, priority, etc.).

Your job is to apply the user's requested changes directly to the JSON state, and return the ENTIRE updated RoadmapState JSON object.

Format and Schema Requirements:
1. You MUST output ONLY a valid JSON object matching the RoadmapState structure. Do not wrap it in markdown code blocks.
2. The RoadmapState has this structure:
   - "nodes": A dictionary where keys are node IDs, and values are RoadmapNode objects.
   - "rootIds": An array of node IDs that represent top-level category nodes (roots).
   - "layout": (Optional string) The layout name.
3. Every node inside the "nodes" dictionary MUST have these fields:
   - "id": unique string ID. If you create a new node, generate a unique string ID like "node-[random-hash]".
   - "title": string
   - "description": string
   - "parentId": string or null (null for root nodes)
   - "childIds": array of strings (list of immediate children node IDs)
   - "position": object { x: number, y: number } (you can set { x: 0, y: 0 } for new nodes; the layout engine will automatically reposition them)
   - "color": 'indigo' | 'violet' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'blue' | 'teal'
   - "priority": 'low' | 'medium' | 'high' | 'critical'
   - "status": 'not_started' | 'in_progress' | 'completed' | 'blocked'
   - "progress": number (0-100)
   - "deadline": string (ISO date or null)
   - "estimatedHours": number
   - "notes": string
   - "resources": array of objects { id: string, title: string, url: string, type: 'video' | 'article' | 'course' | 'book' | 'tool' | 'other' }
   - "prerequisites": array of strings (node IDs)
   - "childTasks": array of objects { id: string, title: string, completed: boolean }
   - "isExpanded": boolean
   - "isRoot": boolean
   - "completed": boolean
4. Maintain strict referential integrity:
   - If a node is a child of another node, its parentId must match the parent's ID, and its ID must be present in the parent's childIds list.
   - If a node is deleted, you MUST clean up all parent/child/prerequisite references to it across all other nodes.
   - Root nodes must have parentId: null, and their IDs must be in the rootIds array.

Here is a sample import JSON representing a valid roadmap:
"""
${sampleJsonText || '{"nodes":{},"rootIds":[]}'}
"""

Here is the current RoadmapState JSON that you need to update:
"""
${JSON.stringify(currentState)}
"""
`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
    })

    const text = result.response.text()
    const updatedState = JSON.parse(text.trim())

    return NextResponse.json({ updatedState })
  } catch (error: any) {
    console.error('Failed to edit flowmap with Gemini:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to edit flowmap' },
      { status: 500 }
    )
  }
}
