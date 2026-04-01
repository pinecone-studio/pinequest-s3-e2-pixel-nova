import { render, screen } from "@testing-library/react";
import MathText from "@/components/MathText";

describe("MathText", () => {
  it("renders plain text without math markers", () => {
    render(<MathText text="Plain text only" />);

    expect(screen.getByText("Plain text only")).toBeInTheDocument();
    expect(screen.queryByTestId("inline-math")).not.toBeInTheDocument();
    expect(screen.queryByTestId("block-math")).not.toBeInTheDocument();
  });

  it("renders inline math segments", () => {
    const { container } = render(<MathText text="Solve $x^2 = 4$ today" />);

    expect(container.textContent).toContain("Solve");
    expect(screen.getByTestId("inline-math")).toHaveTextContent("x^2 = 4");
    expect(container.textContent).toContain("today");
  });

  it("renders block math segments", () => {
    render(<MathText text="$$\\frac{a}{b}$$" />);

    expect(screen.getByTestId("block-math")).toHaveTextContent("\\frac{a}{b}");
  });

  it("renders mixed plain, inline, and block content", () => {
    const { container } = render(
      <MathText text={"Before $x+1$ after $$\\frac{a}{b}$$ done"} />,
    );

    expect(container.textContent).toContain("Before");
    expect(screen.getByTestId("inline-math")).toHaveTextContent("x+1");
    expect(screen.getByTestId("block-math")).toHaveTextContent("\\frac{a}{b}");
    expect(container.textContent).toContain("done");
  });

  it("passes the KaTeX error color without throwing on invalid latex", () => {
    expect(() => render(<MathText text="Broken $\\frac{1}{2$ syntax" />)).not.toThrow();
    expect(screen.getByTestId("inline-math")).toHaveAttribute(
      "data-error-color",
      "#cc0000",
    );
  });

  it("renders nothing for an empty string", () => {
    const { container } = render(<MathText text="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
