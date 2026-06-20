import type { RoadmapNode, NodeColor } from '@/types/roadmap'

// ─── Helper ───────────────────────────────────────────────────────────────

const now = new Date().toISOString()

function makeNode(
  id: string,
  title: string,
  parentId: string | null,
  position: { x: number; y: number },
  color: NodeColor,
  overrides: Partial<RoadmapNode> = {}
): RoadmapNode {
  return {
    id,
    title,
    description: '',
    parentId,
    childIds: [],
    position,
    color,
    priority: 'medium',
    status: 'not_started',
    progress: 0,
    deadline: null,
    estimatedHours: 0,
    notes: '',
    resources: [],
    prerequisites: [],
    childTasks: [],
    isExpanded: true,
    isRoot: parentId === null,
    completed: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// ─── Node Definitions ─────────────────────────────────────────────────────

export function buildDefaultNodes(): Record<string, RoadmapNode> {
  const nodes: Record<string, RoadmapNode> = {}

  function add(node: RoadmapNode) {
    nodes[node.id] = node
  }

  // ── DSA (top center) ─────────────────────────────────────────────────
  add(makeNode('dsa', 'DSA', null, { x: 600, y: 120 }, 'indigo', {
    description: 'Data Structures & Algorithms — the core of competitive programming and technical interviews.',
    estimatedHours: 200,
    priority: 'critical',
    isRoot: true,
  }))

  const dsaChildren = [
    { id: 'dsa-arrays',        title: 'Arrays',              x: 360, y: 260, hours: 8 },
    { id: 'dsa-strings',       title: 'Strings',             x: 480, y: 260, hours: 6 },
    { id: 'dsa-linked-lists',  title: 'Linked Lists',        x: 600, y: 260, hours: 10 },
    { id: 'dsa-stacks',        title: 'Stacks',              x: 720, y: 260, hours: 6 },
    { id: 'dsa-queues',        title: 'Queues',              x: 840, y: 260, hours: 6 },
    { id: 'dsa-binary-search', title: 'Binary Search',       x: 360, y: 360, hours: 8 },
    { id: 'dsa-trees',         title: 'Trees',               x: 480, y: 360, hours: 12 },
    { id: 'dsa-bst',           title: 'BST',                 x: 600, y: 360, hours: 10 },
    { id: 'dsa-heaps',         title: 'Heaps',               x: 720, y: 360, hours: 8 },
    { id: 'dsa-hashmaps',      title: 'Hash Maps',           x: 840, y: 360, hours: 8 },
    { id: 'dsa-recursion',     title: 'Recursion',           x: 360, y: 460, hours: 10 },
    { id: 'dsa-backtracking',  title: 'Backtracking',        x: 480, y: 460, hours: 10 },
    { id: 'dsa-graphs',        title: 'Graphs',              x: 600, y: 460, hours: 16 },
    { id: 'dsa-dp',            title: 'Dynamic Programming', x: 720, y: 460, hours: 24 },
    { id: 'dsa-greedy',        title: 'Greedy',              x: 840, y: 460, hours: 10 },
    { id: 'dsa-sliding-win',   title: 'Sliding Window',      x: 440, y: 560, hours: 8 },
    { id: 'dsa-two-ptr',       title: 'Two Pointers',        x: 600, y: 560, hours: 8 },
    { id: 'dsa-bits',          title: 'Bit Manipulation',    x: 760, y: 560, hours: 8 },
    { id: 'dsa-contests',      title: 'Contest Practice',    x: 600, y: 660, hours: 40 },
  ]
  dsaChildren.forEach(c => {
    add(makeNode(c.id, c.title, 'dsa', { x: c.x, y: c.y }, 'indigo', {
      estimatedHours: c.hours,
    }))
    nodes['dsa'].childIds.push(c.id)
  })

  // ── Web Development (right) ───────────────────────────────────────────
  add(makeNode('webdev', 'Web Development', null, { x: 1200, y: 120 }, 'emerald', {
    description: 'Full-stack web development from fundamentals to production deployment.',
    estimatedHours: 300,
    priority: 'critical',
    isRoot: true,
  }))

  const webdevChildren = [
    { id: 'web-html',       title: 'HTML',                  x: 1020, y: 260, hours: 8 },
    { id: 'web-css',        title: 'CSS',                   x: 1160, y: 260, hours: 10 },
    { id: 'web-responsive', title: 'Responsive Design',     x: 1300, y: 260, hours: 8 },
    { id: 'web-js',         title: 'JavaScript',            x: 1440, y: 260, hours: 40 },
    { id: 'web-ts',         title: 'TypeScript',            x: 1020, y: 380, hours: 16 },
    { id: 'web-git',        title: 'Git',                   x: 1160, y: 380, hours: 8 },
    { id: 'web-github',     title: 'GitHub',                x: 1300, y: 380, hours: 6 },
    { id: 'web-react',      title: 'React',                 x: 1440, y: 380, hours: 30 },
    { id: 'web-nextjs',     title: 'Next.js',               x: 1020, y: 500, hours: 24 },
    { id: 'web-nodejs',     title: 'Node.js',               x: 1160, y: 500, hours: 20 },
    { id: 'web-express',    title: 'Express',               x: 1300, y: 500, hours: 16 },
    { id: 'web-rest',       title: 'REST APIs',             x: 1440, y: 500, hours: 12 },
    { id: 'web-postgres',   title: 'PostgreSQL',            x: 1080, y: 620, hours: 16 },
    { id: 'web-supabase',   title: 'Supabase',              x: 1220, y: 620, hours: 12 },
    { id: 'web-auth',       title: 'Authentication',        x: 1360, y: 620, hours: 10 },
    { id: 'web-deploy',     title: 'Deployment',            x: 1200, y: 740, hours: 10 },
    { id: 'web-ai',         title: 'AI-assisted Dev',       x: 1200, y: 840, hours: 8 },
  ]
  webdevChildren.forEach(c => {
    add(makeNode(c.id, c.title, 'webdev', { x: c.x, y: c.y }, 'emerald', {
      estimatedHours: c.hours,
    }))
    nodes['webdev'].childIds.push(c.id)
  })

  // ── Projects (center) ─────────────────────────────────────────────────
  add(makeNode('projects', 'Projects', null, { x: 600, y: 860 }, 'cyan', {
    description: 'Real-world projects that demonstrate skills to recruiters.',
    estimatedHours: 180,
    priority: 'high',
    isRoot: true,
  }))

  const projectChildren = [
    { id: 'proj-campus',    title: 'Campus Buddy MVP',        x: 360, y: 980 },
    { id: 'proj-auth',      title: 'Auth Module',             x: 480, y: 980 },
    { id: 'proj-dashboard', title: 'Student Dashboard',       x: 600, y: 980 },
    { id: 'proj-resources', title: 'Resource Sharing Module', x: 720, y: 980 },
    { id: 'proj-placement', title: 'Placement Tracker',       x: 840, y: 980 },
    { id: 'proj-resume',    title: 'Resume Builder',          x: 440, y: 1080 },
    { id: 'proj-portfolio', title: 'Portfolio Website',       x: 600, y: 1080 },
    { id: 'proj-api',       title: 'API Integrations',        x: 760, y: 1080 },
    { id: 'proj-deploy',    title: 'Production Deployment',   x: 600, y: 1180 },
  ]
  projectChildren.forEach(c => {
    add(makeNode(c.id, c.title, 'projects', { x: c.x, y: c.y }, 'cyan', {
      estimatedHours: 20,
    }))
    nodes['projects'].childIds.push(c.id)
  })

  // ── Hackathons (bottom right) ─────────────────────────────────────────
  add(makeNode('hackathons', 'Hackathons', null, { x: 1200, y: 920 }, 'amber', {
    description: 'Competitive hackathon preparation and participation strategy.',
    estimatedHours: 60,
    priority: 'high',
    isRoot: true,
  }))

  const hackChildren = [
    { id: 'hack-team',      title: 'Team Formation',      x: 1020, y: 1060 },
    { id: 'hack-idea',      title: 'Idea Validation',     x: 1160, y: 1060 },
    { id: 'hack-proto',     title: 'Rapid Prototyping',   x: 1300, y: 1060 },
    { id: 'hack-ui',        title: 'UI/UX Polish',        x: 1440, y: 1060 },
    { id: 'hack-pitch',     title: 'Pitch Deck',          x: 1080, y: 1160 },
    { id: 'hack-demo',      title: 'Demo Video',          x: 1220, y: 1160 },
    { id: 'hack-present',   title: 'Final Presentation',  x: 1360, y: 1160 },
  ]
  hackChildren.forEach(c => {
    add(makeNode(c.id, c.title, 'hackathons', { x: c.x, y: c.y }, 'amber', {
      estimatedHours: 8,
    }))
    nodes['hackathons'].childIds.push(c.id)
  })

  // ── Academics (top left) ──────────────────────────────────────────────
  add(makeNode('academics', 'Academics', null, { x: 120, y: 120 }, 'violet', {
    description: 'Core BTech Computer Engineering curriculum and coursework.',
    estimatedHours: 400,
    priority: 'critical',
    isRoot: true,
  }))

  const academicChildren = [
    { id: 'acad-maths',    title: 'Mathematics',         x: -80, y: 260 },
    { id: 'acad-de',       title: 'Digital Electronics', x: 60,  y: 260 },
    { id: 'acad-ds',       title: 'Data Structures',     x: 200, y: 260 },
    { id: 'acad-oop',      title: 'OOP',                 x: 340, y: 260 },
    { id: 'acad-dbms',     title: 'DBMS',                x: -40, y: 360 },
    { id: 'acad-os',       title: 'Operating Systems',   x: 120, y: 360 },
    { id: 'acad-cn',       title: 'Computer Networks',   x: 280, y: 360 },
  ]
  academicChildren.forEach(c => {
    add(makeNode(c.id, c.title, 'academics', { x: c.x, y: c.y }, 'violet', {
      estimatedHours: 40,
      priority: 'high',
    }))
    nodes['academics'].childIds.push(c.id)
  })

  // ── Career (bottom left) ──────────────────────────────────────────────
  add(makeNode('career', 'Career', null, { x: 120, y: 860 }, 'rose', {
    description: 'Job search strategy, applications, and professional presence.',
    estimatedHours: 80,
    priority: 'high',
    isRoot: true,
  }))

  const careerChildren = [
    { id: 'career-resume',    title: 'Resume Building',          x: -80, y: 1000 },
    { id: 'career-linkedin',  title: 'LinkedIn Optimization',    x: 80,  y: 1000 },
    { id: 'career-github',    title: 'GitHub Profile',           x: 240, y: 1000 },
    { id: 'career-oss',       title: 'Open Source',              x: 400, y: 1000 },
    { id: 'career-internship',title: 'Internship Applications',  x: 80,  y: 1100 },
    { id: 'career-aptitude',  title: 'Aptitude Prep',            x: 240, y: 1100 },
  ]
  careerChildren.forEach(c => {
    add(makeNode(c.id, c.title, 'career', { x: c.x, y: c.y }, 'rose', {
      estimatedHours: 10,
      priority: 'high',
    }))
    nodes['career'].childIds.push(c.id)
  })

  return nodes
}

export const DEFAULT_ROOT_IDS = ['academics', 'dsa', 'webdev', 'projects', 'hackathons', 'career']
