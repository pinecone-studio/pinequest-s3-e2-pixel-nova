import { Fragment } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { cn } from "@/lib/utils";

const MATH_SEGMENT_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
const KATEX_ERROR_COLOR = "#cc0000";

type MathTextProps = {
  text: string;
  className?: string;
};

function renderKatexError(error: Error) {
  return <span style={{ color: KATEX_ERROR_COLOR }}>{error.message}</span>;
}

export default function MathText({ text, className }: MathTextProps) {
  if (!text) return null;

  const parts: Array<
    | { type: "plain"; value: string }
    | { type: "inline"; value: string }
    | { type: "block"; value: string }
  > = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MATH_SEGMENT_REGEX)) {
    const [segment] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      parts.push({ type: "plain", value: text.slice(lastIndex, start) });
    }

    parts.push({
      type: segment.startsWith("$$") ? "block" : "inline",
      value: segment.startsWith("$$")
        ? segment.slice(2, -2).trim()
        : segment.slice(1, -1).trim(),
    });

    lastIndex = start + segment.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "plain", value: text.slice(lastIndex) });
  }

  if (!parts.length) {
    parts.push({ type: "plain", value: text });
  }

  return (
    <div className={cn("min-w-0", className)}>
      {parts.map((part, index) => {
        const key = `${part.type}-${index}`;

        if (part.type === "block") {
          return (
            <div key={key} className="my-2 overflow-x-auto">
              <BlockMath
                math={part.value}
                errorColor={KATEX_ERROR_COLOR}
                renderError={renderKatexError}
              />
            </div>
          );
        }

        if (part.type === "inline") {
          return (
            <Fragment key={key}>
              <InlineMath
                math={part.value}
                errorColor={KATEX_ERROR_COLOR}
                renderError={renderKatexError}
              />
            </Fragment>
          );
        }

        return (
          <span key={key} className="whitespace-pre-wrap">
            {part.value}
          </span>
        );
      })}
    </div>
  );
}
