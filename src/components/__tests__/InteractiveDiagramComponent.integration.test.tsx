import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractiveDiagramComponent } from "../InteractiveDiagramComponent";
import type {
  DiagramData,
  VisualNode,
  VisualEdge,
} from "../../types/visualization";
import { MousePointer, Hash, Globe, Database } from "lucide-react";

// Mock ReactFlow with more detailed implementation for integration testing
const mockFitView = vi.fn();
const mockReactFlowInstance = {
  fitView: mockFitView,
};

vi.mock("reactflow", () => ({
  __esModule: true,
  default: ({
    children,
    onInit,
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    ...props
  }: any) => {
    // Simulate onInit callback
    React.useEffect(() => {
      if (onInit) {
        onInit(mockReactFlowInstance);
      }
    }, [onInit]);

    return (
      <div data-testid="react-flow" {...props}>
        {/* Render nodes */}
        {nodes?.map((node: any) => {
          const NodeComponent = nodeTypes?.custom;
          return NodeComponent ? (
            <div key={node.id} data-testid={`node-${node.id}`}>
              <NodeComponent data={node.data} selected={false} />
            </div>
          ) : null;
        })}

        {/* Render edges */}
        {edges?.map((edge: any) => {
          const EdgeComponent = edgeTypes?.custom;
          return EdgeComponent ? (
            <div key={edge.id} data-testid={`edge-${edge.id}`}>
              <EdgeComponent
                id={edge.id}
                sourceX={0}
                sourceY={0}
                targetX={100}
                targetY={100}
                sourcePosition="bottom"
                targetPosition="top"
                style={edge.style}
                data={edge.data}
                selected={false}
              />
            </div>
          ) : null;
        })}

        {children}
      </div>
    );
  },
  ReactFlowProvider: ({ children }: any) => (
    <div data-testid="react-flow-provider">{children}</div>
  ),
  Controls: ({ className }: any) => (
    <div data-testid="controls" className={className} />
  ),
  MiniMap: ({ className, nodeColor }: any) => (
    <div
      data-testid="minimap"
      className={className}
      data-node-color={typeof nodeColor}
    />
  ),
  Background: ({ variant, gap, size, color }: any) => (
    <div
      data-testid="background"
      data-variant={variant}
      data-gap={gap}
      data-size={size}
      data-color={color}
    />
  ),
  BackgroundVariant: {
    Dots: "dots",
  },
  MarkerType: {
    ArrowClosed: "arrowclosed",
  },
  Position: {
    Top: "top",
    Bottom: "bottom",
  },
  useNodesState: (initialNodes: any) => [initialNodes, vi.fn(), vi.fn()],
  useEdgesState: (initialEdges: any) => [initialEdges, vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  getBezierPath: vi.fn(() => ["M0,0 L100,100", 50, 50]),
  Handle: ({ type, position, className, style }: any) => (
    <div
      data-testid={`handle-${type}`}
      className={className}
      style={style}
      data-position={position}
    />
  ),
  EdgeLabelRenderer: ({ children }: any) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  BaseEdge: ({ path, style }: any) => (
    <path data-testid="base-edge" d={path} style={style} />
  ),
}));

describe("InteractiveDiagramComponent Integration", () => {
  const mockOnNodeClick = vi.fn();
  const mockOnEdgeClick = vi.fn();

  const createComplexDiagramData = (): DiagramData => ({
    nodes: [
      {
        id: "button-node",
        type: "button",
        position: { x: 0, y: 0 },
        icon: MousePointer,
        label: "Click Button",
        explanation: "A clickable button that starts the counter",
        metadata: {
          patternNodeId: "pattern-button",
          patternType: "counter",
          codeLocation: { start: 0, end: 20 },
          context: { confidence: 0.95, isClickHandler: true },
        },
        style: {
          backgroundColor: "#dbeafe",
          borderColor: "#3b82f6",
          textColor: "#1e40af",
          width: 120,
          height: 80,
        },
      },
      {
        id: "counter-node",
        type: "counter",
        position: { x: 200, y: 0 },
        icon: Hash,
        label: "Count: 0",
        explanation: "A number that increases when the button is clicked",
        metadata: {
          patternNodeId: "pattern-counter",
          patternType: "counter",
          codeLocation: { start: 21, end: 40 },
          context: { confidence: 0.9, isCounterVariable: true },
        },
        style: {
          backgroundColor: "#dcfce7",
          borderColor: "#10b981",
          textColor: "#065f46",
          width: 120,
          height: 80,
        },
      },
      {
        id: "api-node",
        type: "api",
        position: { x: 400, y: 0 },
        icon: Globe,
        label: "Save Count",
        explanation: "Sends the count to a server",
        metadata: {
          patternNodeId: "pattern-api",
          patternType: "api-call",
          codeLocation: { start: 41, end: 80 },
          context: {
            confidence: 0.85,
            endpoint: "/api/count",
            httpMethod: "POST",
          },
        },
        style: {
          backgroundColor: "#fef3c7",
          borderColor: "#f59e0b",
          textColor: "#92400e",
          width: 120,
          height: 80,
        },
      },
      {
        id: "database-node",
        type: "database",
        position: { x: 600, y: 0 },
        icon: Database,
        label: "Store Data",
        explanation: "Saves the count in the database",
        metadata: {
          patternNodeId: "pattern-db",
          patternType: "database",
          codeLocation: { start: 81, end: 120 },
          context: {
            confidence: 0.8,
            operationType: "insert",
            tables: ["counts"],
          },
        },
        style: {
          backgroundColor: "#e0e7ff",
          borderColor: "#6366f1",
          textColor: "#3730a3",
          width: 120,
          height: 80,
        },
      },
    ],
    edges: [
      {
        id: "click-edge",
        source: "button-node",
        target: "counter-node",
        label: "click",
        type: "action",
        color: "#3b82f6",
        animated: true,
      },
      {
        id: "increment-edge",
        source: "counter-node",
        target: "api-node",
        label: "save",
        type: "data-flow",
        color: "#8b5cf6",
        animated: false,
      },
      {
        id: "api-success-edge",
        source: "api-node",
        target: "database-node",
        label: "success",
        type: "success",
        color: "#10b981",
        animated: false,
      },
    ],
    layout: {
      direction: "horizontal",
      nodeSpacing: 200,
      levelSpacing: 150,
      autoFit: true,
      padding: { top: 50, right: 50, bottom: 50, left: 50 },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Flow Integration", () => {
    it("renders complex diagram with multiple nodes and edges", async () => {
      const diagramData = createComplexDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      // Verify all nodes are rendered
      expect(screen.getByTestId("node-button-node")).toBeInTheDocument();
      expect(screen.getByTestId("node-counter-node")).toBeInTheDocument();
      expect(screen.getByTestId("node-api-node")).toBeInTheDocument();
      expect(screen.getByTestId("node-database-node")).toBeInTheDocument();

      // Verify all edges are rendered
      expect(screen.getByTestId("edge-click-edge")).toBeInTheDocument();
      expect(screen.getByTestId("edge-increment-edge")).toBeInTheDocument();
      expect(screen.getByTestId("edge-api-success-edge")).toBeInTheDocument();

      // Verify node labels
      expect(screen.getByText("Click Button")).toBeInTheDocument();
      expect(screen.getByText("Count: 0")).toBeInTheDocument();
      expect(screen.getByText("Save Count")).toBeInTheDocument();
      expect(screen.getByText("Store Data")).toBeInTheDocument();

      // Verify edge labels
      expect(screen.getByText("click")).toBeInTheDocument();
      expect(screen.getByText("save")).toBeInTheDocument();
      expect(screen.getByText("success")).toBeInTheDocument();
    });

    it("handles node click interactions correctly", async () => {
      const diagramData = createComplexDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      // Click on button node
      const buttonNode = screen.getByLabelText(
        "Click Button: A clickable button that starts the counter"
      );
      expect(buttonNode).toBeInTheDocument();

      fireEvent.click(buttonNode);

      await waitFor(() => {
        expect(mockOnNodeClick).toHaveBeenCalledTimes(1);
        expect(mockOnNodeClick).toHaveBeenCalledWith(
          "button-node",
          expect.objectContaining({
            id: "button-node",
            type: "button",
            label: "Click Button",
          })
        );
      });
    });

    it("handles edge click interactions correctly", async () => {
      const diagramData = createComplexDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      // Click on edge label - get the one with exact text "click"
      const clickEdgeLabel = screen.getByText("click");
      expect(clickEdgeLabel).toBeInTheDocument();

      fireEvent.click(clickEdgeLabel);

      await waitFor(() => {
        expect(mockOnEdgeClick).toHaveBeenCalledTimes(1);
        expect(mockOnEdgeClick).toHaveBeenCalledWith(
          "click-edge",
          expect.objectContaining({
            id: "click-edge",
            source: "button-node",
            target: "counter-node",
            label: "click",
            type: "action",
          })
        );
      });
    });

    it("opens and closes node details modal", async () => {
      const diagramData = createComplexDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // Initially no modal
      expect(screen.queryByText("What does this do?")).not.toBeInTheDocument();

      // Click on a node to open modal
      const buttonNode = screen.getByLabelText(
        "Click Button: A clickable button that starts the counter"
      );
      fireEvent.click(buttonNode);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText("What does this do?")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Click Button" })
        ).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);

      // Modal should disappear
      await waitFor(() => {
        expect(
          screen.queryByText("What does this do?")
        ).not.toBeInTheDocument();
      });
    });

    it("opens and closes edge details modal", async () => {
      const diagramData = createComplexDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // Initially no modal
      expect(
        screen.queryByText("What does this connection do?")
      ).not.toBeInTheDocument();

      // Click on an edge to open modal
      const clickEdgeLabel = screen.getByText("click");
      fireEvent.click(clickEdgeLabel);

      // Modal should appear
      await waitFor(() => {
        expect(
          screen.getByText("What does this connection do?")
        ).toBeInTheDocument();
        expect(
          screen.getByText(/represents an action or event/i)
        ).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);

      // Modal should disappear
      await waitFor(() => {
        expect(
          screen.queryByText("What does this connection do?")
        ).not.toBeInTheDocument();
      });
    });

    it("handles diagram data updates correctly", async () => {
      const initialData = createComplexDiagramData();
      const { rerender } = render(
        <InteractiveDiagramComponent diagramData={initialData} />
      );

      // Verify initial state
      expect(screen.getByText("Count: 0")).toBeInTheDocument();
      expect(screen.queryByText("Count: 5")).not.toBeInTheDocument();

      // Update diagram data
      const updatedData = {
        ...initialData,
        nodes: initialData.nodes.map((node) =>
          node.id === "counter-node" ? { ...node, label: "Count: 5" } : node
        ),
      };

      rerender(<InteractiveDiagramComponent diagramData={updatedData} />);

      // Verify updated state
      await waitFor(() => {
        expect(screen.getByText("Count: 5")).toBeInTheDocument();
        expect(screen.queryByText("Count: 0")).not.toBeInTheDocument();
      });
    });

    it("calls fitView when diagram is initialized and updated", async () => {
      const diagramData = createComplexDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // Wait for fitView to be called on initialization
      await waitFor(
        () => {
          expect(mockFitView).toHaveBeenCalledWith({ padding: 0.1 });
        },
        { timeout: 200 }
      );
    });

    it("handles keyboard navigation for modals", async () => {
      const diagramData = createComplexDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // Open node modal
      const buttonNode = screen.getByLabelText(
        "Click Button: A clickable button that starts the counter"
      );
      fireEvent.click(buttonNode);

      await waitFor(() => {
        expect(screen.getByText("What does this do?")).toBeInTheDocument();
      });

      // Press Escape to close modal
      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(
          screen.queryByText("What does this do?")
        ).not.toBeInTheDocument();
      });
    });

    it("displays different edge types with correct styling", () => {
      const diagramData = createComplexDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // Check action edge (blue)
      const actionEdge = screen.getByText("click");
      expect(actionEdge).toHaveStyle({
        color: "#3b82f6",
      });

      // Check success edge (green)
      const successEdge = screen.getByText("success");
      expect(successEdge).toHaveStyle({
        color: "#10b981",
      });

      // Check data-flow edge (purple)
      const dataFlowEdge = screen.getByText("save");
      expect(dataFlowEdge).toHaveStyle({
        color: "#8b5cf6",
      });
    });
  });

  describe("Responsive Behavior Integration", () => {
    it("maintains functionality across different container sizes", () => {
      const diagramData = createComplexDiagramData();

      const { container } = render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          className="w-full h-64"
        />
      );

      // Verify responsive classes are applied
      const diagramContainer = container.querySelector(".w-full.h-64");
      expect(diagramContainer).toBeInTheDocument();

      // Verify all components still render
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("controls")).toBeInTheDocument();
      expect(screen.getByTestId("minimap")).toBeInTheDocument();
    });
  });

  describe("Error Handling Integration", () => {
    it("handles malformed diagram data gracefully", () => {
      const malformedData: DiagramData = {
        nodes: [
          // Missing required properties
          {
            id: "broken-node",
            type: "button",
            position: { x: 0, y: 0 },
            icon: MousePointer,
            label: "",
            explanation: "",
            metadata: {
              patternNodeId: "",
              patternType: "",
            },
          } as VisualNode,
        ],
        edges: [],
        layout: {
          direction: "vertical",
          nodeSpacing: 150,
          levelSpacing: 200,
          autoFit: true,
          padding: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      };

      // Should not throw an error
      expect(() => {
        render(<InteractiveDiagramComponent diagramData={malformedData} />);
      }).not.toThrow();

      // Should still render the diagram structure
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });
  });
});
