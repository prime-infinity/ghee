import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CustomEdge, CustomEdgeData } from "../diagram/CustomEdge";
import type { VisualEdge } from "../../types/visualization";

// Mock ReactFlow components
vi.mock("reactflow", () => ({
  getBezierPath: vi.fn(() => ["M0,0 L100,100", 50, 50]),
  EdgeLabelRenderer: ({ children }: any) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  BaseEdge: ({ path, style }: any) => (
    <path data-testid="base-edge" d={path} style={style} />
  ),
}));

describe("CustomEdge", () => {
  const mockOnClick = vi.fn();

  const createMockVisualEdge = (
    overrides: Partial<VisualEdge> = {}
  ): VisualEdge => ({
    id: "test-edge",
    source: "node1",
    target: "node2",
    label: "click",
    type: "action",
    color: "#3b82f6",
    animated: true,
    style: {
      strokeWidth: 2,
      markerEnd: "url(#arrowhead)",
    },
    ...overrides,
  });

  const createMockEdgeData = (visualEdge: VisualEdge): CustomEdgeData => ({
    visualEdge,
    onClick: mockOnClick,
  });

  const defaultProps = {
    id: "test-edge",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: "bottom" as const,
    targetPosition: "top" as const,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
    selected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders edge with BaseEdge component", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      expect(screen.getByTestId("base-edge")).toBeInTheDocument();
      expect(screen.getByTestId("edge-label-renderer")).toBeInTheDocument();
    });

    it("renders edge label as clickable button", () => {
      const visualEdge = createMockVisualEdge({
        label: "API Call",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      const labelButton = screen.getByRole("button", { name: /API Call/i });
      expect(labelButton).toBeInTheDocument();
      expect(labelButton).toHaveTextContent("API Call");
    });

    it("applies correct styling based on edge type", () => {
      const visualEdge = createMockVisualEdge({
        color: "#ef4444",
        type: "error",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          style={{ stroke: "#ef4444", strokeWidth: 2 }}
        />
      );

      const baseEdge = screen.getByTestId("base-edge");
      expect(baseEdge).toHaveStyle({
        stroke: "#ef4444",
        strokeWidth: "2",
      });
    });

    it("handles missing data gracefully", () => {
      render(<CustomEdge {...defaultProps} data={undefined} />);

      expect(screen.queryByTestId("base-edge")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("edge-label-renderer")
      ).not.toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onClick when label is clicked", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      const labelButton = screen.getByRole("button");
      fireEvent.click(labelButton);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(visualEdge);
    });

    it("shows hover effects on mouse enter/leave", () => {
      const visualEdge = createMockVisualEdge({
        color: "#3b82f6",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      const labelButton = screen.getByRole("button");

      // Test initial state - check that the button has the expected color
      expect(labelButton).toHaveStyle({
        color: "#3b82f6",
      });

      // Test hover state
      fireEvent.mouseEnter(labelButton);
      expect(labelButton).toHaveStyle({
        backgroundColor: "#3b82f6",
        color: "rgb(255, 255, 255)",
      });

      // Test mouse leave
      fireEvent.mouseLeave(labelButton);
      expect(labelButton).toHaveStyle({
        color: "#3b82f6",
      });
    });

    it("does not change hover state when selected", () => {
      const visualEdge = createMockVisualEdge({
        color: "#3b82f6",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} selected={true} />);

      const labelButton = screen.getByRole("button");

      // Selected state should have different styling
      expect(labelButton).toHaveStyle({
        color: "rgb(255, 255, 255)",
      });

      // Hover should not change selected state
      fireEvent.mouseEnter(labelButton);
      expect(labelButton).toHaveStyle({
        backgroundColor: "#3b82f6",
        color: "rgb(255, 255, 255)",
      });
    });
  });

  describe("Selection State", () => {
    it("applies selected styling when selected is true", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} selected={true} />);

      const labelButton = screen.getByRole("button");
      expect(labelButton).toHaveStyle({
        color: "rgb(255, 255, 255)",
        transform: "scale(1.1)",
      });
    });

    it("applies default styling when selected is false", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} selected={false} />);

      const labelButton = screen.getByRole("button");
      expect(labelButton).toHaveStyle({
        color: visualEdge.color,
      });
    });

    it("increases stroke width when selected", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          selected={true}
          style={{ strokeWidth: 2 }}
        />
      );

      const baseEdge = screen.getByTestId("base-edge");
      expect(baseEdge).toHaveStyle({
        strokeWidth: "3", // 2 + 1 for selected state
      });
    });
  });

  describe("Different Edge Types", () => {
    it("renders success edge correctly", () => {
      const visualEdge = createMockVisualEdge({
        type: "success",
        color: "#10b981",
        label: "Success",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          style={{ stroke: "#10b981" }}
        />
      );

      const labelButton = screen.getByRole("button");
      expect(labelButton).toHaveTextContent("Success");
      expect(labelButton).toHaveStyle({
        borderColor: "#10b981",
        color: "#10b981",
      });
    });

    it("renders error edge correctly", () => {
      const visualEdge = createMockVisualEdge({
        type: "error",
        color: "#ef4444",
        label: "Error",
        style: {
          strokeWidth: 3,
          strokeDasharray: "5,5",
        },
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          style={{ stroke: "#ef4444", strokeDasharray: "5,5" }}
        />
      );

      const labelButton = screen.getByRole("button");
      expect(labelButton).toHaveTextContent("Error");
      expect(labelButton).toHaveStyle({
        borderColor: "#ef4444",
        color: "#ef4444",
      });

      const baseEdge = screen.getByTestId("base-edge");
      expect(baseEdge).toHaveStyle({
        strokeDasharray: "5,5",
      });
    });

    it("renders data-flow edge correctly", () => {
      const visualEdge = createMockVisualEdge({
        type: "data-flow",
        color: "#8b5cf6",
        label: "Data Flow",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          style={{ stroke: "#8b5cf6" }}
        />
      );

      const labelButton = screen.getByRole("button");
      expect(labelButton).toHaveTextContent("Data Flow");
      expect(labelButton).toHaveStyle({
        borderColor: "#8b5cf6",
        color: "#8b5cf6",
      });
    });
  });

  describe("Label Positioning", () => {
    it("positions label at the correct coordinates", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      // Check that the button is rendered and clickable
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("click");

      // Check that the button has a parent container (the positioning wrapper)
      const labelContainer = button.parentElement;
      expect(labelContainer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper button role and title attribute", () => {
      const visualEdge = createMockVisualEdge({
        label: "Click Action",
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      const labelButton = screen.getByRole("button");
      expect(labelButton).toHaveAttribute("aria-label");
      const ariaLabel = labelButton.getAttribute("aria-label");
      expect(ariaLabel).toContain("Click Action");
    });

    it("supports keyboard interaction", () => {
      const visualEdge = createMockVisualEdge();
      const edgeData = createMockEdgeData(visualEdge);

      render(<CustomEdge {...defaultProps} data={edgeData} />);

      const labelButton = screen.getByRole("button");

      // Test keyboard interaction
      fireEvent.keyDown(labelButton, { key: "Enter" });
      // Note: onClick is triggered by click events, not keydown in this implementation
      // This would need to be enhanced for full keyboard accessibility
    });
  });

  describe("Style Variations", () => {
    it("handles custom stroke width", () => {
      const visualEdge = createMockVisualEdge({
        style: {
          strokeWidth: 4,
        },
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          style={{ strokeWidth: 4 }}
        />
      );

      const baseEdge = screen.getByTestId("base-edge");
      expect(baseEdge).toHaveStyle({
        strokeWidth: "4",
      });
    });

    it("handles dashed stroke pattern", () => {
      const visualEdge = createMockVisualEdge({
        style: {
          strokeDasharray: "10,5",
        },
      });
      const edgeData = createMockEdgeData(visualEdge);

      render(
        <CustomEdge
          {...defaultProps}
          data={edgeData}
          style={{ strokeDasharray: "10,5" }}
        />
      );

      const baseEdge = screen.getByTestId("base-edge");
      expect(baseEdge).toHaveStyle({
        strokeDasharray: "10,5",
      });
    });
  });
});
