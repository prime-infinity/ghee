import type { LucideIcon } from 'lucide-react';

/**
 * Complete diagram data for visualization
 */
export interface DiagramData {
  /** Visual nodes in the diagram */
  nodes: VisualNode[];
  /** Visual edges connecting the nodes */
  edges: VisualEdge[];
  /** Layout configuration for the diagram */
  layout: LayoutConfig;
}

/**
 * A visual node in the diagram
 */
export interface VisualNode {
  /** Unique identifier for the node */
  id: string;
  /** Type of visual node */
  type: 'button' | 'counter' | 'api' | 'database' | 'user' | 'component' | 'error' | 'function' | 'variable';
  /** Position of the node in the diagram */
  position: Position;
  /** Lucide React icon to display */
  icon: LucideIcon;
  /** Display label for the node */
  label: string;
  /** Simple explanation for tooltips */
  explanation: string;
  /** Additional metadata for the node */
  metadata: NodeMetadata;
  /** Visual styling properties */
  style?: NodeStyle;
}

/**
 * A visual edge connecting two nodes
 */
export interface VisualEdge {
  /** Unique identifier for the edge */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Display label for the edge */
  label: string;
  /** Type of edge determining visual style */
  type: 'success' | 'error' | 'action' | 'data-flow';
  /** Color of the edge */
  color: string;
  /** Whether the edge should be animated */
  animated?: boolean;
  /** Visual styling properties */
  style?: EdgeStyle;
}

/**
 * Position coordinates for a node
 */
export interface Position {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * Metadata for a visual node
 */
export interface NodeMetadata {
  /** Original pattern node ID this visual node represents */
  patternNodeId: string;
  /** Pattern type this node belongs to */
  patternType: string;
  /** Code location this node represents */
  codeLocation?: {
    start: number;
    end: number;
  };
  /** Additional context information */
  context?: Record<string, any>;
}

/**
 * Visual styling for nodes
 */
export interface NodeStyle {
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Text color */
  textColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Border radius */
  borderRadius?: number;
  /** Width of the node */
  width?: number;
  /** Height of the node */
  height?: number;
}

/**
 * Visual styling for edges
 */
export interface EdgeStyle {
  /** Stroke width */
  strokeWidth?: number;
  /** Stroke dash array for dashed lines */
  strokeDasharray?: string;
  /** Arrow marker style */
  markerEnd?: string;
}

/**
 * Layout configuration for the diagram
 */
export interface LayoutConfig {
  /** Direction of the layout */
  direction: 'horizontal' | 'vertical' | 'radial';
  /** Spacing between nodes */
  nodeSpacing: number;
  /** Spacing between levels */
  levelSpacing: number;
  /** Whether to auto-fit the diagram to container */
  autoFit: boolean;
  /** Padding around the diagram */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}