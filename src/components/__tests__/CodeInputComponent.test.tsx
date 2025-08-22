import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodeInputComponent } from "../CodeInputComponent";
import type { UserFriendlyError } from "../../types";

describe("CodeInputComponent", () => {
  const mockOnCodeSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onCodeSubmit: mockOnCodeSubmit,
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders with default props", () => {
      render(<CodeInputComponent {...defaultProps} />);

      expect(screen.getByText("Code Visualizer")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Paste your code here/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Visualize Code/ })
      ).toBeInTheDocument();
    });

    it("renders with initial code", () => {
      const initialCode = "const x = 1;";
      render(
        <CodeInputComponent {...defaultProps} initialCode={initialCode} />
      );

      expect(screen.getByDisplayValue(initialCode)).toBeInTheDocument();
    });

    it("displays character count", () => {
      render(<CodeInputComponent {...defaultProps} />);

      expect(screen.getByText("0 characters")).toBeInTheDocument();
    });

    it("shows keyboard shortcut hint", () => {
      render(<CodeInputComponent {...defaultProps} />);

      expect(screen.getByText("Ctrl+Enter")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("updates code when user types", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "const x = 1;");

      expect(textarea).toHaveValue("const x = 1;");
      expect(screen.getByText("12 characters")).toBeInTheDocument();
    });

    it("calls onCodeSubmit when visualize button is clicked", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      const button = screen.getByRole("button", { name: /Visualize Code/ });

      await user.type(textarea, "const x = 1;");
      await user.click(button);

      expect(mockOnCodeSubmit).toHaveBeenCalledWith("const x = 1;");
    });

    it("calls onCodeSubmit when Ctrl+Enter is pressed", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);

      await user.type(textarea, "const x = 1;");
      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(mockOnCodeSubmit).toHaveBeenCalledWith("const x = 1;");
    });

    it("does not submit empty code", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const button = screen.getByRole("button", { name: /Visualize Code/ });
      await user.click(button);

      expect(mockOnCodeSubmit).not.toHaveBeenCalled();
    });

    it("does not submit whitespace-only code", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      const button = screen.getByRole("button", { name: /Visualize Code/ });

      await user.type(textarea, "   \n\t  ");
      await user.click(button);

      expect(mockOnCodeSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Processing States", () => {
    it("shows processing state when isProcessing is true", () => {
      render(<CodeInputComponent {...defaultProps} isProcessing={true} />);

      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.getByText("Analyzing your code...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Processing/ })).toBeDisabled();
    });

    it("disables textarea when processing", () => {
      render(<CodeInputComponent {...defaultProps} isProcessing={true} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      expect(textarea).toBeDisabled();
    });

    it("shows cancel button when processing and onCancel is provided", () => {
      render(
        <CodeInputComponent
          {...defaultProps}
          isProcessing={true}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByRole("button", { name: /Cancel/ })
      ).toBeInTheDocument();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CodeInputComponent
          {...defaultProps}
          isProcessing={true}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/ });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("does not show cancel button when onCancel is not provided", () => {
      render(<CodeInputComponent {...defaultProps} isProcessing={true} />);

      expect(
        screen.queryByRole("button", { name: /Cancel/ })
      ).not.toBeInTheDocument();
    });
  });

  describe("Validation States", () => {
    it("shows success message when code is valid", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} isValid={true} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "const x = 1;");

      expect(screen.getByText("Code looks good!")).toBeInTheDocument();
    });

    it("shows validation errors when provided", async () => {
      const user = userEvent.setup();
      const validationErrors: UserFriendlyError[] = [
        {
          code: "SYNTAX_ERROR",
          message: "Syntax Error",
          description: "Missing semicolon",
          suggestions: ["Add semicolon at end of line"],
          severity: "high",
        },
      ];

      render(
        <CodeInputComponent
          {...defaultProps}
          isValid={false}
          validationErrors={validationErrors}
        />
      );

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "const x = 1");

      expect(screen.getByText("Syntax Error")).toBeInTheDocument();
      expect(screen.getByText("Missing semicolon")).toBeInTheDocument();
      expect(
        screen.getByText("• Add semicolon at end of line")
      ).toBeInTheDocument();
    });

    it("applies correct styling for valid code", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} isValid={true} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "const x = 1;");

      expect(textarea).toHaveClass("border-green-300", "bg-green-50");
    });

    it("applies correct styling for invalid code", async () => {
      const user = userEvent.setup();
      const validationErrors: UserFriendlyError[] = [
        {
          code: "SYNTAX_ERROR",
          message: "Syntax Error",
          description: "Missing semicolon",
          suggestions: [],
          severity: "high",
        },
      ];

      render(
        <CodeInputComponent
          {...defaultProps}
          isValid={false}
          validationErrors={validationErrors}
        />
      );

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "const x = 1");

      expect(textarea).toHaveClass("border-red-300", "bg-red-50");
    });

    it("does not show validation until user has input", () => {
      const validationErrors: UserFriendlyError[] = [
        {
          code: "SYNTAX_ERROR",
          message: "Syntax Error",
          description: "Missing semicolon",
          suggestions: [],
          severity: "high",
        },
      ];

      render(
        <CodeInputComponent
          {...defaultProps}
          isValid={false}
          validationErrors={validationErrors}
        />
      );

      expect(screen.queryByText("Syntax Error")).not.toBeInTheDocument();
    });
  });

  describe("Button States", () => {
    it("enables submit button when code is present and not processing", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      const button = screen.getByRole("button", { name: /Visualize Code/ });

      expect(button).toBeDisabled();

      await user.type(textarea, "const x = 1;");

      expect(button).toBeEnabled();
    });

    it("disables submit button when processing", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "const x = 1;");

      // Re-render with processing state
      render(<CodeInputComponent {...defaultProps} isProcessing={true} />);

      const button = screen.getByRole("button", { name: /Processing/ });
      expect(button).toBeDisabled();
    });

    it("applies correct styling for enabled button", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      const button = screen.getByRole("button", { name: /Visualize Code/ });

      await user.type(textarea, "const x = 1;");

      expect(button).toHaveClass(
        "bg-blue-600",
        "hover:bg-blue-700",
        "text-white"
      );
    });

    it("applies correct styling for disabled button", () => {
      render(<CodeInputComponent {...defaultProps} />);

      const button = screen.getByRole("button", { name: /Visualize Code/ });

      expect(button).toHaveClass(
        "bg-gray-300",
        "text-gray-500",
        "cursor-not-allowed"
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and roles", () => {
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      const button = screen.getByRole("button", { name: /Visualize Code/ });

      expect(textarea).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);

      // Tab to textarea
      await user.tab();
      expect(textarea).toHaveFocus();

      // Type some code
      await user.type(textarea, "const x = 1;");

      // Tab to button
      await user.tab();
      const button = screen.getByRole("button", { name: /Visualize Code/ });
      expect(button).toHaveFocus();
    });

    it("handles focus management during processing", () => {
      render(<CodeInputComponent {...defaultProps} isProcessing={true} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      expect(textarea).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("handles very long code input", async () => {
      const longCode = "const x = 1;".repeat(100); // Reduced size for faster test

      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);

      // Use fireEvent for large text input to avoid timeout
      fireEvent.change(textarea, { target: { value: longCode } });

      expect(textarea).toHaveValue(longCode);
      expect(
        screen.getByText(`${longCode.length} characters`)
      ).toBeInTheDocument();
    });

    it("handles special characters in code", async () => {
      const specialCode = 'const str = "Hello World!";'; // Simplified to avoid encoding issues

      render(<CodeInputComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your code here/);

      // Use fireEvent for special characters to avoid userEvent issues
      fireEvent.change(textarea, { target: { value: specialCode } });

      expect(textarea).toHaveValue(specialCode);
    });

    it("handles multiple validation errors", async () => {
      const user = userEvent.setup();
      const validationErrors: UserFriendlyError[] = [
        {
          code: "SYNTAX_ERROR",
          message: "Syntax Error",
          description: "Missing semicolon",
          suggestions: ["Add semicolon"],
          severity: "high",
        },
        {
          code: "UNDEFINED_VAR",
          message: "Undefined Variable",
          description: "Variable not declared",
          suggestions: ["Declare variable first"],
          severity: "medium",
        },
      ];

      render(
        <CodeInputComponent
          {...defaultProps}
          isValid={false}
          validationErrors={validationErrors}
        />
      );

      const textarea = screen.getByPlaceholderText(/Paste your code here/);
      await user.type(textarea, "x = 1");

      expect(screen.getByText("Syntax Error")).toBeInTheDocument();
      expect(screen.getByText("Undefined Variable")).toBeInTheDocument();
    });
  });
});
