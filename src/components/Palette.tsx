"use client";

import { NodeKind } from "../../lib/types";

const ITEMS: { kind: NodeKind; label: string }[] = [
  { kind: "sales", label: "Sales Page" },
  { kind: "order", label: "Order Page" },
  { kind: "upsell", label: "Upsell" },
  { kind: "downsell", label: "Downsell" },
  { kind: "thankyou", label: "Thank You" },
];

export default function Palette() {
  return (
    <aside style={{ width: 240, borderRight: "1px solid #e5e7eb", padding: 12 }}>
      <h2 style={{ fontWeight: 800, marginBottom: 10 }}>Palette</h2>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
        Drag a node type onto the canvas.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {ITEMS.map(item => (
          <div
            key={item.kind}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/funnel-node", item.kind);
              e.dataTransfer.effectAllowed = "move";
            }}
            role="button"
            tabIndex={0}
            aria-label={`Drag ${item.label}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 10,
              background: "white",
              cursor: "grab",
              userSelect: "none",
            }}
          >
            <div style={{ fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Drag to canvas</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
