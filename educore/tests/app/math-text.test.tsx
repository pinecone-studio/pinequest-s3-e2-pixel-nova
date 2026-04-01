import React from "react";
import { render } from "@testing-library/react-native";
import MathText from "@/components/MathText";

describe("educore MathText", () => {
  it("renders plain text without math views", () => {
    const screen = render(<MathText text="Plain text only" />);

    expect(screen.getByText("Plain text only")).toBeTruthy();
    expect(screen.queryByTestId("math-view")).toBeNull();
  });

  it("renders inline math", () => {
    const screen = render(<MathText text="Solve $x^2 = 4$ now" />);

    expect(screen.getByTestId("math-view").props.children).toBe("x^2 = 4");
  });

  it("renders block math", () => {
    const screen = render(<MathText text="$$\\frac{a}{b}$$" />);

    expect(screen.getByTestId("math-view").props.children).toContain("frac{a}{b}");
  });

  it("renders mixed text and math", () => {
    const screen = render(<MathText text={"A $x+1$ and $$\\sqrt{9}$$"} />);

    expect(screen.toJSON()).toBeTruthy();
    expect(screen.getAllByTestId("math-view")).toHaveLength(2);
  });
});
