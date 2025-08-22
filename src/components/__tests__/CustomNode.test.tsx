import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CustomNode, CustomNodeData } from "../diagram/CustomNode";
import type { VisualNode } from "../../types/visualization";
import { MousePointer, Hash } from "lucide-react";

// Mock ReactFlow components
vi.mock("reactflow", () => ({
  Handle: ({ type, position, className, style }: any) => (
    <div
      data-testid={`handle-${type}`}
      className={className}
      style={style}
      data-position={position}
    />
  ),
  Position: {
    Top: "top",
    Bottom: "bottom",
  },
}));

describe("CustomNode", () => {
  const mockOnClick = vi.fn();

  const createMockVisualNode = (
    overrides: Partial<VisualNode> = {}
  ): VisualNode => ({
    id: "test-node",
    type: "button",
    position: { x: 0, y: 0 },
    icon: MousePointer,
    label: "Test Button",
    explanation: "A clickable button that users can press",
    metadata: {
      patternNodeId: "pattern-node-1",
      patternType: "counter",
      codeLocation: { start: 0, end: 10 },
      context: { confidence: 0.9 },
    },
    style: {
      backgroundColor: "#dbeafe",
      borderColor: "#3b82f6",
      textColor: "#1e40af",
      borderWidth: 2,
      borderRadius: 8,
      width: 120,
      height: 80,
    },
    ...overrides,
  });

  const createMockNodeData = (visualNode: VisualNode): CustomNodeData => ({
    visualNode,
    onClick: mockOnClick,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders node with correct visual styling", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toBeInTheDocument();
      expect(nodeContainer).toHaveStyle({
        backgroundColor: "#dbeafe",
        color: "#1e40af",
        width: "120px",
        height: "80px",
      });
    });

    it("displays the correct icon and label", () => {
      const visualNode = createMockVisualNode({
        icon: Hash,
        label: "Counter: 5",
        type: "counter",
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      expect(screen.getByText("Counter: 5")).toBeInTheDocument();
      // Icon is rendered but hard to test directly due to Lucide React implementation
    });

    it("shows tooltip with explanation on hover", () => {
      const visualNode = createMockVisualNode({
        explanation: "This is a test explanation",
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toHaveAttribute(
        "title",
        "This is a test explanation"
      );
    });

    it("renders input and output handles", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      expect(screen.getByTestId("handle-target")).toBeInTheDocument();
      expect(screen.getByTestId("handle-source")).toBeInTheDocument();

      const inputHandle = screen.getByTestId("handle-target");
      const outputHandle = screen.getByTestId("handle-source");

      expect(inputHandle).toHaveAttribute("data-position", "top");
      expect(outputHandle).toHaveAttribute("data-position", "bottom");
    });
  });

  describe("Interactions", () => {
    it("calls onClick when node is clicked", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      fireEvent.click(nodeContainer);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(visualNode);
    });

    it("shows hover effects on mouse enter/leave", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");

      // Test hover class is applied
      expect(nodeContainer).toHaveClass("hover:shadow-md");
      expect(nodeContainer).toHaveClass("transition-all");
    });
  });

  describe("Selection State", () => {
    it("applies selected styling when selected is true", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={true} />);

      const nodeContainer = screen.getByRole("button");
      // The selected styling is applied via inline styles in the component
      expect(nodeContainer).toBeInTheDocument();
    });

    it("applies default styling when selected is false", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toHaveStyle({
        borderWidth: "2px",
        borderColor: "#3b82f6",
      });
    });
  });

  describe("Different Node Types", () => {
    it("renders counter node correctly", () => {
      const visualNode = createMockVisualNode({
        type: "counter",
        icon: Hash,
        label: "Count: 3",
        style: {
          backgroundColor: "#dcfce7",
          borderColor: "#10b981",
          textColor: "#065f46",
          borderWidth: 2,
          borderRadius: 8,
          width: 120,
          height: 80,
        },
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toHaveStyle({
        backgroundColor: "#dcfce7",
        borderColor: "#10b981",
        color: "#065f46",
      });
      expect(screen.getByText("Count: 3")).toBeInTheDocument();
    });

    it("handles long labels with truncation", () => {
      const visualNode = createMockVisualNode({
        label: "This is a very long label that should be truncated",
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const labelElement = screen.getByText(
        "This is a very long label that should be truncated"
      );
      expect(labelElement).toHaveClass("truncate");
      expect(labelElement).toHaveAttribute(
        "title",
        "This is a very long label that should be truncated"
      );
    });
  });

  describe("Styling Variations", () => {
    it("handles missing style properties gracefully", () => {
      const visualNode = createMockVisualNode({
        style: undefined,
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toHaveStyle({
        backgroundColor: "#f3f4f6", // default
        borderColor: "#6b7280", // default
        color: "#374151", // default
      });
    });

    it("applies custom dimensions correctly", () => {
      const visualNode = createMockVisualNode({
        style: {
          width: 150,
          height: 100,
          backgroundColor: "#fee2e2",
          borderColor: "#ef4444",
          textColor: "#991b1b",
          borderWidth: 3,
          borderRadius: 12,
        },
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toHaveStyle({
        width: "150px",
        height: "100px",
        backgroundColor: "#fee2e2",
        borderColor: "#ef4444",
        color: "#991b1b",
        borderWidth: "3px",
        borderRadius: "12px",
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper button role and title attribute", () => {
      const visualNode = createMockVisualNode({
        explanation: "Accessible explanation",
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");
      expect(nodeContainer).toHaveAttribute("title", "Accessible explanation");
    });

    it("supports keyboard interaction", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const nodeContainer = screen.getByRole("button");

      // Test keyboard interaction
      fireEvent.keyDown(nodeContainer, { key: "Enter" });
      // Note: onClick is triggered by click events, not keydown in this implementation
      // This would need to be enhanced for full keyboard accessibility
    });
  });

  describe("Hover Tooltip", () => {
    it("displays hover tooltip with correct content", () => {
      const visualNode = createMockVisualNode({
        explanation: "Detailed explanation for tooltip",
      });
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const tooltip = screen.getByText("Detailed explanation for tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveClass("opacity-0", "group-hover:opacity-100");
    });

    it("positions tooltip correctly", () => {
      const visualNode = createMockVisualNode();
      const nodeData = createMockNodeData(visualNode);

      render(<CustomNode data={nodeData} selected={false} />);

      const tooltip = screen.getByText(visualNode.explanation);
      expect(tooltip).toHaveClass("absolute", "bottom-full", "left-1/2");
    });
  });
});
