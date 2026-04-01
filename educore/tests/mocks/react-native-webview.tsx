import React from "react";
import { Text } from "react-native";

type MockWebViewProps = {
  source?: {
    html?: string;
  };
  testID?: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

export function WebView({ source, testID }: MockWebViewProps) {
  const match = source?.html?.match(/<div id="math-root">([\s\S]*?)<\/div>/);
  const content = match ? decodeHtml(match[1]) : "";

  return <Text testID={testID}>{content}</Text>;
}

export default WebView;
