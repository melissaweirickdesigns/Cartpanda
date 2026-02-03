# Upsell Funnel Builder

A **visual-only** upsell funnel builder built with **Next.js (App Router)** + **React Flow**.

- Drag node types from the left **Palette** onto the canvas
- Move nodes, connect them with **directional edges**
- Funnel state **persists to localStorage**
- **Export** / **Import** the funnel as JSON

## Live Demo / Repo

- Live demo: https://cartpanda.onrender.com/
- Repo: https://github.com/melissaweirickdesigns/Cartpanda

## Features

### Core interactions

- **Drag & drop node creation** from the Palette (Sales, Order, Upsell, Downsell, Thank You)
- **Draggable nodes** on a pannable canvas (pan on scroll)
- **Connect nodes** with directional arrows (smoothstep edges + arrow marker)
- **Selection + deletion**
  - Click to select nodes/edges
  - Press **Delete** / **Backspace** to remove selected nodes/edges
- **Undo / Redo**
  - **Undo:** Ctrl/Cmd + Z
  - **Redo:** Ctrl/Cmd + Shift + Z

### Validation rules

Validation is intentionally *visual* (warnings) except for one hard rule:

- **Thank You** nodes: **no outgoing edges** (blocked at connection time)
- **Sales Page** nodes: should have **exactly 1 outgoing** edge (warning if not)
- **Orphan nodes** (no incoming + no outgoing): warning (bonus)

Warnings show in two places:

- A **red outline** on the node
- A **Validation** panel on the right listing the messages

### Persistence + import/export

- Auto-saves to `localStorage` under the key `cp_funnel_builder_v1`
- **Export JSON** downloads a `funnel.json` file
- **Import JSON** loads a previously exported file

The exported shape is versioned:

```ts
type FunnelExport = {
  version: 1;
  nodes: Node<FunnelNodeData>[];
  edges: Edge[];
  counters: Record<NodeKind, number>;
};
