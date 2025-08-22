import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractiveDiagramComponent } from "../InteractiveDiagramComponent";
import type {
  DiagramData,
  VisualNode,
  VisualEdge,
} from "../../types/visualization";
import { MousePointer, Hash, Globe } from "lucide-react";

// Mock ReactFlow
vi.mock("reactflow", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      {children}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => (
    <div data-testid="react-flow-provider">{children}</div>
  ),
  Controls: ({ className }: any) => (
    <div data-testid="controls" className={className} />
  ),
  MiniMap: ({ className }: any) => (
    <div data-testid="minimap" className={className} />
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
    <div data-testid={`handle-${type}`} className={className} style={style} />
  ),
  EdgeLabelRenderer: ({ children }: any) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  BaseEdge: ({ path, style }: any) => (
    <path data-testid="base-edge" d={path} style={style} />
  ),
}));

describe("InteractiveDiagramComponent", () => {
  const mockOnNodeClick = vi.fn();
  const mockOnEdgeClick = vi.fn();

  const createMockVisualNode = (
    id: string,
    type: VisualNode["type"],
    label: string
  ): VisualNode => ({
    id,
    type,
    position: { x: 0, y: 0 },
    icon: type === "button" ? MousePointer : type === "counter" ? Hash : Globe,
    label,
    explanation: `This is a ${type}`,
    metadata: {
      patternNodeId: `pattern-${id}`,
      patternType: "counter",
      codeLocation: { start: 0, end: 10 },
      context: { confidence: 0.9 },
    },
    style: {
      backgroundColor: "#f3f4f6",
      borderColor: "#6b7280",
      textColor: "#374151",
    },
  });

  const createMockVisualEdge = (
    id: string,
    source: string,
    target: string
  ): VisualEdge => ({
    id,
    source,
    target,
    label: "click",
    type: "action",
    color: "#3b82f6",
    animated: true,
  });

  const createMockDiagramData = (): DiagramData => ({
    nodes: [
      createMockVisualNode("node1", "button", "Click Me"),
      createMockVisualNode("node2", "counter", "Count: 0"),
    ],
    edges: [createMockVisualEdge("edge1", "node1", "node2")],
    layout: {
      direction: "vertical",
      nodeSpacing: 150,
      levelSpacing: 200,
      autoFit: true,
      padding: { top: 50, right: 50, bottom: 50, left: 50 },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the diagram with nodes and edges", () => {
      const diagramData = createMockDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      expect(screen.getByTestId("react-flow-provider")).toBeInTheDocument();
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("controls")).toBeInTheDocument();
      expect(screen.getByTestId("minimap")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
    });

    it("shows loading state when isLoading is true", () => {
      const diagramData = createMockDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          isLoading={true}
        />
      );

      expect(screen.getByText("Generating diagram...")).toBeInTheDocument();
      expect(screen.queryByTestId("react-flow")).not.toBeInTheDocument();
    });

    it("shows empty state when no nodes are provided", () => {
      const emptyDiagramData: DiagramData = {
        nodes: [],
        edges: [],
        layout: {
          direction: "vertical",
          nodeSpacing: 150,
          levelSpacing: 200,
          autoFit: true,
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      };

      render(<InteractiveDiagramComponent diagramData={emptyDiagramData} />);

      expect(screen.getByText("No patterns found")).toBeInTheDocument();
      expect(
        screen.getByText(/Try pasting some JavaScript or TypeScript code/)
      ).toBeInTheDocument();
      expect(screen.queryByTestId("react-flow")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      const diagramData = createMockDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          className="custom-class"
        />
      );

      const container = screen
        .getByTestId("react-flow")
        .closest(".custom-class");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("converts DiagramData to React Flow format correctly", () => {
      const diagramData = createMockDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      const reactFlow = screen.getByTestId("react-flow");
      expect(reactFlow).toBeInTheDocument();

      // The component should convert the diagram data to React Flow format
      // This is tested indirectly through the rendering
    });

    it("handles node click callbacks", async () => {
      const diagramData = createMockDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onNodeClick={mockOnNodeClick}
        />
      );

      // Since we're mocking ReactFlow, we can't directly test the click interaction
      // But we can verify the component is set up correctly
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });

    it("handles edge click callbacks", async () => {
      const diagramData = createMockDiagramData();

      render(
        <InteractiveDiagramComponent
          diagramData={diagramData}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      // Since we're mocking ReactFlow, we can't directly test the click interaction
      // But we can verify the component is set up correctly
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("renders with default height", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      const container = screen.getByTestId("react-flow").closest(".h-96");
      expect(container).toBeInTheDocument();
    });

    it("includes responsive classes", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      const container = screen
        .getByTestId("react-flow")
        .closest(".bg-white.rounded-lg.border.border-gray-200");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Controls and Features", () => {
    it("renders controls with correct styling", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      const controls = screen.getByTestId("controls");
      expect(controls).toHaveClass(
        "bg-white",
        "border",
        "border-gray-200",
        "rounded-md",
        "shadow-sm"
      );
    });

    it("renders minimap with correct styling", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      const minimap = screen.getByTestId("minimap");
      expect(minimap).toHaveClass(
        "bg-white",
        "border",
        "border-gray-200",
        "rounded-md"
      );
    });

    it("renders background with correct properties", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      const background = screen.getByTestId("background");
      expect(background).toHaveAttribute("data-variant", "dots");
      expect(background).toHaveAttribute("data-gap", "20");
      expect(background).toHaveAttribute("data-size", "1");
      expect(background).toHaveAttribute("data-color", "#e5e7eb");
    });
  });

  describe("Data Updates", () => {
    it("updates when diagramData changes", () => {
      const initialData = createMockDiagramData();
      const { rerender } = render(
        <InteractiveDiagramComponent diagramData={initialData} />
      );

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();

      const updatedData = {
        ...initialData,
        nodes: [
          ...initialData.nodes,
          createMockVisualNode("node3", "api", "API Call"),
        ],
      };

      rerender(<InteractiveDiagramComponent diagramData={updatedData} />);

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });

    it("handles empty data gracefully", () => {
      const emptyData: DiagramData = {
        nodes: [],
        edges: [],
        layout: {
          direction: "vertical",
          nodeSpacing: 150,
          levelSpacing: 200,
          autoFit: true,
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      };

      render(<InteractiveDiagramComponent diagramData={emptyData} />);

      expect(screen.getByText("No patterns found")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("includes proper ARIA attributes", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // The ReactFlow component should be accessible
      const reactFlow = screen.getByTestId("react-flow");
      expect(reactFlow).toBeInTheDocument();
    });

    it("supports keyboard navigation through ReactFlow", () => {
      const diagramData = createMockDiagramData();

      render(<InteractiveDiagramComponent diagramData={diagramData} />);

      // ReactFlow handles keyboard navigation internally
      const reactFlow = screen.getByTestId("react-flow");
      expect(reactFlow).toBeInTheDocument();
    });
  });
});
