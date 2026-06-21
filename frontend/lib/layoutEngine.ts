import dagre from 'dagre'
import * as d3Force from 'd3-force'
import type { RoadmapNode } from '@/types/roadmap'

export function applyLayout(nodes: Record<string, RoadmapNode>, layoutName: string): Record<string, RoadmapNode> {
  const normLayout = (layoutName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Categorize layouts based on user prompt mapping

  // 1-10 Trees
  if (normLayout.includes('bottomup')) return applyDagre(nodes, 'BT')
  if (normLayout.includes('lefttoright')) return applyDagre(nodes, 'LR')
  if (normLayout.includes('righttoleft')) return applyDagre(nodes, 'RL')
  if (normLayout.includes('radial') || normLayout.includes('circular') || normLayout.includes('sunburst')) return applyRadial(nodes) // Using custom radial mapped from Dagre
  if (normLayout.includes('spiral') || normLayout.includes('fractal')) return applyDagre(nodes, 'TB')
  
  // 11-20 Force & Graphs
  if (normLayout.includes('force') || normLayout.includes('spring') || normLayout.includes('organic') || normLayout.includes('socialnetwork')) return applyForce(nodes)
  if (normLayout.includes('dag') || normLayout.includes('directedacyclic') || normLayout.includes('sankey')) return applyDagre(nodes, 'LR')
  
  // 21-30 Mindmaps
  if (normLayout.includes('mindmap') || normLayout.includes('hubandspoke') || normLayout.includes('wheel')) {
    if (normLayout.includes('rightside')) return applyDagre(nodes, 'LR')
    return applyMindmap(nodes) // Custom dual-sided
  }

  // 31-40 Project management
  if (normLayout.includes('timeline') || normLayout.includes('gantt') || normLayout.includes('kanban') || normLayout.includes('swimlane') || normLayout.includes('workflow') || normLayout.includes('pipeline')) return applyDagre(nodes, 'LR')
  
  // 41-50 Architecture
  if (normLayout.includes('layer') || normLayout.includes('microservice') || normLayout.includes('hexagonal') || normLayout.includes('cloud')) return applyDagre(nodes, 'TB')
  
  // 51-60 Topologies
  if (normLayout.includes('mesh') || normLayout.includes('cluster') || normLayout.includes('ring')) return applyForce(nodes)
  if (normLayout.includes('pyramid') || normLayout.includes('funnel')) return applyDagre(nodes, 'TB')
  if (normLayout.includes('reversefunnel')) return applyDagre(nodes, 'BT')
  
  // 61-70 Clusters
  if (normLayout.includes('galaxy') || normLayout.includes('solar') || normLayout.includes('planet')) return applyForce(nodes)
  if (normLayout.includes('concentric') || normLayout.includes('orbit')) return applyRadial(nodes)
  if (normLayout.includes('grid') || normLayout.includes('masonry') || normLayout.includes('matrix')) return applyGrid(nodes)
  
  // 71-80 Org
  if (normLayout.includes('raci') || normLayout.includes('department') || normLayout.includes('organization') || normLayout.includes('commandchain') || normLayout.includes('stakeholder')) return applyDagre(nodes, 'TB')
  
  // 81-90 Flows
  if (normLayout.includes('story') || normLayout.includes('journey') || normLayout.includes('escalation')) return applyDagre(nodes, 'LR')
  if (normLayout.includes('decision') || normLayout.includes('rootcause') || normLayout.includes('failure')) return applyDagre(nodes, 'TB')
  
  // 91-100 Docs
  if (normLayout.includes('knowledgegraph') || normLayout.includes('researchmap')) return applyForce(nodes)
  if (normLayout.includes('repository') || normLayout.includes('module') || normLayout.includes('issue') || normLayout.includes('feature')) return applyDagre(nodes, 'LR')

  // Default layout if none matched
  return applyDagre(nodes, 'TB')
}

// ─── Base Engines ─────────────────────────────────────────────────────────

function applyDagre(nodes: Record<string, RoadmapNode>, rankdir: string): Record<string, RoadmapNode> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir, nodesep: 150, ranksep: 200 })
  g.setDefaultEdgeLabel(() => ({}))

  Object.values(nodes).forEach(n => {
    g.setNode(n.id, { width: 240, height: 100 })
  })

  Object.values(nodes).forEach(n => {
    if (n.parentId) {
      g.setEdge(n.parentId, n.id)
    }
    n.prerequisites.forEach(prereq => {
      if (nodes[prereq]) {
        g.setEdge(prereq, n.id)
      }
    })
  })

  dagre.layout(g)

  const newNodes = { ...nodes }
  g.nodes().forEach(v => {
    if (newNodes[v]) {
      const nodeLayout = g.node(v)
      // shift positions a bit to be positive mostly
      newNodes[v] = { ...newNodes[v], position: { x: nodeLayout.x + 500, y: nodeLayout.y + 500 } }
    }
  })
  return newNodes
}

function applyForce(nodes: Record<string, RoadmapNode>): Record<string, RoadmapNode> {
  const nodeArr = Object.values(nodes).map(n => ({ id: n.id, x: Math.random() * 1000, y: Math.random() * 1000 }))
  const links: { source: string, target: string }[] = []
  
  Object.values(nodes).forEach(n => {
    if (n.parentId && nodes[n.parentId]) {
      links.push({ source: n.parentId, target: n.id })
    }
    n.prerequisites.forEach(p => {
      if (nodes[p]) {
        links.push({ source: p, target: n.id })
      }
    })
  })

  const simulation = d3Force.forceSimulation(nodeArr as any)
    .force('charge', d3Force.forceManyBody().strength(-5000))
    .force('link', d3Force.forceLink(links).id((d: any) => d.id).distance(300))
    .force('center', d3Force.forceCenter(2000, 2000))
    .force('collide', d3Force.forceCollide().radius(200))
    .stop()
    
  // Run physics simulation statically
  for (let i = 0; i < 300; i++) simulation.tick()

  const newNodes = { ...nodes }
  nodeArr.forEach(n => {
    if (newNodes[n.id]) {
      newNodes[n.id] = { ...newNodes[n.id], position: { x: n.x, y: n.y } }
    }
  })
  return newNodes
}

function applyGrid(nodes: Record<string, RoadmapNode>): Record<string, RoadmapNode> {
  const newNodes = { ...nodes }
  const nodeArr = Object.values(newNodes)
  
  const cols = Math.ceil(Math.sqrt(nodeArr.length))
  const spacingX = 350
  const spacingY = 200

  nodeArr.forEach((n, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    newNodes[n.id] = {
      ...n,
      position: { x: col * spacingX + 500, y: row * spacingY + 500 }
    }
  })

  return newNodes
}

function applyRadial(nodes: Record<string, RoadmapNode>): Record<string, RoadmapNode> {
  // Generate a TB tree first, then wrap the coordinates around a circle!
  // This is a highly robust hack to achieve radial trees without d3-hierarchy breaking on multiple roots
  const tbNodes = applyDagre(nodes, 'TB')
  
  const nodeArr = Object.values(tbNodes)
  if (nodeArr.length === 0) return tbNodes

  // Find min and max y to determine layers (radius)
  let minY = Infinity, maxY = -Infinity
  let minX = Infinity, maxX = -Infinity
  
  nodeArr.forEach(n => {
    if (n.position.y < minY) minY = n.position.y
    if (n.position.y > maxY) maxY = n.position.y
    if (n.position.x < minX) minX = n.position.x
    if (n.position.x > maxX) maxX = n.position.x
  })

  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)

  const newNodes = { ...tbNodes }
  
  nodeArr.forEach(n => {
    // Normalize x to an angle (0 to 2PI)
    const angle = ((n.position.x - minX) / width) * 2 * Math.PI
    
    // Normalize y to a radius (start at 300 so root isn't a singularity)
    const radius = 300 + ((n.position.y - minY) / height) * 1500

    newNodes[n.id] = {
      ...n,
      position: {
        x: 2000 + radius * Math.cos(angle - Math.PI / 2),
        y: 2000 + radius * Math.sin(angle - Math.PI / 2)
      }
    }
  })

  return newNodes
}

function applyMindmap(nodes: Record<string, RoadmapNode>): Record<string, RoadmapNode> {
  // Dual-sided mindmap. 
  // We split the top-level children of the root(s) into two groups (Left and Right)
  // We layout the left group RL, the right group LR, then merge.
  
  const rootIds = Object.values(nodes).filter(n => !n.parentId).map(n => n.id)
  
  const leftNodes: Record<string, RoadmapNode> = {}
  const rightNodes: Record<string, RoadmapNode> = {}
  
  // Assign roots to right side (center)
  rootIds.forEach(id => { rightNodes[id] = nodes[id] })

  // Find immediate children of all roots
  let counter = 0
  const immediateChildren = Object.values(nodes).filter(n => n.parentId && rootIds.includes(n.parentId))
  
  immediateChildren.forEach(child => {
    const isLeft = counter % 2 !== 0
    counter++
    
    // Collect entire subtree
    const collectSubtree = (nodeId: string, targetMap: Record<string, RoadmapNode>) => {
      targetMap[nodeId] = nodes[nodeId]
      const children = Object.values(nodes).filter(n => n.parentId === nodeId)
      children.forEach(c => collectSubtree(c.id, targetMap))
    }
    
    if (isLeft) {
      collectSubtree(child.id, leftNodes)
    } else {
      collectSubtree(child.id, rightNodes)
    }
  })

  // Also catch any disconnected nodes
  Object.values(nodes).forEach(n => {
    if (!leftNodes[n.id] && !rightNodes[n.id]) {
      rightNodes[n.id] = n
    }
  })

  // Add the roots to leftNodes for context during layout, but we will ignore their calculated left position
  rootIds.forEach(id => { leftNodes[id] = nodes[id] })

  const laidOutLeft = applyDagre(leftNodes, 'RL')
  const laidOutRight = applyDagre(rightNodes, 'LR')

  const newNodes = { ...nodes }
  
  // The root position is dictated by the Right layout
  let rootX = 1000, rootY = 1000
  if (rootIds.length > 0 && laidOutRight[rootIds[0]]) {
    rootX = laidOutRight[rootIds[0]].position.x
    rootY = laidOutRight[rootIds[0]].position.y
  }

  // Adjust left layout to align with right layout's root
  let leftRootX = rootX, leftRootY = rootY
  if (rootIds.length > 0 && laidOutLeft[rootIds[0]]) {
    leftRootX = laidOutLeft[rootIds[0]].position.x
    leftRootY = laidOutLeft[rootIds[0]].position.y
  }
  
  const offsetX = rootX - leftRootX
  const offsetY = rootY - leftRootY

  Object.keys(laidOutRight).forEach(id => {
    newNodes[id] = laidOutRight[id]
  })

  Object.keys(laidOutLeft).forEach(id => {
    // Skip roots so they stay at the Right layout's center
    if (!rootIds.includes(id)) {
      newNodes[id] = {
        ...laidOutLeft[id],
        position: {
          x: laidOutLeft[id].position.x + offsetX,
          y: laidOutLeft[id].position.y + offsetY
        }
      }
    }
  })

  return newNodes
}
