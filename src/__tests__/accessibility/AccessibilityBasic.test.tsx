import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccessibilityProvider } from "../../components/accessibility/AccessibilityProvider";
import { AccessibilityMenu } from "../../components/accessibility/AccessibilityMenu";

describe("Basic Accessibility Features", () => {
  beforeEach(() => {
    // Reset DOM classes before each test
    document.documentElement.className = "";
    document.documentElement.style.fontSize = "";
  });

  it("renders accessibility provider", () => {
    render(
      <AccessibilityProvider>
        <div data-testid="child">Test content</div>
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders accessibility menu", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    const menuButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });
    expect(menuButton).toBeInTheDocument();
  });

  it("opens and closes accessibility menu", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    const menuButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    // Menu should be closed initially
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    // Open menu
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Close menu with close button
    const closeButton = screen.getByRole("button", {
      name: /close accessibility menu/i,
    });
    await user.click(closeButton);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles high contrast mode", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    // Open menu
    await user.click(
      screen.getByRole("button", { name: /open accessibility menu/i })
    );

    // Toggle high contrast
    const highContrastToggle = screen.getByRole("switch", {
      name: /high contrast mode/i,
    });
    expect(highContrastToggle).toHaveAttribute("aria-checked", "false");

    await user.click(highContrastToggle);

    expect(highContrastToggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement).toHaveClass("high-contrast");
  });

  it("adjusts font size", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    // Open menu
    await user.click(
      screen.getByRole("button", { name: /open accessibility menu/i })
    );

    // Increase font size
    const increaseFontButton = screen.getByRole("button", {
      name: /increase font size/i,
    });
    await user.click(increaseFontButton);

    expect(document.documentElement.style.fontSize).toContain("110");
  });

  it("provides screen reader instructions", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    // Check for screen reader instructions in the menu
    const menuButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });
    expect(menuButton).toHaveAttribute("aria-label");
  });
});
