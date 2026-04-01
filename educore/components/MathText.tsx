import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useState } from "react";
import { WebView } from "react-native-webview";

const MATH_SEGMENT_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_TEXT_COLOR = "#111111";
const INLINE_MIN_HEIGHT = 28;
const BLOCK_MIN_HEIGHT = 40;
const INLINE_WIDTH_FACTOR = 0.7;

type MathTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
};

type Segment =
  | { type: "plain"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

type MathFormulaProps = {
  displayMode: boolean;
  math: string;
  style?: StyleProp<TextStyle>;
};

type FormulaSize = {
  height: number;
  width: number;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStyleTokens(style?: StyleProp<TextStyle>) {
  const flattened = StyleSheet.flatten(style);
  return {
    color:
      typeof flattened?.color === "string"
        ? flattened.color
        : DEFAULT_TEXT_COLOR,
    fontSize:
      typeof flattened?.fontSize === "number"
        ? flattened.fontSize
        : DEFAULT_FONT_SIZE,
  };
}

function estimateInlineWidth(math: string, fontSize: number) {
  return Math.max(32, Math.ceil(math.length * fontSize * INLINE_WIDTH_FACTOR));
}

function buildMathHtml({
  color,
  displayMode,
  fontSize,
  math,
  minHeight,
  minWidth,
}: {
  color: string;
  displayMode: boolean;
  fontSize: number;
  math: string;
  minHeight: number;
  minWidth: number;
}) {
  const fallbackText = escapeHtml(math);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }
      body {
        color: ${color};
        font-size: ${fontSize}px;
        display: inline-block;
      }
      #math-root {
        display: ${displayMode ? "block" : "inline-block"};
        min-height: ${minHeight}px;
        min-width: ${minWidth}px;
        padding: ${displayMode ? "4px 0" : "0"};
        white-space: nowrap;
      }
      .katex-display {
        margin: 0 !important;
      }
    </style>
  </head>
  <body>
    <div id="math-root">${fallbackText}</div>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
    <script>
      (function() {
        var root = document.getElementById("math-root");
        var math = ${JSON.stringify(math)};
        var displayMode = ${displayMode ? "true" : "false"};

        function postSize() {
          if (!root || !window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) {
            return;
          }

          var rect = root.getBoundingClientRect();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            width: Math.max(${minWidth}, Math.ceil(rect.width)),
            height: Math.max(${minHeight}, Math.ceil(rect.height))
          }));
        }

        try {
          if (window.katex) {
            window.katex.render(math, root, {
              displayMode: displayMode,
              throwOnError: false
            });
          }
        } catch (error) {
          root.textContent = math;
        }

        postSize();
        setTimeout(postSize, 80);
        setTimeout(postSize, 200);
      })();
    </script>
  </body>
</html>`;
}

function MathFormula({ displayMode, math, style }: MathFormulaProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { color, fontSize } = getStyleTokens(style);
  const inlineWidth = estimateInlineWidth(math, fontSize);
  const minHeight = displayMode ? BLOCK_MIN_HEIGHT : INLINE_MIN_HEIGHT;
  const [size, setSize] = useState<FormulaSize>({
    height: minHeight,
    width: displayMode ? Math.max(120, screenWidth - 64) : inlineWidth,
  });

  if (Platform.OS === "web") {
    return (
      <Text
        style={[style, displayMode ? styles.mathBlock : styles.mathInline]}
        testID="math-view"
      >
        {math}
      </Text>
    );
  }

  const html = buildMathHtml({
    color,
    displayMode,
    fontSize,
    math,
    minHeight,
    minWidth: displayMode ? Math.max(120, screenWidth - 64) : inlineWidth,
  });

  return (
    <View
      pointerEvents="none"
      style={[
        displayMode ? styles.blockFormulaFrame : styles.inlineFormulaFrame,
        displayMode
          ? { minHeight: size.height }
          : { height: size.height, width: size.width },
      ]}
    >
      <WebView
        automaticallyAdjustContentInsets={false}
        domStorageEnabled
        javaScriptEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as FormulaSize;
            if (
              typeof payload.height === "number" &&
              typeof payload.width === "number"
            ) {
              setSize({
                height: Math.max(minHeight, Math.ceil(payload.height)),
                width: displayMode
                  ? Math.max(120, screenWidth - 64)
                  : Math.max(32, Math.ceil(payload.width)),
              });
            }
          } catch {
            // Keep the estimated size when the WebView cannot post dimensions.
          }
        }}
        originWhitelist={["*"]}
        pointerEvents="none"
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={{ html }}
        style={[
          styles.webView,
          displayMode
            ? { height: size.height, width: "100%" }
            : { height: size.height, width: size.width },
        ]}
        testID="math-view"
      />
    </View>
  );
}

export default function MathText({ text, style }: MathTextProps) {
  if (!text) return null;

  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MATH_SEGMENT_REGEX)) {
    const [segment] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({ type: "plain", value: text.slice(lastIndex, start) });
    }

    segments.push({
      type: segment.startsWith("$$") ? "block" : "inline",
      value: segment.startsWith("$$")
        ? segment.slice(2, -2).trim()
        : segment.slice(1, -1).trim(),
    });

    lastIndex = start + segment.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "plain", value: text.slice(lastIndex) });
  }

  if (!segments.length) {
    segments.push({ type: "plain", value: text });
  }

  return (
    <View style={styles.container}>
      {segments.map((segment, index) => {
        const key = `${segment.type}-${index}`;

        if (segment.type === "block") {
          return (
            <View key={key} style={styles.block}>
              <MathFormula
                displayMode
                math={segment.value}
                style={[style, styles.mathBlock]}
              />
            </View>
          );
        }

        if (segment.type === "inline") {
          return (
            <View key={key} style={styles.inline}>
              <MathFormula
                displayMode={false}
                math={segment.value}
                style={[style, styles.mathInline]}
              />
            </View>
          );
        }

        return (
          <Text key={key} style={style}>
            {segment.value}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  inline: {
    justifyContent: "center",
    marginRight: 4,
  },
  inlineFormulaFrame: {
    justifyContent: "center",
  },
  mathInline: {
    fontFamily: "monospace",
  },
  block: {
    alignItems: "center",
    marginVertical: 6,
    width: "100%",
  },
  mathBlock: {
    fontFamily: "monospace",
    textAlign: "center",
  },
  blockFormulaFrame: {
    minWidth: "100%",
  },
  webView: {
    backgroundColor: "transparent",
  },
});
