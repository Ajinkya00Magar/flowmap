import type { RoadmapState, RoadmapNode, NodeColor, Priority } from '@/types/roadmap'

const COLORS: NodeColor[] = ['indigo', 'emerald', 'violet', 'cyan', 'amber', 'rose', 'blue', 'teal']

// Helper to make a roadmap node
function makeGeneratedNode(
  id: string,
  title: string,
  parentId: string | null,
  position: { x: number; y: number },
  color: NodeColor,
  description = '',
  hours = 10,
  priority: Priority = 'medium',
  notes = '',
  childTasks: Array<{ id: string; title: string; completed: boolean }> = [],
  resources: Array<{ id: string; title: string; url: string; type: 'video' | 'article' | 'book' | 'interactive' | 'other' }> = []
): RoadmapNode {
  const now = new Date().toISOString()
  return {
    id,
    title,
    description,
    parentId,
    childIds: [],
    position,
    color,
    priority,
    status: 'not_started',
    progress: 0,
    deadline: null,
    estimatedHours: hours,
    notes,
    resources,
    prerequisites: [],
    childTasks,
    isExpanded: true,
    isRoot: parentId === null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }
}

// Layout nodes in a clean grid under each category root
function layoutTree(
  rootId: string,
  rootTitle: string,
  childrenData: Array<{ id: string; title: string; description?: string; hours?: number; notes?: string; subtasks?: string[]; resources?: string[] }>,
  xCenter: number,
  yStart: number,
  color: NodeColor
): { root: RoadmapNode; children: RoadmapNode[] } {
  const root = makeGeneratedNode(rootId, rootTitle, null, { x: xCenter, y: yStart }, color, `${rootTitle} modules & study path.`, 0, 'critical')
  
  const children: RoadmapNode[] = []
  const itemsPerRow = 3
  const xSpacing = 150
  const ySpacing = 120

  childrenData.forEach((c, index) => {
    const row = Math.floor(index / itemsPerRow)
    const colInRow = index % itemsPerRow
    
    // Calculate centered x positions for this row
    const rowCount = Math.min(itemsPerRow, childrenData.length - row * itemsPerRow)
    const startX = xCenter - ((rowCount - 1) * xSpacing) / 2
    const x = startX + colInRow * xSpacing
    const y = yStart + 140 + row * ySpacing

    const childNode = makeGeneratedNode(
      c.id,
      c.title,
      rootId,
      { x, y },
      color,
      c.description || `Master ${c.title} concepts.`,
      c.hours || 8,
      index < 3 ? 'high' : 'medium',
      c.notes || '',
      (c.subtasks || []).map((st, i) => ({ id: `st-${i}-${c.id}`, title: st, completed: false })),
      (c.resources || []).map((res, i) => ({ id: `res-${i}-${c.id}`, title: res, url: res, type: 'article' }))
    )
    
    children.push(childNode)
    root.childIds.push(childNode.id)
  })

  return { root, children }
}

// ─── Predefined Curated Templates ──────────────────────────────────────────
const TEMPLATES: Record<string, Array<{ rootTitle: string; color: NodeColor; children: Array<{ title: string; description: string; hours: number }> }>> = {
  react: [
    {
      rootTitle: 'React Core',
      color: 'cyan',
      children: [
        { title: 'JSX & Elements', description: 'Understand render logic, components, and attributes.', hours: 4 },
        { title: 'Props & State', description: 'Learn data flow and useState hook.', hours: 6 },
        { title: 'Effects & Lifecycle', description: 'Master useEffect and side effect handling.', hours: 8 },
        { title: 'Handling Forms', description: 'Controlled vs uncontrolled inputs.', hours: 5 },
        { title: 'Custom Hooks', description: 'Encapsulate and reuse stateful logic.', hours: 10 }
      ]
    },
    {
      rootTitle: 'Next.js App Router',
      color: 'indigo',
      children: [
        { title: 'Routing & Pages', description: 'Folder-based routing structure.', hours: 6 },
        { title: 'Server Components', description: 'Server-side vs client-side rendering.', hours: 8 },
        { title: 'Data Fetching', description: 'Fetching, caching, and revalidating data.', hours: 8 },
        { title: 'Server Actions', description: 'Mutate data directly inside server files.', hours: 8 }
      ]
    },
    {
      rootTitle: 'Production React',
      color: 'emerald',
      children: [
        { title: 'State Managers', description: 'Zustand, Redux, Context API.', hours: 12 },
        { title: 'CSS Frameworks', description: 'Tailwind CSS, Styled Components.', hours: 6 },
        { title: 'Testing Apps', description: 'Jest and React Testing Library.', hours: 10 },
        { title: 'Deployment Vercel', description: 'Production builds and performance optimization.', hours: 5 }
      ]
    }
  ],
  python: [
    {
      rootTitle: 'Python Basics',
      color: 'violet',
      children: [
        { title: 'Syntax & Types', description: 'Variables, loops, and conditional branches.', hours: 6 },
        { title: 'Data Structures', description: 'Lists, tuples, dictionaries, sets.', hours: 8 },
        { title: 'Functions & Modules', description: 'Writing dry code and importing packages.', hours: 6 },
        { title: 'OOP in Python', description: 'Classes, inheritance, and methods.', hours: 10 }
      ]
    },
    {
      rootTitle: 'Data Analytics',
      color: 'emerald',
      children: [
        { title: 'NumPy Libraries', description: 'Multidimensional array math.', hours: 8 },
        { title: 'Pandas & Dataframes', description: 'Data ingestion, cleaning, and querying.', hours: 16 },
        { title: 'Matplotlib & Seaborn', description: 'Plotting charts and scientific distributions.', hours: 8 }
      ]
    },
    {
      rootTitle: 'Machine Learning',
      color: 'amber',
      children: [
        { title: 'Supervised Learning', description: 'Linear regressions and decision trees.', hours: 20 },
        { title: 'Unsupervised Learning', description: 'K-Means clustering and PCA dimension reduction.', hours: 14 },
        { title: 'Scikit-Learn Library', description: 'Fitting models and evaluating metrics.', hours: 12 },
        { title: 'Deep Learning Intro', description: 'Neural networks, PyTorch, and TensorFlow.', hours: 30 }
      ]
    }
  ],
  devops: [
    {
      rootTitle: 'Linux & Scripting',
      color: 'rose',
      children: [
        { title: 'Shell Terminal', description: 'Bash commands, permissions, and packages.', hours: 10 },
        { title: 'Networking Fundamentals', description: 'IPs, DNS, ports, protocols, firewalls.', hours: 12 },
        { title: 'Git & Workflows', description: 'Commits, branches, and merge requests.', hours: 8 }
      ]
    },
    {
      rootTitle: 'Containers & CI/CD',
      color: 'indigo',
      children: [
        { title: 'Docker Containers', description: 'Writing Dockerfiles and mounting volumes.', hours: 14 },
        { title: 'Docker Compose', description: 'Orchestrating multi-container systems locally.', hours: 8 },
        { title: 'GitHub Actions', description: 'Automating build pipelines and tests.', hours: 12 }
      ]
    },
    {
      rootTitle: 'Infrastructure',
      color: 'teal',
      children: [
        { title: 'Terraform IaC', description: 'Writing declarative server scripts.', hours: 16 },
        { title: 'Kubernetes basics', description: 'Pods, deployments, and services.', hours: 24 },
        { title: 'Cloud Monitoring', description: 'Prometheus, Grafana, and system logs.', hours: 12 }
      ]
    }
  ]
}

// Parse text input that looks like a markdown or indent list
function parseTextOutline(text: string): Array<{ rootTitle: string; children: Array<{ title: string; description: string; notes?: string; subtasks?: string[]; resources?: string[] }> }> {
  const lines = text.split('\n').map(l => l.replace('\r', ''))
  const categories: Array<{ rootTitle: string; children: Array<{ title: string; description: string; notes?: string; subtasks?: string[]; resources?: string[] }> }> = []
  
  let currentCategory: { rootTitle: string; children: Array<{ title: string; description: string; notes?: string; subtasks?: string[]; resources?: string[] }> } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const lowerTrimmed = trimmed.toLowerCase()
    
    // Check if it's a field belonging to the last sub-topic
    if (currentCategory && currentCategory.children.length > 0) {
      const lastChild = currentCategory.children[currentCategory.children.length - 1]
      
      if (lowerTrimmed.startsWith('description:')) {
        lastChild.description = trimmed.substring('description:'.length).trim()
        continue
      }
      if (lowerTrimmed.startsWith('notes:')) {
        lastChild.notes = trimmed.substring('notes:'.length).trim()
        continue
      }
      if (lowerTrimmed.startsWith('subtasks:')) {
        lastChild.subtasks = trimmed.substring('subtasks:'.length).split(',').map(s => s.trim()).filter(Boolean)
        continue
      }
      if (lowerTrimmed.startsWith('resources:')) {
        lastChild.resources = trimmed.substring('resources:'.length).split(',').map(s => s.trim()).filter(Boolean)
        continue
      }
    }

    // Determine line hierarchy by counting leading spaces/tabs or bullet characters
    const isTopic = line.startsWith(' ') || line.startsWith('\t') || trimmed.startsWith('-') || trimmed.startsWith('*')

    if (!isTopic) {
      // It's a top-level category node
      // Strip formatting numbers like "1. ", "Category:"
      const title = trimmed.replace(/^\d+[\.\)\s]+/, '').replace(/^Category:\s*/i, '').trim()
      currentCategory = { rootTitle: title, children: [] }
      categories.push(currentCategory)
    } else {
      // It's a sub-topic node
      if (!currentCategory) {
        // Fallback if indented line is found first
        currentCategory = { rootTitle: 'Fundamentals', children: [] }
        categories.push(currentCategory)
      }
      
      const title = trimmed.replace(/^[\-\*\+\d\.\)\s]+/, '').trim()
      currentCategory.children.push({
        title,
        description: `Learn more about ${title}.`
      })
    }
  }

  return categories
}

// ─── Main Generator Function ──────────────────────────────────────────────
export function generateRoadmapFromInput(
  title: string,
  rawInput: string,
  fileName?: string
): RoadmapState {
  const cleanTitle = title.trim() || 'Custom Learning Path'
  
  // Decide which source to analyze: file name, raw text input, etc.
  const sourceText = (rawInput + ' ' + (fileName || '')).toLowerCase()
  
  let categoryOutlines: Array<{ rootTitle: string; color?: NodeColor; children: Array<{ title: string; description?: string; hours?: number }> }> = []

  // 1. Try outline parsing first (so AI output isn't overwritten by keyword templates)
  const parsed = parseTextOutline(rawInput)
  
  // Only use parsed result if it actually extracted a structured tree (has children)
  if (parsed.length > 0 && parsed.some(c => c.children && c.children.length > 0)) {
    categoryOutlines = parsed
  } else {
    throw new Error('Failed to parse AI output into a valid roadmap. Please try a different prompt.')
  }

  // Build the RoadmapState object
  const nodes: Record<string, RoadmapNode> = {}
  const rootIds: string[] = []

  categoryOutlines.forEach((outline, catIdx) => {
    const catId = `gen-cat-${catIdx}-${Math.random().toString(36).substring(2, 5)}`
    const color = outline.color || COLORS[catIdx % COLORS.length]
    
    // Grid layout for Root Categories (max 3 categories per row)
    const MAX_COLS = 3
    const gridRow = Math.floor(catIdx / MAX_COLS)
    const gridCol = catIdx % MAX_COLS

    const xCenter = (gridCol * 520) + 300
    const yStart = (gridRow * 450) + 120

    const { root, children } = layoutTree(
      catId,
      outline.rootTitle,
      outline.children.map((c, i) => ({
        id: `gen-node-${catIdx}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        title: c.title,
        description: c.description,
        hours: c.hours
      })),
      xCenter,
      yStart,
      color
    )

    nodes[root.id] = root
    rootIds.push(root.id)

    children.forEach(c => {
      nodes[c.id] = c
    })
  })

  return {
    nodes,
    rootIds,
    selectedNodeId: null,
    selectedNodeIds: [],
    version: 1,
    lastSaved: new Date().toISOString()
  }
}

// ─── AI Update Generators ──────────────────────────────────────────────────

export function stateToTextOutline(state: RoadmapState): string {
  let outline = ''
  
  state.rootIds.forEach(rootId => {
    const root = state.nodes[rootId]
    if (!root) return
    outline += `${root.title}\n`
    
    root.childIds.forEach(childId => {
      const child = state.nodes[childId]
      if (!child) return
      outline += `  - ${child.title}\n`
      if (child.description) outline += `    Description: ${child.description}\n`
      if (child.notes) outline += `    Notes: ${child.notes}\n`
      if (child.childTasks?.length > 0) {
        outline += `    Subtasks: ${child.childTasks.map(t => t.title).join(', ')}\n`
      }
      if (child.resources?.length > 0) {
        outline += `    Resources: ${child.resources.map(r => r.url).join(', ')}\n`
      }
    })
    outline += '\n'
  })
  
  return outline.trim()
}

export function mergeAIOutlineToState(state: RoadmapState, aiOutlineText: string): RoadmapState {
  const parsedOutlines = parseTextOutline(aiOutlineText)
  const nextNodes = { ...state.nodes }
  const nextRootIds: string[] = []

  parsedOutlines.forEach((outline, catIdx) => {
    // Find matching root by title (case-insensitive)
    let rootNode = Object.values(nextNodes).find(n => n.isRoot && n.title.toLowerCase().trim() === outline.rootTitle.toLowerCase().trim())
    
    if (!rootNode) {
       const catId = `gen-cat-${catIdx}-${Math.random().toString(36).substring(2, 5)}`
       const xCenter = 300 + (catIdx * 520)
       const yStart = 120 + (Math.floor(catIdx / 3) * 450)
       rootNode = makeGeneratedNode(catId, outline.rootTitle, null, { x: xCenter, y: yStart }, COLORS[catIdx % COLORS.length])
       nextNodes[rootNode.id] = rootNode
    }
    
    nextRootIds.push(rootNode.id)
    
    const nextChildIds: string[] = []
    
    outline.children.forEach((c, childIdx) => {
      let childNode = Object.values(nextNodes).find(n => n.parentId === rootNode!.id && n.title.toLowerCase().trim() === c.title.toLowerCase().trim())
      
      if (!childNode) {
        const childId = `gen-node-${catIdx}-${childIdx}-${Math.random().toString(36).substring(2, 5)}`
        // Give new nodes an offset position relative to the root
        const xOffset = ((childIdx % 3) - 1) * 160
        const yOffset = Math.floor(childIdx / 3) * 140 + 120
        const pos = { x: rootNode!.position.x + xOffset, y: rootNode!.position.y + yOffset }
        childNode = makeGeneratedNode(childId, c.title, rootNode!.id, pos, rootNode!.color, c.description, c.hours ? Number(c.hours) : 10, 'medium', c.notes)
        
        if (c.subtasks) {
          childNode.childTasks = c.subtasks.map(st => ({ id: `task-${Math.random()}`, title: st, completed: false }))
        }
        if (c.resources) {
          childNode.resources = c.resources.map(r => ({ id: `res-${Math.random()}`, title: r, url: r, type: 'other' }))
        }
      } else {
        // Update existing child node with AI fields
        childNode = {
          ...childNode,
          description: c.description || childNode.description,
          notes: c.notes || childNode.notes,
        }
        
        if (c.subtasks && c.subtasks.length > 0) {
          // Merge subtasks if provided by AI
          const newTasks = c.subtasks.map(st => ({ id: `task-${Math.random()}`, title: st, completed: false }))
          childNode.childTasks = [...childNode.childTasks, ...newTasks]
        }
        if (c.resources && c.resources.length > 0) {
          const newRes = c.resources.map(r => ({ id: `res-${Math.random()}`, title: r, url: r, type: 'other' as const }))
          childNode.resources = [...childNode.resources, ...newRes]
        }
      }
      
      nextNodes[childNode.id] = childNode
      nextChildIds.push(childNode.id)
    })
    
    nextNodes[rootNode.id] = {
      ...rootNode,
      childIds: nextChildIds
    }
  })

  // We could delete nodes that are no longer in the AI outline, but to be safe and preserve manual user work, we leave them in `nextNodes` even if they aren't in `childIds`. They will act as disconnected/orphan nodes.

  return {
    ...state,
    nodes: nextNodes,
    rootIds: nextRootIds,
    version: state.version + 1,
    lastSaved: new Date().toISOString()
  }
}
