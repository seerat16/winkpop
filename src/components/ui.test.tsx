import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, Chip, EmptyState } from "./ui";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByText("Add to cart")).toBeInTheDocument();
  });
  it("fires onClick when pressed", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to cart</Button>);
    fireEvent.click(screen.getByText("Add to cart"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByText("Save"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Chip", () => {
  it("fires onClick and exposes pressed state", () => {
    const onClick = vi.fn();
    render(<Chip label="Album" active onClick={onClick} />);
    const chip = screen.getByRole("button", { name: "Album" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyState", () => {
  it("renders title and subtitle", () => {
    render(<EmptyState title="Nothing here" subtitle="Add something" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add something")).toBeInTheDocument();
  });
});
