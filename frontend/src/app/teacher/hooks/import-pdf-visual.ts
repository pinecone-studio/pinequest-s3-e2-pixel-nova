import type { Question } from "../types";
import type { QuestionSegment } from "./import-pdf-types";
import { isQuestionTextSuspicious } from "../utils";

const VISUAL_CUE_PATTERN =
  /(graph|diagram|figure|chart|table|image|picture|coordinate|plane|plot|grid|зураг|график|диаграм|дүрс|хүснэгт|координат|байрлал|дүрслэл)/i;

export const shouldAttachCrop = (params: {
  blockText: string;
  segment: QuestionSegment;
  pageHasGraphics: boolean;
  recoveredWithOcr: boolean;
  question: Question | null;
}) => {
  const { blockText, segment, pageHasGraphics, recoveredWithOcr, question } =
    params;
  const visualHeight = segment.bottom - segment.top;
  const expectedTextHeight = Math.max(52, Math.min(160, segment.lineCount * 18));
  const visualOverflow = visualHeight - expectedTextHeight;
  const mentionsVisualCue = VISUAL_CUE_PATTERN.test(
    [blockText, question?.text ?? ""].join(" "),
  );
  const looksGraphHeavy =
    visualHeight >= Math.max(170, segment.lineCount * 24) ||
    visualOverflow >= 72;
  const suspiciousQuestion =
    !question || isQuestionTextSuspicious(question.text);

  return (
    looksGraphHeavy ||
    mentionsVisualCue ||
    recoveredWithOcr ||
    (pageHasGraphics && suspiciousQuestion && visualOverflow >= 90)
  );
};
