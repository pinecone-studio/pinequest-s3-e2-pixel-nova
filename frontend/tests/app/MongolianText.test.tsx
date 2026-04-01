import { render, screen } from "@testing-library/react";
import MongolianText from "@/components/MongolianText";

const traditionalText = "\u182e\u1823\u1829\u182d\u1823\u182f";

describe("MongolianText", () => {
  it("renders nothing for an empty string", () => {
    const { container } = render(<MongolianText text="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders Latin or Cyrillic text as plain fallback", () => {
    render(<MongolianText text="Сайн байна уу" />);

    expect(screen.getByTestId("plain-text")).toHaveTextContent("Сайн байна уу");
    expect(screen.getByTestId("plain-text")).toHaveAttribute(
      "data-traditional-mongolian",
      "false",
    );
  });

  it("renders traditional Mongolian text with the vertical renderer", () => {
    render(<MongolianText text={traditionalText} />);

    expect(
      screen.getByTestId("traditional-mongolian-text"),
    ).toHaveTextContent(traditionalText);
    expect(
      screen.getByTestId("traditional-mongolian-text"),
    ).toHaveClass("mongolian-text");
  });

  it("keeps mixed text in the traditional Mongolian renderer path", () => {
    render(<MongolianText text={`${traditionalText} test`} />);

    expect(
      screen.getByTestId("traditional-mongolian-text"),
    ).toHaveTextContent(`${traditionalText} test`);
  });

  it("passes through className", () => {
    render(<MongolianText text={traditionalText} className="custom-class" />);

    expect(screen.getByTestId("traditional-mongolian-text")).toHaveClass(
      "custom-class",
    );
  });
});
