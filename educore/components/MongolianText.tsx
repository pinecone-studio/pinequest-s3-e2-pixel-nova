import { useMemo } from "react";
import {
  StyleSheet,
  StyleSheet as RNStyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { WebView } from "react-native-webview";

import { hasTraditionalMongolian } from "@/lib/mongolian-script";

type MongolianTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const FONT_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-mongolian/files/noto-sans-mongolian-mongolian-400-normal.woff2";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const estimateHeight = (text: string, fontSize: number) => {
  const columns = Math.max(1, Math.ceil(text.length / 8));
  return Math.min(360, Math.max(104, Math.round(columns * fontSize * 1.7)));
};

export default function MongolianText({
  text,
  style,
  containerStyle,
}: MongolianTextProps) {
  const flattened = RNStyleSheet.flatten(style) ?? {};
  const isTraditional = Boolean(text) && hasTraditionalMongolian(text);
  const fontSize =
    typeof flattened.fontSize === "number" ? flattened.fontSize : 18;
  const lineHeight =
    typeof flattened.lineHeight === "number"
      ? flattened.lineHeight
      : Math.round(fontSize * 1.4);
  const color = typeof flattened.color === "string" ? flattened.color : "#111111";
  const fontWeight =
    typeof flattened.fontWeight === "string" ? flattened.fontWeight : "400";
  const height = estimateHeight(text, fontSize);

  const html = useMemo(
    () => `
      <!DOCTYPE html>
      <html lang="mn">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <style>
            @font-face {
              font-family: 'Noto Sans Mongolian';
              src: url('${FONT_CDN_URL}') format('woff2');
              font-display: swap;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: transparent;
              overflow: hidden;
            }
            .mongolian {
              color: ${color};
              font-family: 'Noto Sans Mongolian', serif;
              font-size: ${fontSize}px;
              font-weight: ${fontWeight};
              line-height: ${lineHeight}px;
              white-space: pre-wrap;
              writing-mode: vertical-lr;
              text-orientation: mixed;
              display: inline-block;
              min-height: 100%;
            }
          </style>
        </head>
        <body>
          <div class="mongolian">${escapeHtml(text)}</div>
        </body>
      </html>
    `,
    [color, fontSize, fontWeight, lineHeight, text],
  );

  if (!text) return null;

  if (!isTraditional) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <View
      testID="traditional-mongolian-container"
      style={[styles.container, { height }, containerStyle]}
    >
      <WebView
        testID="traditional-mongolian-webview"
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={false}
        nestedScrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: "#F8FAFC",
    borderColor: "#E0E7F1",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  webview: {
    backgroundColor: "transparent",
    flex: 1,
  },
});
