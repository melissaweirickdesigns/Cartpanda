"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  MarkerType,
  type OnSelectionChangeParams,
} from "reactflow";
import "reactflow/dist/style.css";
import { nanoid } from "nanoid";

import Palette from "./Palette";
import FunnelNode from "./nodes/FunnelNode";
import type { FunnelExport, FunnelNodeData, NodeKind } from "@/lib/types";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/storage";
import { primaryCta, validate } from "@/lib/funnelRules";

const nodeTypes = { funnel: FunnelNode };

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: MarkerType.ArrowClosed as const },
};

function normalizeEdges(input: Edge[]): Edge[] {
  return (input ?? []).map((e) => ({
    ...e,
    type: e.type ?? defaultEdgeOptions.type,
    markerEnd: (e as any).markerEnd ?? defaultEdgeOptions.markerEnd,
  }));
}


const DEFAULT_COUNTERS: Record<NodeKind, number> = {
  sales: 0,
  order: 0,
  upsell: 0,
  downsell: 0,
  thankyou: 0,
};

const MAX_HISTORY = 50;

type Snapshot = {
  nodes: Node<FunnelNodeData>[];
  edges: Edge[];
  counters: Record<NodeKind, number>;
};

function cap<T>(arr: T[], max: number) {
  return arr.length > max ? arr.slice(arr.length - max) : arr;
}

function nextTitle(kind: NodeKind, counters: Record<NodeKind, number>) {
  const n = (counters[kind] ?? 0) + 1;
  switch (kind) {
    case "sales":
      return "Sales Page";
    case "order":
      return "Order Page";
    case "thankyou":
      return "Thank You";
    case "upsell":
      return `Upsell ${n}`;
    case "downsell":
      return `Downsell ${n}`;
  }
}

export default function FunnelBuilder() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes] = useState<Node<FunnelNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [counters, setCounters] = useState<Record<NodeKind, number>>(DEFAULT_COUNTERS);

  const [warnings, setWarnings] = useState<Map<string, string[]>>(new Map());
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  // Prevent double-drop in rare cases
  const dropLockRef = useRef(false);

  const snapshot = useCallback(
    (): Snapshot => ({ nodes, edges, counters }),
    [nodes, edges, counters]
  );

  const pushHistory = useCallback(() => {
    setPast((p) => cap([...p, snapshot()], MAX_HISTORY));
    setFuture([]);
  }, [snapshot]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];

      setFuture((f) => cap([...f, snapshot()], MAX_HISTORY));
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setCounters(prev.counters);

      return p.slice(0, -1);
    });
  }, [snapshot]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];

      setPast((p) => cap([...p, snapshot()], MAX_HISTORY));
      setNodes(next.nodes);
      setEdges(next.edges);
      setCounters(next.counters);

      return f.slice(0, -1);
    });
  }, [snapshot]);

  // Load saved state (no history entry)
  useEffect(() => {
    const saved = loadFromLocalStorage<FunnelExport>();
    if (saved?.version === 1) {
      setNodes((saved.nodes ?? []) as any);
      setEdges(normalizeEdges((saved.edges ?? []) as any));
      setCounters(saved.counters ?? DEFAULT_COUNTERS);
      setPast([]);
      setFuture([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate + persist (do NOT push history for derived warning flags)
  useEffect(() => {
    const { nextNodes, warnings: w } = validate(nodes as any, edges);

    const changed = nextNodes.some(
      (n: any, i: number) => n.data?.hasWarning !== (nodes[i] as any)?.data?.hasWarning
    );
    if (changed) setNodes(nextNodes as any);

    setWarnings(w);

    const payload: FunnelExport = { version: 1, nodes: nodes as any, edges, counters };
    if (typeof window !== "undefined") saveToLocalStorage(payload);
  }, [nodes, edges, counters]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      pushHistory();
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [pushHistory]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      pushHistory();
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [pushHistory]
  );

  const onSelectionChange = useCallback((sel: OnSelectionChangeParams) => {
    setSelectedNodeIds(sel.nodes.map((n) => n.id));
    setSelectedEdgeIds(sel.edges.map((e) => e.id));
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    pushHistory();

    setNodes((nds) => nds.filter((n) => !selectedNodeIds.includes(n.id)));
    setEdges((eds) =>
      eds
        .filter((e) => !selectedEdgeIds.includes(e.id))
        .filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target))
    );

    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [selectedNodeIds, selectedEdgeIds, pushHistory]);

  // Keyboard shortcuts: Delete + Undo/Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      // Delete/backspace
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Undo / redo
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (k === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, undo, redo]);

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;

      const sourceNode = nodes.find((n) => n.id === conn.source);
      if (sourceNode?.data?.kind === "thankyou") return; // only block Thank You

      pushHistory();

      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            id: nanoid(),
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [nodes, pushHistory]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // rare extra guard against double-drop
      if (dropLockRef.current) return;
      dropLockRef.current = true;
      setTimeout(() => {
        dropLockRef.current = false;
      }, 250);

      const kind = e.dataTransfer.getData("application/funnel-node") as NodeKind;
      if (!kind || !rf || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;

      const pos =
        (rf as any).screenToFlowPosition?.({ x, y }) ??
        (rf as any).project?.({ x, y }) ??
        { x, y };

      pushHistory();

      const nextCount = (counters[kind] ?? 0) + 1;

      const data: FunnelNodeData = {
        kind,
        title: nextTitle(kind, counters),
        primaryCta: primaryCta(kind),
        hasWarning: false,
      };

      const newNode: Node<FunnelNodeData> = {
        id: nanoid(),
        type: "funnel",
        position: pos,
        data,
      };

      setNodes((nds) => nds.concat(newNode));
      setCounters((prev) => ({ ...prev, [kind]: nextCount }));
},
    [rf, pushHistory, counters]
  );

  const exportJson = useCallback(() => {
    const payload: FunnelExport = { version: 1, nodes: nodes as any, edges, counters };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funnel.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, counters]);

  const importJson = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as FunnelExport;
        if (parsed?.version !== 1) return;

        pushHistory();

        setNodes((parsed.nodes ?? []) as any);
        setEdges(normalizeEdges((parsed.edges ?? []) as any));
        setCounters(parsed.counters ?? DEFAULT_COUNTERS);
      } catch {
        // ignore invalid json
      }
    };
    input.click();
  }, [pushHistory]);

  const warningList = useMemo(() => {
    const items: { id: string; msg: string }[] = [];
    for (const [id, msgs] of warnings.entries()) {
      for (const msg of msgs) items.push({ id, msg });
    }
    return items;
  }, [warnings]);

  const nothingSelected = selectedNodeIds.length === 0 && selectedEdgeIds.length === 0;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <Palette />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <div>
            <div style={{ fontWeight: 800 }}>Upsell Funnel Builder</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Drag nodes, connect with arrows. Funnel persists locally.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={undo}
              disabled={past.length === 0}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                opacity: past.length === 0 ? 0.5 : 1,
              }}
              title={past.length === 0 ? "Nothing to undo" : "Undo (Ctrl/Cmd+Z)"}
            >
              Undo
            </button>

            <button
              onClick={redo}
              disabled={future.length === 0}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                opacity: future.length === 0 ? 0.5 : 1,
              }}
              title={future.length === 0 ? "Nothing to redo" : "Redo (Ctrl/Cmd+Shift+Z)"}
            >
              Redo
            </button>

            <button
              onClick={deleteSelected}
              disabled={nothingSelected}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                opacity: nothingSelected ? 0.5 : 1,
              }}
              title={nothingSelected ? "Select a node/edge to delete" : "Delete selected"}
            >
              Delete
            </button>

            <button
              onClick={importJson}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
              }}
            >
              Import JSON
            </button>

            <button
              onClick={exportJson}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#111827",
                color: "white",
              }}
            >
              Export JSON
            </button>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* ✅ Drop handlers moved HERE to prevent duplicate drops */}
          <div ref={wrapperRef} style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              onInit={setRf}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              fitView
              panOnScroll
              selectNodesOnDrag
              snapToGrid
              snapGrid={[16, 16]}
            >
              <Background gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          <aside style={{ width: 320, borderLeft: "1px solid #e5e7eb", padding: 12 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Validation</h3>
            {warningList.length === 0 ? (
              <div style={{ fontSize: 13, color: "#16a34a" }}>All good.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#b91c1c" }}>
                {warningList.map((w, idx) => (
                  <li key={`${w.id}-${idx}`}>{w.msg}</li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: 14, fontSize: 12, color: "#6b7280" }}>
              Tips:
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                <li>
                  Press <b>Delete</b> / <b>Backspace</b> to remove selected nodes/edges.
                </li>
                <li>
                  <b>Undo</b>: Ctrl/Cmd+Z · <b>Redo</b>: Ctrl/Cmd+Shift+Z
                </li>
                <li>Edges from Thank You are blocked.</li>
                <li>Sales Page warns if outgoing edges ≠ 1.</li>
                <li>Snap-to-grid is enabled.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
