import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 })
    }

    // Use the latest flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemInstruction = `You are an expert Flowmap Maker. Your job is to break down a topic into a detailed, logically ordered learning roadmap.
You MUST return ONLY raw text adhering strictly to the following syntax rules. Do not use Markdown code blocks. Do not add intro or outro text.

Rule 1: Top-level categories should be plain text without any bullet points or prefixes.
Rule 2: Sub-topics (nodes) MUST start with "  - ".
Rule 3: Under each sub-topic, you MUST use exactly these prefixes indented further:
    Description: [A short explanation]
    Notes: [Important context]
    Subtasks: [Comma-separated tasks]
    Resources: [Comma-separated URLs]

Example:
Frontend Foundations
  - HTML semantic structure
    Description: Learn the standard markup language.
    Notes: Focus on accessibility.
    Subtasks: Forms, Semantic tags, SEO
    Resources: https://developer.mozilla.org`

    const finalPrompt = `${systemInstruction}\n\nGenerate a detailed roadmap for the following topic: ${prompt}`

    const result = await model.generateContent(finalPrompt)
    const responseText = result.response.text()

    // Clean up any potential markdown code blocks that the model might incorrectly wrap it in
    const cleanText = responseText.replace(/^```(\w+)?\n/, '').replace(/```$/, '').trim()

    return NextResponse.json({ result: cleanText })
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate flowmap' }, { status: 500 })
  }
}
