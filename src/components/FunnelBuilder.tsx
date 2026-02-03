"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { nanoid } from "nanoid";

import Palette from "./Palette";
import FunnelNode from "./nodes/FunnelNode";
import { FunnelExport, FunnelNodeData, NodeKind } from "@/lib/types";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/storage";
import { primaryCta, validate } from "@/lib/funnelRules";



const nodeTypes = { funnel: FunnelNode };

const DEFAULT_COUNTERS: Record<NodeKind, number> = {
  sales: 0, order: 0, upsell: 0, downsell: 0, thankyou: 0,
};

function nextTitle(kind: NodeKind, counters: Record<NodeKind, number>) {
  const n = counters[kind] + 1;
  switch (kind) {
    case "sales": return "Sales Page";
    case "order": return "Order Page";
    case "thankyou": return "Thank You";
    case "upsell": return `Upsell ${n}`;
    case "downsell": return `Downsell ${n}`;
  }
}

export default function FunnelBuilder() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  const [counters, setCounters] = useState<Record<NodeKind, number>>(DEFAULT_COUNTERS);
const [nodes, setNodes, onNodesChange] = useNodesState<Node<FunnelNodeData>>([]);
const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [warnings, setWarnings] = useState<Map<string, string[]>>(new Map());

  // Load saved state
  useEffect(() => {
    const saved = loadFromLocalStorage<FunnelExport>();
    if (saved?.version === 1) {
      setNodes(saved.nodes);
      setEdges(saved.edges);
      setCounters(saved.counters ?? DEFAULT_COUNTERS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate + persist
  useEffect(() => {
    const { nextNodes, warnings: w } = validate(nodes, edges);
    // avoid infinite loops: only update if warning flags differ
    const changed = nextNodes.some((n, i) => n.data.hasWarning !== nodes[i]?.data.hasWarning);
    if (changed) setNodes(nextNodes);
    setWarnings(w);

    const payload: FunnelExport = { version: 1, nodes, edges, counters };
    if (typeof window !== "undefined") saveToLocalStorage(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, counters]);

  const onConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target) return;

    const { canConnect } = validate(nodes, edges);
    if (!canConnect(conn.source)) return; // block edges from Thank You

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
  }, [nodes, edges, setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/funnel-node") as NodeKind;
    if (!kind || !rf || !wrapperRef.current) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = rf.project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });

    setCounters(prev => {
      const next = { ...prev };
      next[kind] = (next[kind] ?? 0) + 1;

      const data: FunnelNodeData = {
        kind,
        title: nextTitle(kind, prev),
        primaryCta: primaryCta(kind),
      };

      const newNode: Node<FunnelNodeData> = {
        id: nanoid(),
        type: "funnel",
        position,
        data,
      };

      setNodes(nds => nds.concat(newNode));
      return next;
    });
  }, [rf, setNodes]);

  const exportJson = useCallback(() => {
    const payload: FunnelExport = { version: 1, nodes, edges, counters };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funnel.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, counters]);

  const importJson = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text) as FunnelExport;
      if (parsed?.version !== 1) return;
      setNodes(parsed.nodes ?? []);
      setEdges(parsed.edges ?? []);
      setCounters(parsed.counters ?? DEFAULT_COUNTERS);
    };
    input.click();
  }, [setNodes, setEdges]);

  const warningList = useMemo(() => {
    const items: { id: string; msg: string }[] = [];
    for (const [id, msgs] of warnings.entries()) for (const msg of msgs) items.push({ id, msg });
    return items;
  }, [warnings]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <Palette />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", borderBottom: "1px solid #e5e7eb"
        }}>
          <div>
            <div style={{ fontWeight: 800 }}>Upsell Funnel Builder</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Drag nodes, connect with arrows. Funnel persists locally.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={importJson} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              Import JSON
            </button>
            <button onClick={exportJson} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#111827", color: "white" }}>
              Export JSON
            </button>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div ref={wrapperRef} style={{ flex: 1 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={setRf}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
              panOnScroll
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
              Notes:
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                <li>Edges from Thank You are blocked.</li>
                <li>Sales Page edge count shows warning if not exactly 1.</li>
                <li>Upsell/Downsell labels auto-increment.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
