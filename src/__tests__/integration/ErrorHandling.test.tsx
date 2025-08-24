import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "../../contexts/AppContext";
import { CodeVisualizationService } from "../../services/CodeVisualizationService";
import { ErrorHandlerService } from "../../services/ErrorHandlerService";
import App from "../../App";

// Mock the services
vi.mock("../../services/CodeVisualizationService", () => {
  const mockPerformanceService = {
    shouldProcessCode: vi.fn().mockReturnValue({
      shouldProcess: true,
      warnings: [],
      suggestions: [],
    }),
    analyzeCodeComplexity: vi.fn().mockReturnValue({
      lines: 1,
      functions: 0,
      variables: 1,
      nestingDepth: 1,
      imports: 0,
      reactHooks: 0,
      estimatedProcessingTime: 1000,
      level: "simple",
    }),
  };

  return {
    CodeVisualizationService: vi.fn().mockImplementation(() => ({
      visualizeCode: vi.fn().mockResolvedValue({
        success: true,
        diagramData: {
          nodes: [],
          edges: [],
          layout: {
            direction: "horizontal",
            spacing: { x: 150, y: 100 },
          },
        },
        errors: [],
      }),
      getPerformanceService: vi.fn().mockReturnValue(mockPerformanceService),
      analyzeCodeComplexity: vi.fn().mockReturnValue({
        lines: 1,
        functions: 0,
        variables: 1,
        nestingDepth: 1,
        imports: 0,
        reactHooks: 0,
        estimatedProcessingTime: 1000,
        level: "simple",
      }),
      processing: false,
      cancelProcessing: vi.fn(),
    })),
  };
});

vi.mock("../../services/ErrorHandlerService");

const MockedCodeVisualizationService =
  CodeVisualizationService as vi.MockedClass<typeof CodeVisualizationService>;
const MockedErrorHandlerService = ErrorHandlerService as vi.MockedClass<
  typeof ErrorHandlerService
>;

describe("Error Handling Integration", () => {
  let mockVisualizationService: vi.Mocked<CodeVisualizationService>;
  let mockErrorHandler: vi.Mocked<ErrorHandlerService>;

  beforeEach(() => {
    mockVisualizationService =
      new MockedCodeVisualizationService() as vi.Mocked<CodeVisualizationService>;
    mockErrorHandler =
      new MockedErrorHandlerService() as vi.Mocked<ErrorHandlerService>;

    // Reset mocks
    vi.clearAllMocks();
  });

  it("should handle syntax errors gracefully", async () => {
    const syntaxError = {
      code: "PARSE_ERROR_SYNTAX",
      message: "Code has syntax errors",
      description: "Unexpected token at line 1, column 5",
      suggestions: ["Check for missing semicolon", "Verify bracket closure"],
      severity: "high" as const,
      context: {
        component: "ASTParserService",
        operation: "parseCode",
        line: 1,
        column: 5,
      },
    };

    mockVisualizationService.visualizeCode.mockResolvedValue({
      success: false,
      errors: [syntaxError],
    });

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Enter invalid code
    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, { target: { value: "invalid syntax {" } });

    // Submit code
    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText("Code has syntax errors")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Unexpected token at line 1, column 5")
    ).toBeInTheDocument();
    expect(screen.getByText("Check for missing semicolon")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("should show fallback visualization when patterns fail", async () => {
    const fallbackResult = {
      success: true,
      diagramData: {
        nodes: [
          {
            id: "fallback-node",
            type: "component" as const,
            position: { x: 100, y: 100 },
            data: {
              label: "Basic Code Structure",
              icon: "Code",
              explanation: "Simplified code visualization",
              properties: { fallback: true },
            },
          },
        ],
        edges: [],
        layout: {
          direction: "horizontal" as const,
          spacing: { x: 150, y: 100 },
        },
      },
      errors: [],
      warnings: [
        "Showing basic code structure. Some advanced patterns may not be visualized.",
      ],
      fallbackUsed: true,
    };

    mockVisualizationService.visualizeCode.mockResolvedValue(fallbackResult);

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Enter code that triggers fallback
    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, {
      target: { value: 'function test() { console.log("test"); }' },
    });

    // Submit code
    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    // Wait for visualization to appear
    await waitFor(() => {
      expect(screen.getByText("Code Visualization")).toBeInTheDocument();
    });

    // Should show the diagram even with fallback
    expect(mockVisualizationService.visualizeCode).toHaveBeenCalledWith(
      'function test() { console.log("test"); }',
      expect.any(Function)
    );
  });

  it("should handle network/timeout errors with retry", async () => {
    const timeoutError = {
      code: "CODEVISUALIZATIONSERVICE_TIMEOUT_ERROR",
      message: "Operation timed out",
      description:
        "Operation timeout while performing visualizeCode in CodeVisualizationService",
      suggestions: [
        "Try with smaller or simpler code",
        "Check your internet connection",
      ],
      severity: "high" as const,
      context: {
        component: "CodeVisualizationService",
        operation: "visualizeCode",
      },
    };

    // First call fails, second succeeds
    mockVisualizationService.visualizeCode
      .mockRejectedValueOnce(new Error("Operation timeout"))
      .mockResolvedValueOnce({
        success: true,
        diagramData: {
          nodes: [],
          edges: [],
          layout: { direction: "horizontal", spacing: { x: 150, y: 100 } },
        },
        errors: [],
      });

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, { target: { value: "const x = 1;" } });

    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to process code/i)).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText("Code Visualization")).toBeInTheDocument();
    });

    expect(mockVisualizationService.visualizeCode).toHaveBeenCalledTimes(2);
  });

  it("should handle memory errors without retry", async () => {
    const memoryError = {
      code: "CODEVISUALIZATIONSERVICE_MEMORY_ERROR",
      message: "Not enough memory to complete operation",
      description:
        "Out of memory while performing visualizeCode in CodeVisualizationService",
      suggestions: [
        "Try with smaller code samples",
        "Close other browser tabs to free memory",
      ],
      severity: "critical" as const,
      context: {
        component: "CodeVisualizationService",
        operation: "visualizeCode",
      },
    };

    mockVisualizationService.visualizeCode.mockRejectedValue(
      new Error("Out of memory")
    );

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, {
      target: { value: "const largeArray = new Array(1000000);" },
    });

    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to process code/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText("Try with smaller code samples")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Close other browser tabs to free memory")
    ).toBeInTheDocument();
  });

  it("should show processing stages during visualization", async () => {
    let progressCallback:
      | ((stage: string, progress: number) => void)
      | undefined;

    mockVisualizationService.visualizeCode.mockImplementation(
      (code, callback) => {
        progressCallback = callback;
        return new Promise((resolve) => {
          setTimeout(() => {
            progressCallback?.("parsing", 33);
            setTimeout(() => {
              progressCallback?.("pattern-recognition", 66);
              setTimeout(() => {
                progressCallback?.("visualization", 100);
                resolve({
                  success: true,
                  diagramData: {
                    nodes: [],
                    edges: [],
                    layout: {
                      direction: "horizontal",
                      spacing: { x: 150, y: 100 },
                    },
                  },
                  errors: [],
                });
              }, 100);
            }, 100);
          }, 100);
        });
      }
    );

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, { target: { value: "const x = 1;" } });

    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    // Check parsing stage
    await waitFor(() => {
      expect(screen.getByText("Parsing your code...")).toBeInTheDocument();
    });

    // Check pattern recognition stage
    await waitFor(() => {
      expect(screen.getByText("Recognizing patterns...")).toBeInTheDocument();
    });

    // Check visualization stage
    await waitFor(() => {
      expect(
        screen.getByText("Generating visualization...")
      ).toBeInTheDocument();
    });

    // Check completion
    await waitFor(() => {
      expect(screen.getByText("Code Visualization")).toBeInTheDocument();
    });
  });

  it("should handle cancellation during processing", async () => {
    mockVisualizationService.visualizeCode.mockImplementation(() => {
      return new Promise(() => {
        // Never resolve to simulate long-running operation
      });
    });

    mockVisualizationService.cancelProcessing = vi.fn();

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, { target: { value: "const x = 1;" } });

    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    // Wait for processing to start
    await waitFor(() => {
      expect(screen.getByText("Parsing your code...")).toBeInTheDocument();
    });

    // Cancel processing
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(mockVisualizationService.cancelProcessing).toHaveBeenCalled();
  });

  it("should dismiss errors when requested", async () => {
    const error = {
      code: "TEST_ERROR",
      message: "Test error",
      description: "Test error description",
      suggestions: ["Test suggestion"],
      severity: "medium" as const,
      context: {
        component: "TestComponent",
        operation: "testOperation",
      },
    };

    mockVisualizationService.visualizeCode.mockResolvedValue({
      success: false,
      errors: [error],
    });

    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    const codeInput = screen.getByPlaceholderText(
      /paste your javascript or typescript code here/i
    );
    fireEvent.change(codeInput, { target: { value: "invalid code" } });

    const submitButton = screen.getByText(/visualize code/i);
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    // Dismiss error
    const dismissButton = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissButton);

    // Error should be gone
    await waitFor(() => {
      expect(screen.queryByText("Test error")).not.toBeInTheDocument();
    });
  });
});
