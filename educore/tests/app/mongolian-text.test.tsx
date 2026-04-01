import React from "react";
import { render } from "@testing-library/react-native";

import MongolianText from "@/components/MongolianText";

const traditionalText = "\u182e\u1823\u1829\u182d\u1823\u182f";

describe("educore MongolianText", () => {
  it("renders nothing for an empty string", () => {
    const screen = render(<MongolianText text="" />);

    expect(screen.toJSON()).toBeNull();
  });

  it("renders plain text as native text fallback", () => {
    const screen = render(<MongolianText text="Сайн байна уу" />);

    expect(screen.getByText("Сайн байна уу")).toBeTruthy();
    expect(screen.queryByTestId("traditional-mongolian-webview")).toBeNull();
  });

  it("renders traditional Mongolian text through the webview renderer", () => {
    const screen = render(<MongolianText text={traditionalText} />);

    expect(screen.getByTestId("traditional-mongolian-container")).toBeTruthy();
    expect(screen.getByTestId("traditional-mongolian-webview").props.children).toContain(
      traditionalText,
    );
  });

  it("passes through styled content for traditional Mongolian text", () => {
    const screen = render(
      <MongolianText text={traditionalText} style={{ fontSize: 22, color: "#123456" }} />,
    );

    expect(screen.getByTestId("traditional-mongolian-webview").props.children).toContain(
      "#123456",
    );
    expect(screen.getByTestId("traditional-mongolian-webview").props.children).toContain(
      "22px",
    );
  });
});
