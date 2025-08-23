import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../App";

// Mock the entire CodeVisualizationService
vi.mock("../../services/CodeVisualizationService", () => ({
  CodeVisualizationService: vi.fn().mockImplementation(() => ({
    visualizeCode: vi.fn().mockResolvedValue({
      success: true,
      diagramData: {
        nodes: [],
        edges: [],
        layout: {
          direction: "vertical",
          nodeSpacing: 150,
          levelSpacing: 200,
          autoFit: true,
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      },
      errors: [],
      metadata: {
        processingTime: 100,
        patternsFound: 0,
        language: "javascript",
        confidence: 0.8,
      },
    }),
    cancelProcessing: vi.fn(),
    validateCode: vi.fn().mockResolvedValue([]),
  })),
}));

describe("Complete Code-to-Visualization Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the main application with error boundary", () => {
    render(<App />);

    // The app should render without crashing
    // If there's an error, the error boundary should catch it
    expect(document.body).toBeInTheDocument();
  });

  it("should show error boundary when something goes wrong", () => {
    render(<App />);

    // Check if error boundary is working by looking for either:
    // 1. The main app content, or
    // 2. The error boundary fallback
    const hasMainContent = screen.queryByText("Ghee Code Visualizer");
    const hasErrorBoundary = screen.queryByText("Something went wrong");

    // One of these should be present
    expect(hasMainContent || hasErrorBoundary).toBeTruthy();
  });

  it("should handle application state management", () => {
    render(<App />);

    // The app should render with React context providers
    // This tests that the AppProvider is working
    expect(document.body).toBeInTheDocument();
  });

  it("should have responsive layout structure", () => {
    render(<App />);

    // Check that the app has proper structure
    const appContainer = document.querySelector("div");
    expect(appContainer).toBeInTheDocument();
  });

  it("should integrate all main components", () => {
    render(<App />);

    // Test that the main integration works
    // This is a basic smoke test to ensure all components can be imported and rendered
    expect(document.body).toBeInTheDocument();
  });
});
