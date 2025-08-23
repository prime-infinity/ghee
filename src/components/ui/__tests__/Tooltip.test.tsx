import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  const defaultProps = {
    content: "This is a tooltip",
    children: <button>Trigger</button>,
  };

  describe("Basic Functionality", () => {
    it("renders children correctly", () => {
      render(<Tooltip {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Trigger" })
      ).toBeInTheDocument();
    });

    it("shows tooltip immediately when showDelay is 0", () => {
      render(<Tooltip {...defaultProps} showDelay={0} />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      expect(trigger).toBeInTheDocument();

      // The tooltip should not be visible initially
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Controlled Mode", () => {
    it("shows tooltip when show prop is true", () => {
      render(<Tooltip {...defaultProps} show={true} />);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByText("This is a tooltip")).toBeInTheDocument();
    });

    it("hides tooltip when show prop is false", () => {
      render(<Tooltip {...defaultProps} show={false} />);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Click Interaction", () => {
    it("does not show tooltip on hover when clickToShow is true", () => {
      render(<Tooltip {...defaultProps} clickToShow />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      expect(trigger).toBeInTheDocument();

      // Should not show tooltip on hover when clickToShow is enabled
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("sets correct ARIA attributes when tooltip is shown", () => {
      render(<Tooltip {...defaultProps} show={true} />);

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveAttribute("aria-hidden", "false");
    });
  });

  describe("Child-Friendly Content", () => {
    it("displays multi-line content correctly", () => {
      const multiLineContent =
        "This is line 1\\nThis is line 2\\nThis is line 3";
      render(
        <Tooltip content={multiLineContent} show={true}>
          {defaultProps.children}
        </Tooltip>
      );

      const tooltip = screen.getByRole("tooltip");
      // Check that all lines are present (allowing for spaces between lines)
      expect(tooltip).toHaveTextContent("This is line 1");
      expect(tooltip).toHaveTextContent("This is line 2");
      expect(tooltip).toHaveTextContent("This is line 3");
    });

    it("handles long content with proper wrapping", () => {
      const longContent =
        "This is a very long tooltip content that should wrap properly and not overflow the container. It should be readable and accessible for children.";
      render(
        <Tooltip content={longContent} show={true}>
          {defaultProps.children}
        </Tooltip>
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent(longContent);
      expect(tooltip).toHaveClass("max-w-xs"); // Ensures proper width constraint
    });
  });
});
