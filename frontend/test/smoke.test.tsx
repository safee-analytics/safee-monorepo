import { describe, it, expect } from "vitest";
import { render, screen } from "./test-utils";

describe("Test Infrastructure Smoke Test", () => {
  it("should render a simple component", () => {
    const TestComponent = () => <div>Hello Test</div>;
    render(<TestComponent />);
    expect(screen.getByText("Hello Test")).toBeInTheDocument();
  });

  it("should have vitest globals available", () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it("should have React Testing Library matchers", () => {
    const div = document.createElement("div");
    div.textContent = "test";
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
  });
});
