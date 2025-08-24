import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ErrorDisplay,
  ErrorList,
  WarningDisplay,
} from "../../components/ErrorDisplay";
import type { UserFriendlyError } from "../../types/errors";

describe("ErrorDisplay", () => {
  const mockError: UserFriendlyError = {
    code: "TEST_ERROR",
    message: "Test error message",
    description: "This is a test error description",
    suggestions: ["Try this", "Try that"],
    severity: "medium",
    context: {
      component: "TestComponent",
      operation: "testOperation",
    },
  };

  it("should render error message and description", () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(
      screen.getByText("This is a test error description")
    ).toBeInTheDocument();
  });

  it("should render suggestions", () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText("Suggestions:")).toBeInTheDocument();
    expect(screen.getByText("Try this")).toBeInTheDocument();
    expect(screen.getByText("Try that")).toBeInTheDocument();
  });

  it("should show retry button when enabled", () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay error={mockError} showRetry onRetry={onRetry} />);

    const retryButton = screen.getByText("Try Again");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should show dismiss button when enabled", () => {
    const onDismiss = vi.fn();
    render(
      <ErrorDisplay error={mockError} showDismiss onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByLabelText("Dismiss error");
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should show error details when enabled", () => {
    render(<ErrorDisplay error={mockError} showDetails />);

    expect(screen.getByText("Technical Details:")).toBeInTheDocument();
    expect(screen.getByText(/Component: TestComponent/)).toBeInTheDocument();
    expect(screen.getByText(/Operation: testOperation/)).toBeInTheDocument();
  });

  it("should apply correct styling for different severity levels", () => {
    const criticalError: UserFriendlyError = {
      ...mockError,
      severity: "critical",
    };

    const { rerender } = render(<ErrorDisplay error={criticalError} />);
    // Check the root container div, not the text element
    const container = screen
      .getByText("Test error message")
      .closest(".rounded-lg");
    expect(container).toHaveClass("bg-red-50");

    const lowError: UserFriendlyError = {
      ...mockError,
      severity: "low",
    };

    rerender(<ErrorDisplay error={lowError} />);
    const lowContainer = screen
      .getByText("Test error message")
      .closest(".rounded-lg");
    expect(lowContainer).toHaveClass("bg-blue-50");
  });

  it("should show original error when present", () => {
    const errorWithOriginal: UserFriendlyError = {
      ...mockError,
      originalError: new Error("Original error message"),
    };

    render(<ErrorDisplay error={errorWithOriginal} showDetails />);

    expect(
      screen.getByText("Error: Original error message")
    ).toBeInTheDocument();
  });
});

describe("ErrorList", () => {
  const mockErrors: UserFriendlyError[] = [
    {
      code: "ERROR_1",
      message: "First error",
      description: "First error description",
      suggestions: ["Fix first"],
      severity: "high",
      context: { component: "Component1", operation: "op1" },
    },
    {
      code: "ERROR_2",
      message: "Second error",
      description: "Second error description",
      suggestions: ["Fix second"],
      severity: "medium",
      context: { component: "Component2", operation: "op2" },
    },
  ];

  it("should render multiple errors", () => {
    render(<ErrorList errors={mockErrors} />);

    expect(screen.getByText("First error")).toBeInTheDocument();
    expect(screen.getByText("Second error")).toBeInTheDocument();
  });

  it("should handle retry for specific errors", () => {
    const onRetry = vi.fn();
    render(<ErrorList errors={mockErrors} showRetry onRetry={onRetry} />);

    const retryButtons = screen.getAllByText("Try Again");
    expect(retryButtons).toHaveLength(2);

    fireEvent.click(retryButtons[0]);
    expect(onRetry).toHaveBeenCalledWith(mockErrors[0]);
  });

  it("should handle dismiss for specific errors", () => {
    const onDismiss = vi.fn();
    render(<ErrorList errors={mockErrors} showDismiss onDismiss={onDismiss} />);

    const dismissButtons = screen.getAllByLabelText("Dismiss error");
    expect(dismissButtons).toHaveLength(2);

    fireEvent.click(dismissButtons[1]);
    expect(onDismiss).toHaveBeenCalledWith(mockErrors[1]);
  });

  it("should limit number of displayed errors", () => {
    const manyErrors = Array.from({ length: 10 }, (_, i) => ({
      ...mockErrors[0],
      code: `ERROR_${i}`,
      message: `Error ${i}`,
    }));

    render(<ErrorList errors={manyErrors} maxErrors={3} />);

    expect(screen.getByText("Error 0")).toBeInTheDocument();
    expect(screen.getByText("Error 2")).toBeInTheDocument();
    expect(screen.queryByText("Error 3")).not.toBeInTheDocument();
    expect(screen.getByText("... and 7 more errors")).toBeInTheDocument();
  });

  it("should render nothing when no errors", () => {
    const { container } = render(<ErrorList errors={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("WarningDisplay", () => {
  it("should render warning message", () => {
    render(<WarningDisplay message="Test warning" />);

    expect(screen.getByText("Test warning")).toBeInTheDocument();
  });

  it("should render additional warnings", () => {
    const warnings = ["Warning 1", "Warning 2"];
    render(<WarningDisplay message="Main warning" warnings={warnings} />);

    expect(screen.getByText("Main warning")).toBeInTheDocument();
    expect(screen.getByText("Warning 1")).toBeInTheDocument();
    expect(screen.getByText("Warning 2")).toBeInTheDocument();
  });

  it("should show dismiss button when dismissible", () => {
    const onDismiss = vi.fn();
    render(
      <WarningDisplay
        message="Dismissible warning"
        dismissible
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByLabelText("Dismiss warning");
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should not show dismiss button when not dismissible", () => {
    render(<WarningDisplay message="Non-dismissible warning" />);

    expect(screen.queryByLabelText("Dismiss warning")).not.toBeInTheDocument();
  });
});
