import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { vi } from "vitest";
import { InteractiveDiagramComponent } from "../InteractiveDiagramComponent";
import type { DiagramData } from "../../types/visualization";
import { User, MousePointer, Database, Globe } from "lucide-react";

// Mock React Flow to avoid rendering issues in tests
vi.mock("reactflow", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: "dots" },
  MarkerType: { ArrowClosed: "arrowclosed" },
  Position: { Top: "top", Bottom: "bottom" },
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  getBezierPath: () => ["M0,0 L100,100", 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BaseEdge: () => <div data-testid="base-edge" />,
}));

// Mock timers for tooltip delays
vi.useFakeTimers();

describe("Tooltip Integration", () => {
  const mockDiagramData: DiagramData = {
    nodes: [
      {
        id: "button-1",
        type: "button",
        position: { x: 100, y: 100 },
        icon: MousePointer,
        label: "Click Me",
        explanation: "A button that can be clicked",
        metadata: {
          patternNodeId: "pattern-1",
          patternType: "counter",
        },
        style: {
          backgroundColor: "#f3f4f6",
          borderColor: "#6b7280",
          textColor: "#374151",
        },
      },
      {
        id: "counter-1",
        type: "counter",
        position: { x: 300, y: 100 },
        icon: User,
        label: "Count",
        explanation: "Shows the current count",
        metadata: {
          patternNodeId: "pattern-2",
          patternType: "counter",
        },
      },
    ],
    edges: [
      {
        id: "edge-1",
        source: "button-1",
        target: "counter-1",
        label: "increment",
        type: "action",
        color: "#3b82f6",
      },
    ],
    layout: {
      direction: "horizontal",
      nodeSpacing: 150,
      levelSpacing: 200,
      autoFit: true,
      padding: { top: 50, right: 50, bottom: 50, left: 50 },
    },
  };

  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe("Node Tooltips", () => {
    it("shows child-friendly tooltip for button nodes on hover", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      // Find the button node
      const buttonNode = screen.getByText("Click Me");
      expect(buttonNode).toBeInTheDocument();

      // Hover over the button
      fireEvent.mouseEnter(buttonNode.closest("button")!);

      // Fast-forward past the show delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Check for child-friendly tooltip content
      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent(/Click Me.*button.*click/i);
        expect(tooltip).toHaveTextContent(/doorbell/i); // Should include analogy
      });
    });

    it("shows child-friendly tooltip for counter nodes on hover", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const counterNode = screen.getByText("Count");
      fireEvent.mouseEnter(counterNode.closest("button")!);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveTextContent(/Count.*number/i);
        expect(tooltip).toHaveTextContent(/score counter/i); // Should include analogy
      });
    });

    it("hides tooltip when mouse leaves node", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const buttonNode = screen.getByText("Click Me");
      const buttonElement = buttonNode.closest("button")!;

      // Show tooltip
      fireEvent.mouseEnter(buttonElement);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Hide tooltip
      fireEvent.mouseLeave(buttonElement);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });
  });

  describe("Edge Tooltips", () => {
    it("shows child-friendly tooltip for action edges on hover", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const actionEdge = screen.getByText("increment");
      fireEvent.mouseEnter(actionEdge);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveTextContent(/what happens when you click/i);
        expect(tooltip).toHaveTextContent(/arrow/i); // Should include analogy
      });
    });
  });

  describe("Accessibility", () => {
    it("provides proper ARIA labels for nodes with child-friendly explanations", () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const buttonNode = screen.getByText("Click Me").closest("button")!;
      expect(buttonNode).toHaveAttribute("aria-label");

      const ariaLabel = buttonNode.getAttribute("aria-label")!;
      expect(ariaLabel).toContain("Click Me");
      expect(ariaLabel).toContain("button you can click");
    });

    it("sets correct tooltip role and aria-hidden attributes", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const buttonNode = screen.getByText("Click Me");
      fireEvent.mouseEnter(buttonNode.closest("button")!);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveAttribute("role", "tooltip");
        expect(tooltip).toHaveAttribute("aria-hidden", "false");
      });
    });
  });

  describe("Child-Friendly Language Validation", () => {
    it("avoids technical jargon in all tooltips", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const buttonNode = screen.getByText("Click Me");
      fireEvent.mouseEnter(buttonNode.closest("button")!);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        const tooltipText = tooltip.textContent!.toLowerCase();

        // Should not contain technical terms
        expect(tooltipText).not.toContain("function");
        expect(tooltipText).not.toContain("method");
        expect(tooltipText).not.toContain("object");
        expect(tooltipText).not.toContain("instance");
        expect(tooltipText).not.toContain("parameter");
        expect(tooltipText).not.toContain("callback");
        expect(tooltipText).not.toContain("async");
        expect(tooltipText).not.toContain("promise");
      });
    });

    it("uses positive, encouraging language", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const buttonNode = screen.getByText("Click Me");
      fireEvent.mouseEnter(buttonNode.closest("button")!);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        const tooltipText = tooltip.textContent!.toLowerCase();

        // Should use positive language
        expect(tooltipText).toMatch(/can|will|helps|shows|does/);

        // Should not use negative or confusing language
        expect(tooltipText).not.toContain("cannot");
        expect(tooltipText).not.toContain("fails");
        expect(tooltipText).not.toContain("broken");
        expect(tooltipText).not.toContain("wrong");
      });
    });

    it("includes helpful analogies in tooltips", async () => {
      render(<InteractiveDiagramComponent diagramData={mockDiagramData} />);

      const buttonNode = screen.getByText("Click Me");
      fireEvent.mouseEnter(buttonNode.closest("button")!);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip.textContent!.toLowerCase()).toContain("doorbell");
      });
    });
  });
});
