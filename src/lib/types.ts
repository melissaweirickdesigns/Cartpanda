import type { Edge, Node } from "reactflow";

export type NodeKind = "sales" | "order" | "upsell" | "downsell" | "thankyou";

export type FunnelNodeData = {
  kind: NodeKind;
  title: string;
  primaryCta: string;
  hasWarning?: boolean;
};

export type FunnelExport = {
  version: 1;
  nodes: Node<FunnelNodeData>[];
  edges: Edge[];
  counters: Record<NodeKind, number>;
};
