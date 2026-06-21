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

Rule 1: The very first line MUST be exactly "Layout: [Name]" where [Name] is chosen from the following list based on what fits the user's prompt best (e.g. if they ask for a mindmap, pick Classic Mindmap. If they ask for a project, pick Gantt Chart Layout or DAG):
[Classic Top-Down Tree, Bottom-Up Tree, Left-To-Right Tree, Right-To-Left Tree, Balanced Binary Tree, Radial Tree, Circular Tree, Spiral Tree, Fractal Tree, Compact Tree, Force Directed Graph, Force Atlas Layout, Spring Layout, Organic Layout, Social Network Layout, Clustered Force Layout, Dependency Graph, Directed Acyclic Graph (DAG), Layered DAG, Sankey Flow Graph, Classic Mindmap, Right-Side Mindmap, Dual-Side Mindmap, Fishbone Mindmap, Hub-And-Spoke, Wheel Layout, Sunburst Layout, Bubble Mindmap, Cluster Mindmap, Infinity Mindmap, Roadmap Timeline, Gantt Chart Layout, Kanban Board Layout, Swimlane Layout, Milestone Layout, Sprint Planning Layout, Product Roadmap Layout, Dependency Roadmap, Critical Path Layout, Workflow Pipeline Layout, Software Layer Architecture, Microservice Architecture, Hexagonal Architecture, Event-Driven Architecture, Data Pipeline Layout, AI/ML Pipeline Layout, Cloud Infrastructure Layout, Network Topology Layout, Digital Twin Layout, Multi-Island Workspace Layout, Star Topology, Ring Topology, Mesh Topology, Bus Topology, Hierarchical Network Layout, Cluster Hierarchy Layout, Pyramid Layout, Diamond Layout, Funnel Layout, Reverse Funnel Layout, Concentric Circles Layout, Galaxy Layout, Orbit Layout, Solar System Layout, Planetary Cluster Layout, Honeycomb Layout, Hexagonal Grid Layout, Square Grid Layout, Masonry Layout, Treemap Layout, Matrix Layout, Responsibility Matrix (RACI), Team Ownership Layout, Department Hierarchy Layout, Organization Chart Layout, Contributor Flow Layout, Stakeholder Map, Role-Based Layout, Command Chain Layout, Collaboration Network Layout, Story Flow Layout, User Journey Map, Customer Journey Layout, Decision Tree Layout, Decision Network Layout, Risk Analysis Layout, Failure Propagation Layout, Root Cause Analysis Layout, Incident Response Layout, Escalation Flow Layout, Research Map Layout, Knowledge Graph Layout, Documentation Architecture Layout, README Visualization Layout, Repository Architecture Layout, GitHub Project Layout, Issue Dependency Layout, Feature Dependency Layout, Module Dependency Layout, Hybrid Adaptive Layout]

Rule 2: Top-level categories should be plain text without any bullet points or prefixes.
Rule 3: Sub-topics (nodes) MUST start with "  - ".
Rule 4: Under each sub-topic, you MUST use exactly these prefixes indented further:
    Description: [A short explanation]
    Notes: [Important context]
    Subtasks: [Comma-separated tasks]
    Resources: [Comma-separated URLs]

Example:
Layout: Classic Top-Down Tree
Frontend Foundations
  - HTML semantic structure
    Description: Learn the standard markup language.
    Notes: Focus on accessibility.
    Subtasks: Forms, Semantic tags, SEO
    Resources: https://developer.mozilla.org`

    const finalPrompt = `${systemInstruction}\n\nAnalyze the following topic and user request. Pick the best layout from the list of 100, and generate a detailed flowmap structure:\n\n${prompt}`

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
