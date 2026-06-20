import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { prompt, currentRoadmapOutline } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 })
    }

    // Use the latest flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemInstruction = `You are an expert Flowmap Maker. The user has an existing learning roadmap, and they want to make modifications to it based on their prompt.
Here is the current text outline of the roadmap:
"""
${currentRoadmapOutline}
"""

Your job is to apply the user's requested changes (e.g. adding new topics, removing topics, or expanding sections) and return the ENTIRE updated roadmap outline.
You MUST return ONLY raw text adhering strictly to the following syntax rules. Do not use Markdown code blocks. Do not add intro or outro text.

SYNTAX RULES:
1. Top-level categories MUST be written plainly (e.g., "React Core" or "Database Fundamentals").
2. Sub-topics MUST be indented under their category with a hyphen (e.g., "  - JSX & Elements").
3. Additional fields MUST be indented under their sub-topic with exactly these prefixes:
   Description: [brief sentence]
   Notes: [short tip]
   Subtasks: [comma separated tasks]
   Resources: [comma separated links]

Ensure you return the FULL updated outline, not just the diff, because the system will completely replace the old outline with your new one. Keep the exact same formatting.`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
    })

    const text = result.response.text()

    return NextResponse.json({ text })
  } catch (error: any) {
    console.error('Failed to edit flowmap with Gemini:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to edit flowmap' },
      { status: 500 }
    )
  }
}
