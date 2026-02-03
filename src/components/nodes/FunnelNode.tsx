"use client";

import { FunnelNodeData } from "@/lib/types";
import { Handle, Position, type NodeProps } from "reactflow";

export default function FunnelNode({ data }: NodeProps<FunnelNodeData>) {
  const border = data.hasWarning ? "2px solid #ef4444" : "1px solid #d1d5db";

  return (
    <div
      role="group"
      aria-label={`${data.title} node`}
      style={{
        width: 220,
        border,
        borderRadius: 12,
        background: "white",
        padding: 12,
        boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div aria-hidden style={{
          width: 32, height: 32, borderRadius: 8, background: "#f3f4f6",
          display: "grid", placeItems: "center", fontSize: 14
        }}>
          ⬤
        </div>
        <div style={{ fontWeight: 700 }}>{data.title}</div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            cursor: "default",
          }}
          aria-label={`${data.title} primary action`}
        >
          {data.primaryCta}
        </button>
      </div>

      {/* connection handles */}
      <Handle type="target" position={Position.Left} aria-label="Incoming connector" />
      <Handle type="source" position={Position.Right} aria-label="Outgoing connector" />
    </div>
  );
}
