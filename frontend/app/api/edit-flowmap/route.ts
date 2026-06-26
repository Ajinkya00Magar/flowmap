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

    // Load multiple sample JSON files from the samples folder (RAG context)
    let samplesText = ''
    try {
      const samplesDir = path.join(process.cwd(), '..', 'samples')
      const altSamplesDir = path.join(process.cwd(), 'samples')
      let targetDir = ''
      if (fs.existsSync(samplesDir)) {
        targetDir = samplesDir
      } else if (fs.existsSync(altSamplesDir)) {
        targetDir = altSamplesDir
      }

      if (targetDir) {
        const files = fs.readdirSync(targetDir)
        // Filter for JSON examples (excluding the main simple template)
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'flowmap-import-sample.json')
        
        let loadedCount = 0
        for (const file of jsonFiles) {
          const filePath = path.join(targetDir, file)
          const stat = fs.statSync(filePath)
          // Load only files under 45KB to optimize token usage and context size
          if (stat.size < 45000) {
            const content = fs.readFileSync(filePath, 'utf8')
            samplesText += `Example File: ${file}\nJSON Data:\n${content}\n\n`
            loadedCount++
            if (loadedCount >= 3) break // Limit to 3 examples
          }
        }
      }
    } catch (e) {
      console.error('Failed to read RAG samples:', e)
    }

    // Use the latest flash model with JSON output configuration
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    })

    const systemInstruction = `You are an expert AI assistant specialized in editing and maintaining learning roadmaps (Flowmaps) formatted as JSON.
The user has an existing learning roadmap and wants to make modifications (e.g., adding nodes, deleting nodes, changing node titles, descriptions, notes, colors, resources, subtasks, priority, etc.).

Your job is to apply the user's requested changes directly to the JSON state, and return the ENTIRE updated RoadmapState JSON object.

CRITICAL DIRECTIVE: PRESERVE UNRELATED NODES
You are performing a TWEAK operation, NOT a complete recreation.
1. DO NOT change, delete, or rewrite any nodes, roots, connections, or fields that are not directly related to the user's request.
2. Keep the exact same ID, title, description, parentId, childIds, status, priority, progress, resources, notes, and other fields for all unrelated nodes.
3. Only add new nodes if requested, only delete nodes if requested, and only update specific fields (like color, priority, title, etc.) if requested.
4. If the user asks to "add a child to X", generate a new node with parentId pointing to X, add its new ID to X's childIds array, and leave every other node in the roadmap completely untouched.
5. If the user asks to "change the color of Y", ONLY update the color property of Y and leave everything else identical.
6. Do not re-generate IDs for existing nodes.

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

Here are examples of valid flowmap JSON files in the workspace (RAG training context):
${samplesText || '(No samples loaded)'}

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
