import React from "react";
import { render, screen } from "@testing-library/react";
import { Tooltip } from "../Tooltip";

describe("Tooltip Simple", () => {
  it("renders children correctly", () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Test Button</button>
      </Tooltip>
    );

    expect(
      screen.getByRole("button", { name: "Test Button" })
    ).toBeInTheDocument();
  });

  it("shows tooltip when controlled", () => {
    render(
      <Tooltip content="Test tooltip" show={true}>
        <button>Test Button</button>
      </Tooltip>
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("Test tooltip")).toBeInTheDocument();
  });

  it("hides tooltip when controlled", () => {
    render(
      <Tooltip content="Test tooltip" show={false}>
        <button>Test Button</button>
      </Tooltip>
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
