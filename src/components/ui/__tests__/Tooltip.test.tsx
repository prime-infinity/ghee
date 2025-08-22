import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Tooltip } from "../Tooltip";
import { afterEach } from "node:test";
import { beforeEach } from "node:test";

// Mock timers for testing delays
vi.useFakeTimers();

describe("Tooltip", () => {
  const defaultProps = {
    content: "This is a tooltip",
    children: <button>Trigger</button>,
  };

  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe("Basic Functionality", () => {
    it("renders children correctly", () => {
      render(<Tooltip {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Trigger" })
      ).toBeInTheDocument();
    });

    it("shows tooltip on hover after delay", async () => {
      render(<Tooltip {...defaultProps} showDelay={100} />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      fireEvent.mouseEnter(trigger);

      // Tooltip should not be visible immediately
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      // Fast-forward time to trigger the delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByText("This is a tooltip")).toBeInTheDocument();
      });
    });

    it("hides tooltip on mouse leave after delay", async () => {
      render(<Tooltip {...defaultProps} showDelay={0} hideDelay={100} />);

      const trigger = screen.getByRole("button", { name: "Trigger" });

      // Show tooltip
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Hide tooltip
      fireEvent.mouseLeave(trigger);

      // Tooltip should still be visible during hide delay
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Fast-forward time to trigger the hide delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("shows tooltip immediately when showDelay is 0", async () => {
      render(<Tooltip {...defaultProps} showDelay={0} />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      fireEvent.mouseEnter(trigger);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });
  });

  describe("Click Interaction", () => {
    it("shows tooltip on click when clickToShow is true", async () => {
      render(<Tooltip {...defaultProps} clickToShow />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("toggles tooltip on multiple clicks when clickToShow is true", async () => {
      render(<Tooltip {...defaultProps} clickToShow />);

      const trigger = screen.getByRole("button", { name: "Trigger" });

      // First click - show
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Second click - hide
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("does not show tooltip on hover when clickToShow is true", async () => {
      render(<Tooltip {...defaultProps} clickToShow showDelay={0} />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      fireEvent.mouseEnter(trigger);

      // Wait a bit to ensure tooltip doesn't appear
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Controlled Mode", () => {
    it("shows tooltip when show prop is true", () => {
      render(<Tooltip {...defaultProps} show={true} />);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("hides tooltip when show prop is false", () => {
      render(<Tooltip {...defaultProps} show={false} />);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("sets correct ARIA attributes", async () => {
      render(<Tooltip {...defaultProps} showDelay={0} />);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      fireEvent.mouseEnter(trigger);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveAttribute("aria-hidden", "false");
      });
    });
  });

  describe("Callbacks", () => {
    it("calls onVisibilityChange when tooltip shows", async () => {
      const onVisibilityChange = vi.fn();
      render(
        <Tooltip
          {...defaultProps}
          onVisibilityChange={onVisibilityChange}
          showDelay={0}
        />
      );

      const trigger = screen.getByRole("button", { name: "Trigger" });
      fireEvent.mouseEnter(trigger);

      await waitFor(() => {
        expect(onVisibilityChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Child-Friendly Content", () => {
    it("displays multi-line content correctly", () => {
      const multiLineContent = "This is line 1\nThis is line 2\nThis is line 3";
      render(
        <Tooltip content={multiLineContent} show={true}>
          {defaultProps.children}
        </Tooltip>
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent(
        "This is line 1This is line 2This is line 3"
      );
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
