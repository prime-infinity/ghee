import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CodeInputComponent } from "../CodeInputComponent";
import type { UserFriendlyError } from "../../types";

describe("CodeInputComponent Integration", () => {
  it("handles complete user workflow", async () => {
    const user = userEvent.setup();
    const mockOnCodeSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    // Start with empty component
    const { rerender } = render(
      <CodeInputComponent
        onCodeSubmit={mockOnCodeSubmit}
        isProcessing={false}
      />
    );

    // User types code
    const textarea = screen.getByPlaceholderText(/Paste your code here/);
    await user.type(textarea, "const x = 1;");

    // Verify code is entered and validation shows success
    expect(textarea).toHaveValue("const x = 1;");
    expect(screen.getByText("Code looks good!")).toBeInTheDocument();

    // User clicks visualize button
    const visualizeButton = screen.getByRole("button", {
      name: /Visualize Code/,
    });
    await user.click(visualizeButton);

    // Verify callback was called
    expect(mockOnCodeSubmit).toHaveBeenCalledWith("const x = 1;");

    // Simulate processing state
    rerender(
      <CodeInputComponent
        onCodeSubmit={mockOnCodeSubmit}
        isProcessing={true}
        onCancel={mockOnCancel}
      />
    );

    // Verify processing UI
    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("Analyzing your code...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();

    // User cancels processing
    const cancelButton = screen.getByRole("button", { name: /Cancel/ });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("handles error workflow", async () => {
    const user = userEvent.setup();
    const mockOnCodeSubmit = vi.fn();

    const validationErrors: UserFriendlyError[] = [
      {
        code: "SYNTAX_ERROR",
        message: "Syntax Error",
        description: "Missing semicolon at end of statement",
        suggestions: [
          "Add a semicolon (;) at the end of line 1",
          "Check for missing brackets or parentheses",
        ],
        severity: "high",
      },
    ];

    render(
      <CodeInputComponent
        onCodeSubmit={mockOnCodeSubmit}
        isProcessing={false}
        isValid={false}
        validationErrors={validationErrors}
      />
    );

    // User types invalid code
    const textarea = screen.getByPlaceholderText(/Paste your code here/);
    await user.type(textarea, "const x = 1");

    // Verify error display
    expect(screen.getByText("Syntax Error")).toBeInTheDocument();
    expect(
      screen.getByText("Missing semicolon at end of statement")
    ).toBeInTheDocument();
    expect(
      screen.getByText("• Add a semicolon (;) at the end of line 1")
    ).toBeInTheDocument();
    expect(
      screen.getByText("• Check for missing brackets or parentheses")
    ).toBeInTheDocument();

    // Verify error styling
    expect(textarea).toHaveClass("border-red-300", "bg-red-50");

    // Button should still be enabled (let backend handle validation)
    const visualizeButton = screen.getByRole("button", {
      name: /Visualize Code/,
    });
    expect(visualizeButton).toBeEnabled();
  });

  it("handles keyboard shortcuts", async () => {
    const user = userEvent.setup();
    const mockOnCodeSubmit = vi.fn();

    render(
      <CodeInputComponent
        onCodeSubmit={mockOnCodeSubmit}
        isProcessing={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/Paste your code here/);

    // Focus textarea and type code using fireEvent to avoid userEvent issues
    await user.click(textarea);
    fireEvent.change(textarea, {
      target: { value: "function test() { return 42; }" },
    });

    // Use Ctrl+Enter to submit
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(mockOnCodeSubmit).toHaveBeenCalledWith(
      "function test() { return 42; }"
    );
  });

  it("handles responsive behavior", () => {
    const mockOnCodeSubmit = vi.fn();

    render(
      <CodeInputComponent
        onCodeSubmit={mockOnCodeSubmit}
        isProcessing={false}
      />
    );

    // Find the main container (parent of the h2)
    const container = screen
      .getByText("Code Visualizer")
      .closest("div")?.parentElement;
    expect(container).toHaveClass("max-w-4xl", "mx-auto");

    const textarea = screen.getByPlaceholderText(/Paste your code here/);
    expect(textarea).toHaveClass("w-full", "resize-y");
  });

  it("handles accessibility features", async () => {
    const user = userEvent.setup();
    const mockOnCodeSubmit = vi.fn();

    render(
      <CodeInputComponent
        onCodeSubmit={mockOnCodeSubmit}
        isProcessing={false}
      />
    );

    // Test keyboard navigation
    await user.tab();
    const textarea = screen.getByPlaceholderText(/Paste your code here/);
    expect(textarea).toHaveFocus();

    // Add some text to enable the button
    fireEvent.change(textarea, { target: { value: "const x = 1;" } });

    await user.tab();
    const button = screen.getByRole("button", { name: /Visualize Code/ });
    expect(button).toHaveFocus();

    // Test ARIA attributes and semantic HTML
    expect(textarea).toHaveAttribute("spellCheck", "false");
    expect(textarea).toHaveAttribute("autoComplete", "off");
    // Button defaults to type="button" in React, no need to explicitly test
  });
});
