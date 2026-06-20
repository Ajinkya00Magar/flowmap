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
  priority: Priority = 'medium'
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
    notes: '',
    resources: [],
    prerequisites: [],
    childTasks: [],
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
  childrenData: Array<{ id: string; title: string; description?: string; hours?: number }>,
  xCenter: number,
  color: NodeColor
): { root: RoadmapNode; children: RoadmapNode[] } {
  const root = makeGeneratedNode(rootId, rootTitle, null, { x: xCenter, y: 120 }, color, `${rootTitle} modules & study path.`, 0, 'critical')
  
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
    const y = 260 + row * ySpacing

    const childNode = makeGeneratedNode(
      c.id,
      c.title,
      rootId,
      { x, y },
      color,
      c.description || `Master ${c.title} concepts.`,
      c.hours || 8,
      index < 3 ? 'high' : 'medium'
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
function parseTextOutline(text: string): Array<{ rootTitle: string; children: Array<{ title: string; description: string }> }> {
  const lines = text.split('\n').map(l => l.replace('\r', ''))
  const categories: Array<{ rootTitle: string; children: Array<{ title: string; description: string }> }> = []
  
  let currentCategory: { rootTitle: string; children: Array<{ title: string; description: string }> } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

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

  // 1. Try template match
  if (sourceText.includes('react') || sourceText.includes('next.js') || sourceText.includes('nextjs')) {
    categoryOutlines = TEMPLATES.react
  } else if (sourceText.includes('python') || sourceText.includes('pandas') || sourceText.includes('machine learning') || sourceText.includes('data science')) {
    categoryOutlines = TEMPLATES.python
  } else if (sourceText.includes('devops') || sourceText.includes('docker') || sourceText.includes('kubernetes') || sourceText.includes('ci/cd')) {
    categoryOutlines = TEMPLATES.devops
  } else {
    // 2. Try outline parsing
    const parsed = parseTextOutline(rawInput)
    if (parsed.length > 0) {
      categoryOutlines = parsed
    } else {
      // 3. Fallback: Split raw text by punctuation and build a 3-category path
      const keywords = rawInput
        .split(/[,\n\.\;]/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 50)
        .slice(0, 12)

      if (keywords.length > 0) {
        const chunkSize = Math.ceil(keywords.length / 3)
        const categoriesData = [
          { title: 'Core Foundations', keys: keywords.slice(0, chunkSize) },
          { title: 'Intermediate Concepts', keys: keywords.slice(chunkSize, chunkSize * 2) },
          { title: 'Advanced & Capstones', keys: keywords.slice(chunkSize * 2) }
        ]

        categoryOutlines = categoriesData
          .filter(c => c.keys.length > 0)
          .map(c => ({
            rootTitle: c.title,
            children: c.keys.map(k => ({ title: k, description: `Study and apply ${k}.` }))
          }))
      } else {
        // Absolute fallback (empty or simple input)
        categoryOutlines = [
          {
            rootTitle: 'Phase 1: Getting Started',
            children: [
              { title: 'Basics & Environment Setup', description: 'Install files and build basic hello worlds.' },
              { title: 'Syntax & Core Concepts', description: 'Review basic structures.' }
            ]
          },
          {
            rootTitle: 'Phase 2: Deep Dive',
            children: [
              { title: 'Practical Application', description: 'Create small tools.' },
              { title: 'Libraries & Ecosystem', description: 'Utilize community tools.' }
            ]
          }
        ]
      }
    }
  }

  // Build the RoadmapState object
  const nodes: Record<string, RoadmapNode> = {}
  const rootIds: string[] = []

  categoryOutlines.forEach((outline, catIdx) => {
    const catId = `gen-cat-${catIdx}-${Math.random().toString(36).substring(2, 5)}`
    const color = outline.color || COLORS[catIdx % COLORS.length]
    
    // Position categories spaced apart horizontally
    const xCenter = (catIdx * 500) + 300

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
    version: 1,
    lastSaved: new Date().toISOString()
  }
}
