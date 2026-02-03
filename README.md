# Upsell Funnel Builder (Front-end Practical Test)

Live demo: https://cartpanda.onrender.com/ (no login)  
Repo: (https://github.com/melissaweirickdesigns/Cartpanda)

This project implements a **visual-only** upsell funnel builder: drag node types from a palette onto a canvas, move them, connect them with directional edges, and export/import the funnel state as JSON. :contentReference[oaicite:3]{index=3}

---

## Features (Part 1)

**Core (MVP)**
- Infinite-ish canvas feel (pan), draggable nodes :contentReference[oaicite:4]{index=4}  
- Node templates: Sales Page, Order Page, Upsell, Downsell, Thank You :contentReference[oaicite:5]{index=5}  
- Nodes show: title, icon/thumbnail placeholder, and a static primary button label :contentReference[oaicite:6]{index=6}  
- Add nodes by dragging from a left “Palette” sidebar :contentReference[oaicite:7]{index=7}  
- Connect nodes with arrows/edges (direction shown) :contentReference[oaicite:8]{index=8}  
- Basic funnel rules:
  - “Thank You” has **no outgoing** edges (blocked) :contentReference[oaicite:9]{index=9}  
  - “Sales Page” should have **one outgoing** edge — allow editing but show a **visual warning** if invalid :contentReference[oaicite:10]{index=10}  
  - Upsell/Downsell labels auto-increment (e.g., “Upsell 1”, “Upsell 2”) :contentReference[oaicite:11]{index=11}  
- Persistence:
  - Save/load state via `localStorage` :contentReference[oaicite:12]{index=12}  
  - Export JSON / Import JSON buttons :contentReference[oaicite:13]{index=13}  

**Nice-to-have implemented (optional)**
- <Mini-map / zoom / snap-to-grid / deletion / validation panel / undo-redo> :contentReference[oaicite:14]{index=14}  

---

## Tech Stack

- **Next.js (App Router) + React + TypeScript**
- Graph/canvas: **React Flow**
- Styling: **Tailwind CSS** (or CSS Modules)
- Lint/format: **ESLint + Prettier**

> Suggested libraries included React + TypeScript + a graph library like React Flow; styling approach is flexible. :contentReference[oaicite:15]{index=15}

---

## Getting Started (Local)

### Requirements
- Node.js >= <VERSION>
- pnpm/npm/yarn (examples use npm)

### Install
```bash
npm install
