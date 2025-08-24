import React, { useCallback, useMemo, useState, memo } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  MarkerType,
} from "reactflow";
import type {
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import type {
  DiagramData,
  VisualNode,
  VisualEdge,
} from "../types/visualization";
import { CustomNode } from "./diagram/CustomNode";
import { CustomEdge } from "./diagram/CustomEdge";
import { NodeDetailsModal } from "./diagram/NodeDetailsModal";
import { EdgeDetailsModal } from "./diagram/EdgeDetailsModal";

/**
 * Props for the InteractiveDiagramComponent
 */
export interface InteractiveDiagramProps {
  /** Diagram data to visualize */
  diagramData: DiagramData;
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string, nodeData: VisualNode) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (edgeId: string, edgeData: VisualEdge) => void;
  /** Whether the diagram is in loading state */
  isLoading?: boolean;
  /** Custom CSS class for the container */
  className?: string;
}

/**
 * Interactive diagram component using React Flow
 * Displays code patterns as visual nodes and edges with click interactions
 * Optimized for performance with large diagrams
 */
export const InteractiveDiagramComponent: React.FC<InteractiveDiagramProps> =
  memo(
    ({
      diagramData,
      onNodeClick,
      onEdgeClick,
      isLoading = false,
      className = "",
    }) => {
      const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);
      const [selectedEdge, setSelectedEdge] = useState<VisualEdge | null>(null);
      const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
      const [isLargeDiagram, setIsLargeDiagram] = useState(false);

      // Convert DiagramData to React Flow format with performance optimizations
      const { nodes, edges } = useMemo(() => {
        const nodeCount = diagramData.nodes.length;
        const isLarge = nodeCount > 50;
        setIsLargeDiagram(isLarge);

        const flowNodes: Node[] = diagramData.nodes.map((visualNode) => ({
          id: visualNode.id,
          type: "custom",
          position: visualNode.position,
          data: {
            visualNode,
            onClick: (nodeData: VisualNode) => {
              setSelectedNode(nodeData);
              onNodeClick?.(nodeData.id, nodeData);
            },
            // Disable animations for large diagrams
            disableAnimations: isLarge,
          },
          style: {
            width: visualNode.style?.width || 120,
            height: visualNode.style?.height || 80,
          },
          // Disable dragging for very large diagrams to improve performance
          draggable: !isLarge || nodeCount < 100,
        }));

        const flowEdges: Edge[] = diagramData.edges.map((visualEdge) => ({
          id: visualEdge.id,
          source: visualEdge.source,
          target: visualEdge.target,
          type: "custom",
          label: visualEdge.label,
          // Disable animations for large diagrams
          animated: !isLarge && (visualEdge.animated || false),
          style: {
            stroke: visualEdge.color,
            strokeWidth: visualEdge.style?.strokeWidth || 2,
            strokeDasharray: visualEdge.style?.strokeDasharray,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: visualEdge.color,
          },
          data: {
            visualEdge,
            onClick: (edgeData: VisualEdge) => {
              setSelectedEdge(edgeData);
              onEdgeClick?.(edgeData.id, edgeData);
            },
            disableAnimations: isLarge,
          },
        }));

        return { nodes: flowNodes, edges: flowEdges };
      }, [diagramData, onNodeClick, onEdgeClick]);

      const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
      const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

      // Update nodes and edges when diagramData changes
      React.useEffect(() => {
        setNodes(nodes);
        setEdges(edges);
      }, [nodes, edges, setNodes, setEdges]);

      // Custom node and edge types
      const nodeTypes: NodeTypes = useMemo(
        () => ({
          custom: CustomNode,
        }),
        []
      );

      const edgeTypes: EdgeTypes = useMemo(
        () => ({
          custom: CustomEdge,
        }),
        []
      );

      // Handle connection creation (not typically needed for our use case, but good to have)
      const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
      );

      // Handle React Flow instance initialization with performance optimizations
      const onInit = useCallback(
        (instance: ReactFlowInstance) => {
          setReactFlowInstance(instance);
          // Auto-fit the diagram to the viewport with longer delay for large diagrams
          const delay = isLargeDiagram ? 300 : 100;
          setTimeout(() => {
            instance.fitView({
              padding: 0.1,
              duration: isLargeDiagram ? 0 : 800,
            });
          }, delay);
        },
        [isLargeDiagram]
      );

      // Handle fit view when diagram data changes with performance considerations
      React.useEffect(() => {
        if (reactFlowInstance && diagramData.nodes.length > 0) {
          const delay = isLargeDiagram ? 300 : 100;
          setTimeout(() => {
            reactFlowInstance.fitView({
              padding: 0.1,
              duration: isLargeDiagram ? 0 : 800,
            });
          }, delay);
        }
      }, [diagramData, reactFlowInstance, isLargeDiagram]);

      // Loading state
      if (isLoading) {
        return (
          <div
            className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating diagram...</p>
            </div>
          </div>
        );
      }

      // Empty state
      if (diagramData.nodes.length === 0) {
        return (
          <div
            className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}
          >
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No patterns found
              </h3>
              <p className="text-gray-600">
                Try pasting some JavaScript or TypeScript code to see the visual
                diagram.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div
          className={`h-96 bg-white rounded-lg border border-gray-200 ${className}`}
        >
          {/* Performance warning for large diagrams */}
          {isLargeDiagram && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
              Large diagram detected ({diagramData.nodes.length} nodes) - some
              features disabled for better performance
            </div>
          )}

          <ReactFlowProvider>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onInit}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              attributionPosition="bottom-left"
              className="rounded-lg"
              minZoom={0.1}
              maxZoom={isLargeDiagram ? 1.5 : 2}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              // Performance optimizations for large diagrams
              nodesDraggable={!isLargeDiagram}
              nodesConnectable={false}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              panOnDrag={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={!isLargeDiagram}
            >
              <Controls
                position="top-right"
                showInteractive={false}
                className="bg-white border border-gray-200 rounded-md shadow-sm"
              />
              {/* Only show MiniMap for smaller diagrams to improve performance */}
              {!isLargeDiagram && (
                <MiniMap
                  position="bottom-right"
                  className="bg-white border border-gray-200 rounded-md"
                  maskColor="rgba(0, 0, 0, 0.1)"
                  nodeColor={(node) => {
                    const visualNode = node.data?.visualNode as VisualNode;
                    return visualNode?.style?.backgroundColor || "#f3f4f6";
                  }}
                />
              )}
              <Background
                variant={BackgroundVariant.Dots}
                gap={isLargeDiagram ? 40 : 20}
                size={1}
                color="#e5e7eb"
              />
            </ReactFlow>
          </ReactFlowProvider>

          {/* Node Details Modal */}
          {selectedNode && (
            <NodeDetailsModal
              node={selectedNode}
              isOpen={!!selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {/* Edge Details Modal */}
          {selectedEdge && (
            <EdgeDetailsModal
              edge={selectedEdge}
              isOpen={!!selectedEdge}
              onClose={() => setSelectedEdge(null)}
            />
          )}
        </div>
      );
    }
  );
