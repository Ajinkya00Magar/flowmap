import type { RoadmapNode, RoadmapState } from '@/types/roadmap'

export const CLIPBOARD_MIME_TYPE = 'application/json'
export const CLIPBOARD_CUSTOM_TYPE = 'FLOWMAP_CLIPBOARD'

export interface ClipboardPayload {
  type: typeof CLIPBOARD_CUSTOM_TYPE
  nodes: RoadmapNode[]
}

/**
 * Copies the specified nodes from the roadmap state into the system clipboard.
 */
export async function copyNodesToClipboard(state: RoadmapState, nodeIds: string[]): Promise<void> {
  if (!nodeIds || nodeIds.length === 0) return

  const nodesToCopy = nodeIds
    .map(id => state.nodes[id])
    .filter(Boolean) as RoadmapNode[]

  const payload: ClipboardPayload = {
    type: CLIPBOARD_CUSTOM_TYPE,
    nodes: nodesToCopy,
  }

  const text = JSON.stringify(payload)
  
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to write to clipboard:', error)
  }
}

/**
 * Reads from the system clipboard and parses the Flowmap nodes if present.
 */
export async function readNodesFromClipboard(): Promise<RoadmapNode[] | null> {
  try {
    const text = await navigator.clipboard.readText()
    if (!text) return null

    const payload = JSON.parse(text) as ClipboardPayload
    if (payload && payload.type === CLIPBOARD_CUSTOM_TYPE && Array.isArray(payload.nodes)) {
      return payload.nodes
    }
  } catch (error) {
    // Standard error if the clipboard doesn't contain valid JSON or read permission denied
    console.warn('Failed to parse clipboard data as Flowmap nodes.', error)
  }
  return null
}
