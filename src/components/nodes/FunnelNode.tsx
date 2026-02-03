import React from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { FunnelNodeData } from "@/lib/types";

const handleCommon: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(17, 24, 39, 0.16)",
  borderRadius: 999,
};

function kindBadge(kind: FunnelNodeData["kind"]) {
  switch (kind) {
    case "sales":
      return "S";
    case "order":
      return "O";
    case "upsell":
      return "U";
    case "downsell":
      return "D";
    case "thankyou":
      return "T";
  }
}

export default function FunnelNode({ data, selected }: NodeProps<FunnelNodeData>) {
  return (
    <div
      role="group"
      aria-label={`${data.title} node`}
      className={`funnel-node ${selected ? "is-selected" : ""} ${
        data.hasWarning ? "has-warning" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Incoming connection handle"
        style={{
          ...handleCommon,
          width: 12,
          height: 12,
          left: -6,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        aria-label="Outgoing connection handle"
        style={{
          ...handleCommon,
          width: 12,
          height: 12,
          right: -6,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <div className="funnel-node__header">
        <div className="funnel-node__badge" aria-hidden="true">
          {kindBadge(data.kind)}
        </div>
        <div className="funnel-node__title" title={data.title}>
          {data.title}
        </div>
      </div>

      <button
  type="button"
  className="funnel-node__cta nodrag"
  aria-label={`${data.primaryCta} (preview button)`}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    // intentionally does nothing (preview)
  }}
  onMouseDown={(e) => e.stopPropagation()} // prevents node drag starting when pressing button
>
  {data.primaryCta}
</button>

    </div>
  );
}
