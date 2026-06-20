# Implementation Plan & Current Status

This document records requested work, detailed subtasks, and what is already implemented in the repository. Use this as context for the AI model rollback and for the team.

---

## Things to implement

1) Fix UI & canvas not working properly
   - Reproduce and collect console errors and failing interactions.
   - Verify `useCanvas` hook, `containerRef`, and transform logic (pan/zoom/fit/reset).
   - Check CSS / z-index / pointer-events for overlays (controls, FAB, modals).
   - Ensure event handling doesn't block clicks/double-clicks on canvas.

2) Inside canvas: add full manual creation & editing features
   - Add node creation flows: double-click canvas (already present), FAB, context-menu.
   - Add explicit "draw connection / link" interaction to connect two arbitrary nodes (reparent or create non-hierarchical link).
   - Add UI for creating a free-floating node (no parent) at pointer position.
   - Add keyboard shortcuts for create/delete/duplicate (grab existing patterns from node UI).
   - Provide a focused quick-create input (title + color) for rapid node creation.

3) Make roadmap / flowmaps fully customizable
   - Support multi-line titles and rich descriptions (notes already exist) and allow longer text in-node display or expand-on-click.
   - Add fields and annotations: info, comments, markings (labels/tags), attachments, resources (resources panel exists), priority/status (exists), deadlines (exists).
   - Allow customizing node templates (size, shape, fields) and per-node visibility of fields.
   - Styling options: color tags, custom icons, font sizes, compact/expanded node modes.

4) Team workflows & collaboration features
   - Create / delete / assign tasks on canvas, mark complete/incomplete (toggle exists), progress tracking.
   - Access control & sharing (workspace + roadmap permissions) and optional real-time collaboration (websocket or CRDT) for multi-user updates.
   - Activity history, comments, and simple notifications.

---

## Implemented (observed in repository)

- Canvas and node rendering
  - `frontend/components/canvas/FloatingCanvas.tsx` — main canvas surface, pan/zoom, double-click to add node, context menu, node selection, mini-map jump, fit-to-screen and grid toggle.
  - `frontend/components/canvas/RoadmapNode.tsx` — node UI: drag-to-move, click select, hover actions, add child / duplicate / delete, toggle complete, progress ring and visual styles.
  - `frontend/components/canvas/ConnectionLines.tsx` — connection rendering (lines between parent → child based on state).
  - `frontend/components/canvas/CanvasControls.tsx` — zoom, fit, reset, grid toggle controls.

- Node creation / editing
  - `frontend/components/ui/FloatingActionButton.tsx` — FAB to add category or add child to selected node.
  - `frontend/lib/roadmapUtils.ts` — `createNode`, `addNodeToState`, `deleteNodeFromState`, `moveNodeInState`, `duplicateNodeInState`, `toggleCompleteInState`, `getVisibleConnections`, `snapToGrid`, and JSON import/export helpers.
  - `frontend/components/panels/NodeEditorPanel.tsx` + `NodeEditorFields.tsx` — full node editor UI: title, description, notes, progress slider, status, priority, deadline, estimated hours, color picker, sub-tasks, resources list.

- State management & persistence
  - `frontend/components/providers/RoadmapProvider.tsx` — reducer actions wired: `ADD_NODE`, `DELETE_NODE`, `MOVE_NODE`, `TOGGLE_COMPLETE`, `UPDATE_PROGRESS`, `IMPORT_STATE`, persistence to Supabase, workspace/roadmap CRUD operations, create default roadmap.
  - `frontend/hooks/useHistory.ts` — undo/redo stack helper (history utilities present).

- Utilities & supporting features
  - `frontend/lib/progressUtils.ts` — progress calculations and formatting helpers.
  - `frontend/components/ui/MiniMap.tsx` — minimap rendering.
  - `frontend/components/canvas/ContextMenu.tsx` — right-click menu for nodes (add child, duplicate, delete, toggle complete, etc.).
  - `frontend/components/settings/SettingsView.tsx` — import/export/reset and some roadmap stats and options.

Notes: Many of the manual creation and editing flows are implemented already (double-click add, FAB add, add child, context menu, duplicate, delete, mark complete, node editor fields). However some desirable interactions are not present or incomplete (for example, drag-to-connect between arbitrary nodes, collaborative real-time sync, richer inline node comment threads, or visual editing of connections via direct-drag).

---

## Suggested immediate next steps

1. Reproduce the reported UI/canvas issues: open the app, capture console logs, and note the exact failing interactions (e.g., double-click ignored, nodes not draggable, controls unresponsive).
2. If canvas gestures are broken, inspect `useCanvas` and `containerRef` wiring in `FloatingCanvas.tsx` and `hooks/useCanvas.ts` (verify pointer events and event listeners). Check overlay z-index and CSS classes that might intercept events.
3. Add missing manual interactions prioritized as: draw-connection between nodes → quick-create input → keyboard shortcuts → collaborative sync.
4. Create focused issues / PRs for each subtask with small, testable changes. Example PRs:
   - Fix canvas event handling (small patch)
   - Add "drag-to-connect" interaction
   - Add quick-create input & keyboard shortcuts
   - Add basic sharing metadata + comments schema

---

If you want, I can (pick one):
- run the app locally and reproduce the UI issue, or
- open `hooks/useCanvas.ts` and `components/canvas/ConnectionLines.tsx` and propose targeted code fixes, or
- scaffold the "drag-to-connect" interaction and a small UI prototype.

Last update: 2026-06-20
