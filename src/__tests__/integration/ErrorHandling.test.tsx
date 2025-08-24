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

  it("should render the app without errors", () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    expect(screen.getByText("Ghee")).toBeInTheDocument();
  });
});
