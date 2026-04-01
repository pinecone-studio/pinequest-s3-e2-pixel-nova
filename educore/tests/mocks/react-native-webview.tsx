import React from "react";
import { Text } from "react-native";

export const WebView = ({
  source,
  testID,
}: {
  source?: { html?: string };
  testID?: string;
}) => (
  <Text testID={testID ?? "webview"}>{source?.html ?? ""}</Text>
);
