import type { Edge, Node } from "reactflow";
import type { FunnelNodeData, NodeKind } from "./types";

export function isThankYou(node?: Node<FunnelNodeData>) {
  return node?.data?.kind === "thankyou";
}

export function outgoingCount(edges: Edge[], nodeId: string) {
  return edges.filter((e) => e.source === nodeId).length;
}

export function validate(nodes: Node<FunnelNodeData>[], edges: Edge[]) {
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
  const warnings = new Map<string, string[]>();

  // Thank You has no outgoing edges
  for (const n of nodes) {
    if (n.data.kind === "thankyou" && outgoingCount(edges, n.id) > 0) {
      warnings.set(n.id, ["Thank You cannot have outgoing connections."]);
    }
  }

  // Sales Page should have exactly one outgoing edge (warn, don't block)
  for (const n of nodes) {
    if (n.data.kind === "sales") {
      const c = outgoingCount(edges, n.id);
      if (c !== 1) {
        warnings.set(n.id, [
          `Sales Page should have 1 outgoing edge (currently ${c}).`,
        ]);
      }
    }
  }

  // Orphan nodes (bonus)
  for (const n of nodes) {
    const inCount = edges.filter((e) => e.target === n.id).length;
    const outCount = outgoingCount(edges, n.id);
    if (inCount === 0 && outCount === 0) {
      warnings.set(n.id, [
        ...(warnings.get(n.id) ?? []),
        "Orphan node (no connections).",
      ]);
    }
  }

  // mark node.data.hasWarning (keeps Node<FunnelNodeData> typing)
  const nextNodes: Node<FunnelNodeData>[] = nodes.map((n) => {
    const msgs = warnings.get(n.id);
    return {
      ...n,
      data: { ...n.data, hasWarning: !!msgs },
    };
  });

  // edge-level blocking: prevent creating edges from Thank You
  function canConnect(sourceId: string) {
    const src = nodeById.get(sourceId);
    return src ? !isThankYou(src) : true;
  }

  return { nextNodes, warnings, canConnect };
}

export function primaryCta(kind: NodeKind) {
  switch (kind) {
    case "sales":
      return "Go to checkout";
    case "order":
      return "Complete order";
    case "upsell":
      return "Accept upsell";
    case "downsell":
      return "Accept offer";
    case "thankyou":
      return "Done";
  }
}
