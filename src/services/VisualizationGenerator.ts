import type { 
  RecognizedPattern, 
  PatternNode, 
  PatternConnection 
} from '../types/patterns';
import type { 
  DiagramData, 
  VisualNode, 
  VisualEdge, 
  Position, 
  NodeMetadata, 
  LayoutConfig 
} from '../types/visualization';
import { 
  MousePointer, 
  Hash, 
  Globe, 
  Database, 
  User, 
  Component, 
  AlertTriangle, 
  Variable,
  Code
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Icon mapping for different pattern node types
 */
const ICON_MAP: Record<PatternNode['type'], LucideIcon> = {
  button: MousePointer,
  counter: Hash,
  api: Globe,
  database: Database,
  user: User,
  component: Component,
  error: AlertTriangle,
  function: Code,
  variable: Variable
};

/**
 * Color mapping for different edge types
 */
const EDGE_COLOR_MAP: Record<VisualEdge['type'], string> = {
  success: '#10b981', // green-500
  error: '#ef4444',   // red-500
  action: '#3b82f6',  // blue-500
  'data-flow': '#8b5cf6' // purple-500
};

/**
 * Simple explanations for different node types
 */
const NODE_EXPLANATIONS: Record<PatternNode['type'], string> = {
  button: 'A clickable button that users can press',
  counter: 'A number that keeps track of something',
  api: 'Connects to the internet to get or send information',
  database: 'A place where information is stored',
  user: 'A person using the application',
  component: 'A piece of the user interface',
  error: 'Something that can go wrong',
  function: 'A set of instructions that does something',
  variable: 'A container that holds information'
};

/**
 * Service for generating visual diagrams from recognized code patterns
 */
export class VisualizationGenerator {
  private readonly nodeSpacing = 150;
  private readonly levelSpacing = 200;
  private readonly defaultNodeSize = { width: 120, height: 80 };

  /**
   * Generate a complete diagram from recognized patterns
   * @param patterns - Array of recognized code patterns
   * @returns Complete diagram data for visualization
   */
  generateDiagram(patterns: RecognizedPattern[]): DiagramData {
    if (patterns.length === 0) {
      return this.createEmptyDiagram();
    }

    // Convert patterns to visual nodes and edges
    const { nodes, edges } = this.convertPatternsToVisualElements(patterns);
    
    // Apply positioning algorithm
    const positionedNodes = this.applyNodePositioning(nodes, edges);
    
    // Create layout configuration
    const layout = this.createLayoutConfig(positionedNodes);

    return {
      nodes: positionedNodes,
      edges,
      layout
    };
  }

  /**
   * Convert recognized patterns to visual nodes and edges
   * @param patterns - Array of recognized patterns
   * @returns Object containing visual nodes and edges
   */
  private convertPatternsToVisualElements(
    patterns: RecognizedPattern[]
  ): { nodes: VisualNode[]; edges: VisualEdge[] } {
    const nodes: VisualNode[] = [];
    const edges: VisualEdge[] = [];
    const nodeIdMap = new Map<string, string>(); // Pattern node ID -> Visual node ID

    // Convert pattern nodes to visual nodes
    patterns.forEach((pattern, patternIndex) => {
      pattern.nodes.forEach((patternNode, nodeIndex) => {
        const visualNodeId = `visual-${patternIndex}-${nodeIndex}`;
        nodeIdMap.set(patternNode.id, visualNodeId);
        
        const visualNode = this.createVisualNode(
          visualNodeId,
          patternNode,
          pattern,
          { x: 0, y: 0 } // Position will be calculated later
        );
        
        nodes.push(visualNode);
      });
    });

    // Convert pattern connections to visual edges
    patterns.forEach((pattern, patternIndex) => {
      pattern.connections.forEach((connection, connectionIndex) => {
        const sourceVisualId = nodeIdMap.get(connection.sourceId);
        const targetVisualId = nodeIdMap.get(connection.targetId);
        
        if (sourceVisualId && targetVisualId) {
          const visualEdge = this.createVisualEdge(
            `edge-${patternIndex}-${connectionIndex}`,
            sourceVisualId,
            targetVisualId,
            connection,
            pattern
          );
          
          edges.push(visualEdge);
        }
      });
    });

    return { nodes, edges };
  }

  /**
   * Create a visual node from a pattern node
   * @param id - Unique ID for the visual node
   * @param patternNode - Source pattern node
   * @param pattern - Parent pattern
   * @param position - Initial position
   * @returns Visual node
   */
  private createVisualNode(
    id: string,
    patternNode: PatternNode,
    pattern: RecognizedPattern,
    position: Position
  ): VisualNode {
    // Map pattern node type to visual node type based on pattern context
    const visualNodeType = this.mapPatternNodeToVisualType(patternNode, pattern);
    const icon = ICON_MAP[visualNodeType] || Component;
    const explanation = NODE_EXPLANATIONS[visualNodeType] || 'A part of the code';
    
    const metadata: NodeMetadata = {
      patternNodeId: patternNode.id,
      patternType: pattern.type,
      codeLocation: {
        start: patternNode.codeLocation.start,
        end: patternNode.codeLocation.end
      },
      context: {
        ...patternNode.properties,
        patternConfidence: pattern.metadata.confidence,
        complexity: pattern.metadata.complexity
      }
    };

    return {
      id,
      type: visualNodeType,
      position,
      icon,
      label: patternNode.label,
      explanation,
      metadata,
      style: this.getNodeStyle(visualNodeType, pattern.type)
    };
  }

  /**
   * Map pattern node type to visual node type based on pattern context
   * @param patternNode - Source pattern node
   * @param pattern - Parent pattern
   * @returns Visual node type
   */
  private mapPatternNodeToVisualType(
    patternNode: PatternNode,
    pattern: RecognizedPattern
  ): VisualNode['type'] {
    // If the pattern node already has a specific type, use it
    if (['button', 'counter', 'api', 'database', 'user', 'error'].includes(patternNode.type)) {
      return patternNode.type as VisualNode['type'];
    }

    // Map based on pattern type and node context
    switch (pattern.type) {
      case 'counter':
        return this.mapCounterPatternNode(patternNode, pattern);
      case 'api-call':
        return this.mapApiCallPatternNode(patternNode, pattern);
      case 'database':
        return this.mapDatabasePatternNode(patternNode, pattern);
      case 'error-handling':
        return this.mapErrorHandlingPatternNode(patternNode, pattern);
      case 'component-lifecycle':
        return this.mapComponentLifecyclePatternNode(patternNode, pattern);
      default:
        // Fallback to generic mapping
        return this.mapGenericPatternNode(patternNode);
    }
  }

  /**
   * Map counter pattern nodes to visual types
   */
  private mapCounterPatternNode(
    patternNode: PatternNode,
    _pattern: RecognizedPattern
  ): VisualNode['type'] {
    const label = patternNode.label.toLowerCase();
    const properties = patternNode.properties;

    // Check if this is a click handler or button-related
    if (label.includes('click') || label.includes('handle') || label.includes('button') ||
        properties.isClickHandler || properties.hasOnClick) {
      return 'button';
    }

    // Check if this is a counter state variable
    if (label.includes('count') || label.includes('num') || label.includes('value') ||
        properties.isNumericState || properties.isCounterVariable) {
      return 'counter';
    }

    // Check if this is a function that modifies state
    if (patternNode.type === 'function' && 
        (label.includes('increment') || label.includes('decrement') || 
         label.includes('add') || label.includes('subtract'))) {
      return 'button';
    }

    // Default for counter pattern
    return patternNode.type === 'variable' ? 'counter' : 'component';
  }

  /**
   * Map API call pattern nodes to visual types
   */
  private mapApiCallPatternNode(
    patternNode: PatternNode,
    _pattern: RecognizedPattern
  ): VisualNode['type'] {
    const label = patternNode.label.toLowerCase();
    const properties = patternNode.properties;

    // Check if this is an API call
    if (label.includes('fetch') || label.includes('api') || label.includes('request') ||
        label.includes('http') || label.includes('axios') ||
        properties.isApiCall || properties.endpoint) {
      return 'api';
    }

    // Check if this is user-related
    if (label.includes('user') || properties.isUserAction) {
      return 'user';
    }

    // Check if this is error handling
    if (label.includes('error') || label.includes('catch') || 
        properties.isErrorHandler) {
      return 'error';
    }

    // Default for API pattern
    return 'api';
  }

  /**
   * Map database pattern nodes to visual types
   */
  private mapDatabasePatternNode(
    patternNode: PatternNode,
    _pattern: RecognizedPattern
  ): VisualNode['type'] {
    const label = patternNode.label.toLowerCase();
    const properties = patternNode.properties;

    // Check if this is a database operation
    if (label.includes('db') || label.includes('database') || label.includes('query') ||
        label.includes('select') || label.includes('insert') || label.includes('update') ||
        label.includes('delete') || properties.isDatabaseOperation) {
      return 'database';
    }

    // Default for database pattern
    return 'database';
  }

  /**
   * Map error handling pattern nodes to visual types
   */
  private mapErrorHandlingPatternNode(
    patternNode: PatternNode,
    _pattern: RecognizedPattern
  ): VisualNode['type'] {
    const label = patternNode.label.toLowerCase();

    if (label.includes('error') || label.includes('catch') || label.includes('throw')) {
      return 'error';
    }

    return 'component';
  }

  /**
   * Map component lifecycle pattern nodes to visual types
   */
  private mapComponentLifecyclePatternNode(
    _patternNode: PatternNode,
    _pattern: RecognizedPattern
  ): VisualNode['type'] {
    return 'component';
  }

  /**
   * Map generic pattern nodes to visual types
   */
  private mapGenericPatternNode(patternNode: PatternNode): VisualNode['type'] {
    // Use the original type if it's already a valid visual type
    if (['button', 'counter', 'api', 'database', 'user', 'component', 'error', 'function', 'variable'].includes(patternNode.type)) {
      return patternNode.type as VisualNode['type'];
    }

    // Default fallback
    return 'component';
  }

  /**
   * Create a visual edge from a pattern connection
   * @param id - Unique ID for the visual edge
   * @param sourceId - Source visual node ID
   * @param targetId - Target visual node ID
   * @param connection - Source pattern connection
   * @param pattern - Parent pattern
   * @returns Visual edge
   */
  private createVisualEdge(
    id: string,
    sourceId: string,
    targetId: string,
    connection: PatternConnection,
    pattern: RecognizedPattern
  ): VisualEdge {
    const edgeType = this.mapConnectionTypeToEdgeType(connection.type);
    const color = EDGE_COLOR_MAP[edgeType];
    const animated = edgeType === 'action' || edgeType === 'data-flow';

    return {
      id,
      source: sourceId,
      target: targetId,
      label: connection.label,
      type: edgeType,
      color,
      animated,
      style: this.getEdgeStyle(edgeType, pattern.type)
    };
  }

  /**
   * Map pattern connection type to visual edge type
   * @param connectionType - Pattern connection type
   * @returns Visual edge type
   */
  private mapConnectionTypeToEdgeType(
    connectionType: PatternConnection['type']
  ): VisualEdge['type'] {
    switch (connectionType) {
      case 'error-path':
        return 'error';
      case 'success-path':
        return 'success';
      case 'event':
        return 'action';
      case 'data-flow':
      case 'control-flow':
      default:
        return 'data-flow';
    }
  }

  /**
   * Apply positioning algorithm to nodes
   * @param nodes - Visual nodes to position
   * @param edges - Visual edges for layout reference
   * @returns Nodes with calculated positions
   */
  private applyNodePositioning(
    nodes: VisualNode[],
    edges: VisualEdge[]
  ): VisualNode[] {
    if (nodes.length === 0) return nodes;
    if (nodes.length === 1) {
      return [{ ...nodes[0], position: { x: 0, y: 0 } }];
    }

    // Build adjacency list for layout calculation
    const adjacencyList = this.buildAdjacencyList(nodes, edges);
    
    // Use a simple layered layout algorithm
    const layers = this.calculateLayers(nodes, adjacencyList);
    
    // Position nodes within layers
    return this.positionNodesInLayers(nodes, layers);
  }

  /**
   * Build adjacency list from nodes and edges
   * @param nodes - Visual nodes
   * @param edges - Visual edges
   * @returns Adjacency list mapping node IDs to connected node IDs
   */
  private buildAdjacencyList(
    nodes: VisualNode[],
    edges: VisualEdge[]
  ): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();
    
    // Initialize with all nodes
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });
    
    // Add edges
    edges.forEach(edge => {
      const sourceConnections = adjacencyList.get(edge.source) || [];
      sourceConnections.push(edge.target);
      adjacencyList.set(edge.source, sourceConnections);
    });
    
    return adjacencyList;
  }

  /**
   * Calculate layers for hierarchical layout
   * @param nodes - Visual nodes
   * @param adjacencyList - Node connections
   * @returns Map of node ID to layer number
   */
  private calculateLayers(
    nodes: VisualNode[],
    adjacencyList: Map<string, string[]>
  ): Map<string, number> {
    const layers = new Map<string, number>();
    const visited = new Set<string>();
    
    // Find root nodes (nodes with no incoming edges)
    const incomingEdges = new Set<string>();
    adjacencyList.forEach(connections => {
      connections.forEach(target => incomingEdges.add(target));
    });
    
    const rootNodes = nodes.filter(node => !incomingEdges.has(node.id));
    
    // If no clear root nodes, use the first node
    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes.push(nodes[0]);
    }
    
    // BFS to assign layers
    const queue: Array<{ nodeId: string; layer: number }> = [];
    
    rootNodes.forEach(node => {
      queue.push({ nodeId: node.id, layer: 0 });
      layers.set(node.id, 0);
      visited.add(node.id);
    });
    
    while (queue.length > 0) {
      const { nodeId, layer } = queue.shift()!;
      const connections = adjacencyList.get(nodeId) || [];
      
      connections.forEach(targetId => {
        if (!visited.has(targetId)) {
          const targetLayer = layer + 1;
          layers.set(targetId, targetLayer);
          visited.add(targetId);
          queue.push({ nodeId: targetId, layer: targetLayer });
        }
      });
    }
    
    // Handle any unvisited nodes
    nodes.forEach(node => {
      if (!layers.has(node.id)) {
        layers.set(node.id, 0);
      }
    });
    
    return layers;
  }

  /**
   * Position nodes within their calculated layers
   * @param nodes - Visual nodes
   * @param layers - Layer assignments for each node
   * @returns Nodes with calculated positions
   */
  private positionNodesInLayers(
    nodes: VisualNode[],
    layers: Map<string, number>
  ): VisualNode[] {
    // Group nodes by layer
    const layerGroups = new Map<number, VisualNode[]>();
    
    nodes.forEach(node => {
      const layer = layers.get(node.id) || 0;
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, []);
      }
      layerGroups.get(layer)!.push(node);
    });
    
    // Position nodes
    const positionedNodes: VisualNode[] = [];
    
    layerGroups.forEach((layerNodes, layerIndex) => {
      const layerY = layerIndex * this.levelSpacing;
      
      layerNodes.forEach((node, nodeIndex) => {
        const totalNodesInLayer = layerNodes.length;
        const startX = -(totalNodesInLayer - 1) * this.nodeSpacing / 2;
        const nodeX = startX + nodeIndex * this.nodeSpacing;
        
        positionedNodes.push({
          ...node,
          position: { x: nodeX, y: layerY }
        });
      });
    });
    
    return positionedNodes;
  }

  /**
   * Get visual styling for a node based on its type and pattern
   * @param nodeType - Type of the node
   * @param patternType - Type of the parent pattern
   * @returns Node styling
   */
  private getNodeStyle(
    nodeType: PatternNode['type'],
    _patternType: RecognizedPattern['type']
  ) {
    const baseStyle = {
      width: this.defaultNodeSize.width,
      height: this.defaultNodeSize.height,
      borderRadius: 8,
      borderWidth: 2
    };

    // Color scheme based on node type
    switch (nodeType) {
      case 'button':
        return {
          ...baseStyle,
          backgroundColor: '#dbeafe', // blue-100
          borderColor: '#3b82f6',     // blue-500
          textColor: '#1e40af'        // blue-800
        };
      case 'counter':
        return {
          ...baseStyle,
          backgroundColor: '#dcfce7', // green-100
          borderColor: '#10b981',     // green-500
          textColor: '#065f46'        // green-800
        };
      case 'api':
        return {
          ...baseStyle,
          backgroundColor: '#fef3c7', // yellow-100
          borderColor: '#f59e0b',     // yellow-500
          textColor: '#92400e'        // yellow-800
        };
      case 'database':
        return {
          ...baseStyle,
          backgroundColor: '#e0e7ff', // indigo-100
          borderColor: '#6366f1',     // indigo-500
          textColor: '#3730a3'        // indigo-800
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#fee2e2', // red-100
          borderColor: '#ef4444',     // red-500
          textColor: '#991b1b'        // red-800
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#f3f4f6', // gray-100
          borderColor: '#6b7280',     // gray-500
          textColor: '#374151'        // gray-700
        };
    }
  }

  /**
   * Get visual styling for an edge based on its type and pattern
   * @param edgeType - Type of the edge
   * @param patternType - Type of the parent pattern
   * @returns Edge styling
   */
  private getEdgeStyle(
    edgeType: VisualEdge['type'],
    _patternType: RecognizedPattern['type']
  ) {
    const baseStyle = {
      strokeWidth: 2,
      markerEnd: 'url(#arrowhead)'
    };

    switch (edgeType) {
      case 'error':
        return {
          ...baseStyle,
          strokeWidth: 3,
          strokeDasharray: '5,5'
        };
      case 'success':
        return {
          ...baseStyle,
          strokeWidth: 3
        };
      case 'action':
        return {
          ...baseStyle,
          strokeWidth: 2
        };
      default:
        return baseStyle;
    }
  }

  /**
   * Create layout configuration for the diagram
   * @param nodes - Positioned visual nodes
   * @returns Layout configuration
   */
  private createLayoutConfig(_nodes: VisualNode[]): LayoutConfig {
    return {
      direction: 'vertical',
      nodeSpacing: this.nodeSpacing,
      levelSpacing: this.levelSpacing,
      autoFit: true,
      padding: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      }
    };
  }

  /**
   * Create an empty diagram for when no patterns are found
   * @returns Empty diagram data
   */
  private createEmptyDiagram(): DiagramData {
    return {
      nodes: [],
      edges: [],
      layout: {
        direction: 'vertical',
        nodeSpacing: this.nodeSpacing,
        levelSpacing: this.levelSpacing,
        autoFit: true,
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      }
    };
  }
}