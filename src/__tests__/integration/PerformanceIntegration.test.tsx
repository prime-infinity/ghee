import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CodeVisualizationService } from "../../services/CodeVisualizationService";
import { ProgressiveLoadingIndicator } from "../../components/ProgressiveLoadingIndicator";
import { InteractiveDiagramComponent } from "../../components/InteractiveDiagramComponent";
import type { DiagramData } from "../../types/visualization";

// Mock ReactFlow to avoid rendering issues in tests
jest.mock("reactflow", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: "dots" },
  MarkerType: { ArrowClosed: "arrowclosed" },
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
}));

describe("Performance Integration Tests", () => {
  let visualizationService: CodeVisualizationService;

  beforeEach(() => {
    visualizationService = new CodeVisualizationService();
    jest.clearAllMocks();
  });

  describe("CodeVisualizationService Performance", () => {
    it("should handle simple code quickly", async () => {
      const simpleCode = `
        const greeting = "Hello World";
        console.log(greeting);
      `;

      const startTime = performance.now();
      const result = await visualizationService.visualizeCode(simpleCode);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics!.complexity.level).toBe("simple");
    });

    it("should apply timeout to complex code processing", async () => {
      // Configure service with very short timeout for testing
      const performanceService = visualizationService.getPerformanceService();
      performanceService.updateConfig({ maxProcessingTime: 100 });

      const complexCode = `
        // This is a complex code sample that might take time to process
        ${Array.from(
          { length: 100 },
          (_, i) => `
          function component${i}() {
            const [state${i}, setState${i}] = useState(${i});
            useEffect(() => {
              fetch('/api/data${i}').then(response => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error('Failed to fetch');
                }
              }).then(data => setState${i}(data));
            }, []);
            return <div>{state${i}}</div>;
          }
        `
        ).join("\n")}
      `;

      const result = await visualizationService.visualizeCode(complexCode);

      // Should either succeed quickly or fail with timeout
      if (!result.success) {
        expect(
          result.errors.some(
            (error) =>
              error.message.includes("timeout") ||
              error.message.includes("complex")
          )
        ).toBe(true);
      }
    });

    it("should reject code that is too large", async () => {
      // Generate very large code that exceeds limits
      const veryLargeCode = Array.from(
        { length: 3000 },
        (_, i) => `const variable${i} = "value${i}";`
      ).join("\n");

      const result = await visualizationService.visualizeCode(veryLargeCode);

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe("CODE_TOO_COMPLEX");
      expect(result.errors[0].message).toContain("too complex");
      expect(result.performanceMetrics).toBeDefined();
    });

    it("should provide performance metrics", async () => {
      const code = `
        function Counter() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
        }
      `;

      const result = await visualizationService.visualizeCode(code);

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics!.startTime).toBeGreaterThan(0);
      expect(result.performanceMetrics!.endTime).toBeGreaterThan(
        result.performanceMetrics!.startTime
      );
      expect(result.performanceMetrics!.duration).toBeGreaterThan(0);
      expect(result.performanceMetrics!.complexity).toBeDefined();
      expect(result.performanceMetrics!.stageTimings).toBeDefined();
    });

    it("should optimize large diagrams", async () => {
      // Mock a scenario that would generate many nodes
      const codeWithManyPatterns = `
        ${Array.from(
          { length: 50 },
          (_, i) => `
          function Component${i}() {
            const [state${i}, setState${i}] = useState(${i});
            const handleClick${i} = () => setState${i}(state${i} + 1);
            return <button onClick={handleClick${i}}>Button {state${i}}</button>;
          }
        `
        ).join("\n")}
      `;

      const result = await visualizationService.visualizeCode(
        codeWithManyPatterns
      );

      if (result.success && result.optimizations) {
        expect(result.optimizations.length).toBeGreaterThan(0);
        expect(
          result.optimizations.some((opt) => opt.includes("Reduced nodes"))
        ).toBe(true);
      }
    });
  });

  describe("ProgressiveLoadingIndicator", () => {
    it("should display complexity information", () => {
      const complexity = {
        lines: 150,
        functions: 8,
        variables: 12,
        nestingDepth: 4,
        imports: 3,
        reactHooks: 5,
        estimatedProcessingTime: 5000,
        level: "medium" as const,
      };

      render(
        <ProgressiveLoadingIndicator
          currentStage="pattern-recognition"
          progress={50}
          complexity={complexity}
          warnings={["Medium-sized code file"]}
        />
      );

      expect(screen.getByText("Recognizing patterns...")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument(); // lines
      expect(screen.getByText("8")).toBeInTheDocument(); // functions
      expect(screen.getByText("medium")).toBeInTheDocument(); // complexity level
      expect(screen.getByText("Medium-sized code file")).toBeInTheDocument();
    });

    it("should show performance tips for very complex code", () => {
      const veryComplexComplexity = {
        lines: 800,
        functions: 25,
        variables: 50,
        nestingDepth: 8,
        imports: 10,
        reactHooks: 15,
        estimatedProcessingTime: 15000,
        level: "very-complex" as const,
      };

      render(
        <ProgressiveLoadingIndicator
          currentStage="visualization"
          progress={75}
          complexity={veryComplexComplexity}
        />
      );

      expect(screen.getByText("Performance Tips:")).toBeInTheDocument();
      expect(
        screen.getByText(/Large code files may have simplified visualizations/)
      ).toBeInTheDocument();
    });

    it("should handle cancellation", () => {
      const onCancel = jest.fn();

      render(
        <ProgressiveLoadingIndicator
          currentStage="parsing"
          progress={25}
          canCancel={true}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it("should show estimated time remaining", () => {
      render(
        <ProgressiveLoadingIndicator
          currentStage="visualization"
          progress={60}
          estimatedTimeRemaining={3000}
        />
      );

      expect(screen.getByText(/Est\. remaining: 3s/)).toBeInTheDocument();
    });
  });

  describe("InteractiveDiagramComponent Performance", () => {
    const createLargeDiagram = (nodeCount: number): DiagramData => ({
      nodes: Array.from({ length: nodeCount }, (_, i) => ({
        id: `node-${i}`,
        type: "button",
        position: { x: i * 100, y: Math.floor(i / 10) * 100 },
        icon: "Play",
        label: `Node ${i}`,
        explanation: `This is node ${i}`,
        metadata: { confidence: 0.8 },
      })),
      edges: Array.from({ length: Math.min(nodeCount - 1, 50) }, (_, i) => ({
        id: `edge-${i}`,
        source: `node-${i}`,
        target: `node-${i + 1}`,
        label: "connects to",
        type: "action",
        color: "#3b82f6",
        animated: false,
      })),
      layout: { direction: "horizontal" },
    });

    it("should handle small diagrams normally", () => {
      const smallDiagram = createLargeDiagram(10);

      render(
        <InteractiveDiagramComponent
          diagramData={smallDiagram}
          onNodeClick={jest.fn()}
          onEdgeClick={jest.fn()}
        />
      );

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("minimap")).toBeInTheDocument();
      expect(
        screen.queryByText(/Large diagram detected/)
      ).not.toBeInTheDocument();
    });

    it("should show performance warning for large diagrams", () => {
      const largeDiagram = createLargeDiagram(60);

      render(
        <InteractiveDiagramComponent
          diagramData={largeDiagram}
          onNodeClick={jest.fn()}
          onEdgeClick={jest.fn()}
        />
      );

      expect(
        screen.getByText(/Large diagram detected \(60 nodes\)/)
      ).toBeInTheDocument();
      expect(screen.queryByTestId("minimap")).not.toBeInTheDocument(); // Should be hidden for performance
    });

    it("should show loading state", () => {
      const diagram = createLargeDiagram(5);

      render(
        <InteractiveDiagramComponent diagramData={diagram} isLoading={true} />
      );

      expect(screen.getByText("Generating diagram...")).toBeInTheDocument();
      expect(screen.queryByTestId("react-flow")).not.toBeInTheDocument();
    });

    it("should show empty state when no nodes", () => {
      const emptyDiagram: DiagramData = {
        nodes: [],
        edges: [],
        layout: { direction: "horizontal" },
      };

      render(<InteractiveDiagramComponent diagramData={emptyDiagram} />);

      expect(screen.getByText("No patterns found")).toBeInTheDocument();
      expect(
        screen.getByText(/Try pasting some JavaScript or TypeScript code/)
      ).toBeInTheDocument();
    });
  });

  describe("End-to-End Performance Flow", () => {
    it("should complete full visualization flow with performance monitoring", async () => {
      const code = `
        import React, { useState } from 'react';
        
        function App() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('');
          
          const handleIncrement = () => {
            setCount(prev => prev + 1);
          };
          
          const handleNameChange = (e) => {
            setName(e.target.value);
          };
          
          return (
            <div>
              <h1>Hello {name}</h1>
              <button onClick={handleIncrement}>
                Count: {count}
              </button>
              <input 
                value={name} 
                onChange={handleNameChange}
                placeholder="Enter your name"
              />
            </div>
          );
        }
      `;

      const progressUpdates: Array<{ stage: string; progress: number }> = [];

      const result = await visualizationService.visualizeCode(
        code,
        (stage, progress) => {
          progressUpdates.push({ stage, progress });
        }
      );

      expect(result.success).toBe(true);
      expect(result.diagramData).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();

      // Should have received progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some((update) => update.stage === "parsing")).toBe(
        true
      );
      expect(
        progressUpdates.some((update) => update.stage === "pattern-recognition")
      ).toBe(true);
      expect(
        progressUpdates.some((update) => update.stage === "visualization")
      ).toBe(true);

      // Performance metrics should be populated
      const metrics = result.performanceMetrics!;
      expect(metrics.complexity.level).toBe("medium");
      expect(metrics.duration).toBeGreaterThan(0);
      expect(Object.keys(metrics.stageTimings).length).toBeGreaterThan(0);
    });
  });
});
