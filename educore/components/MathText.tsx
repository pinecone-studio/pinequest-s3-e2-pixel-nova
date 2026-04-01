import MathView from "react-native-math-view";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";

const MATH_SEGMENT_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

type MathTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
};

type Segment =
  | { type: "plain"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

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
              <MathView math={segment.value} />
            </View>
          );
        }

        if (segment.type === "inline") {
          return (
            <View key={key} style={styles.inline}>
              <MathView math={segment.value} />
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
  block: {
    alignItems: "center",
    marginVertical: 6,
    width: "100%",
  },
});
