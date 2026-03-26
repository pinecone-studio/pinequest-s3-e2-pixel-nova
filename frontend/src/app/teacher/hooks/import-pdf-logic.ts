import type { Question } from "../types";
import type { PdfTextItem, PositionedLine, QuestionSegment } from "./import-pdf-types";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const buildPositionedLines = (
  items: PdfTextItem[],
  pageHeight: number,
): PositionedLine[] => {
  const fragments = items
    .map((item) => {
      const text = (item.str ?? "").replace(/\s+/g, " ").trim();
      const transform = item.transform ?? [];
      const x = Number(transform[4] ?? 0);
      const y = Number(transform[5] ?? 0);
      const height = Math.abs(
        Number(item.height ?? transform[0] ?? transform[3] ?? 12),
      );

      if (!text) return null;

      return {
        text,
        x,
        y,
        height: Number.isFinite(height) && height > 0 ? height : 12,
      };
    })
    .filter(
      (
        item,
      ): item is {
        text: string;
        x: number;
        y: number;
        height: number;
      } => Boolean(item),
    );

  const groups: Array<{
    baseline: number;
    fragments: typeof fragments;
    minY: number;
    maxY: number;
    maxHeight: number;
  }> = [];

  fragments.sort((left, right) => {
    if (Math.abs(left.y - right.y) > 6) return right.y - left.y;
    return left.x - right.x;
  });

  for (const fragment of fragments) {
    const line = groups.find(
      (candidate) =>
        Math.abs(candidate.baseline - fragment.y) <=
        Math.max(5, Math.min(12, fragment.height * 0.7)),
    );

    if (line) {
      line.fragments.push(fragment);
      line.minY = Math.min(line.minY, fragment.y);
      line.maxY = Math.max(line.maxY, fragment.y);
      line.maxHeight = Math.max(line.maxHeight, fragment.height);
      line.baseline = (line.baseline + fragment.y) / 2;
      continue;
    }

    groups.push({
      baseline: fragment.y,
      fragments: [fragment],
      minY: fragment.y,
      maxY: fragment.y,
      maxHeight: fragment.height,
    });
  }

  return groups
    .map((group) => {
      const text = group.fragments
        .sort((left, right) => left.x - right.x)
        .map((fragment) => fragment.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const top = clamp(
        pageHeight - (group.maxY + group.maxHeight) - 8,
        0,
        pageHeight,
      );
      const bottom = clamp(pageHeight - group.minY + 10, top + 1, pageHeight);

      return {
        text,
        top,
        bottom,
        lineCountWeight: Math.max(1, Math.round(group.maxHeight / 12)),
        minX: Math.min(...group.fragments.map((fragment) => fragment.x)),
        maxX: Math.max(...group.fragments.map((fragment) => fragment.x)),
        fragments: group.fragments.map((fragment) => ({
          text: fragment.text,
          x: fragment.x,
        })),
      };
    })
    .filter((line) => line.text.length > 0)
    .sort((left, right) => left.top - right.top);
};

export const buildQuestionSegments = (
  lines: PositionedLine[],
  pageHeight: number,
): QuestionSegment[] => {
  if (lines.length === 0) return [];

  const leftMostX = Math.min(...lines.map((line) => line.minX));
  const anchorMaxX = leftMostX + 180;
  const anchors = lines
    .map((line, index) => {
      const lineMatch = line.text.match(/^(\d{1,3})\s*[.)]\s+/);
      if (lineMatch) {
        return {
          index,
          number: Number(lineMatch[1]),
        };
      }

      const fragmentMatch = line.fragments.find((fragment) => {
        if (fragment.x > anchorMaxX) return false;
        return /^(\d{1,3})\s*[.)](?:\s|$)/.test(fragment.text.trim());
      });

      if (!fragmentMatch) return null;

      const nextFragment = line.fragments.find(
        (fragment) => fragment.x > fragmentMatch.x,
      );
      if (!nextFragment) return null;

      return {
        index,
        number: Number(
          fragmentMatch.text.trim().match(/^(\d{1,3})/)?.[1] ?? "0",
        ),
      };
    })
    .filter(
      (
        anchor,
      ): anchor is {
        index: number;
        number: number;
      } => Boolean(anchor?.number),
    )
    .filter((anchor, index, allAnchors) => {
      const previous = allAnchors[index - 1];
      if (!previous) return true;
      return !(
        previous.index === anchor.index &&
        previous.number === anchor.number
      );
    });

  return anchors.map((anchor, index) => {
    const nextAnchor = anchors[index + 1];
    const startLine = lines[anchor.index];
    const endIndex = nextAnchor ? nextAnchor.index : lines.length;
    const relevantLines = lines.slice(anchor.index, endIndex);
    const nextTop = nextAnchor ? lines[nextAnchor.index].top : pageHeight - 12;

    return {
      number: anchor.number,
      text: relevantLines.map((line) => line.text).join("\n").trim(),
      top: clamp(startLine.top - 16, 0, pageHeight),
      bottom: clamp(Math.max(startLine.bottom + 32, nextTop - 14), 0, pageHeight),
      lineCount: relevantLines.reduce(
        (sum, line) => sum + line.lineCountWeight,
        0,
      ),
      lines: relevantLines,
    };
  });
};

export const findVisualCropBounds = (
  source: HTMLCanvasElement,
  segment: QuestionSegment,
) => {
  const safeTop = Math.floor(clamp(segment.top, 0, source.height - 1));
  const safeBottom = Math.ceil(clamp(segment.bottom, safeTop + 1, source.height));
  const segmentHeight = safeBottom - safeTop;
  if (segmentHeight < 48) return null;

  const rowStep = 2;
  const colStep = 4;
  const padding = 12;
  const activeThreshold = Math.max(6, Math.round(source.width / 180));
  const bands: Array<{ top: number; bottom: number; score: number }> = [];
  let activeBand: { top: number; bottom: number; score: number } | null = null;

  const isTextPixel = (x: number, y: number) =>
    segment.lines.some(
      (line) =>
        y >= line.top - 6 &&
        y <= line.bottom + 6 &&
        x >= line.minX - 14 &&
        x <= line.maxX + 14,
    );

  const getPixelIndex = (x: number, y: number, width: number) =>
    (y * width + x) * 4;

  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, safeTop, source.width, segmentHeight);
  const { data, width } = imageData;

  for (let localY = 0; localY < segmentHeight; localY += rowStep) {
    const absoluteY = safeTop + localY;
    let darkCount = 0;

    for (let x = 0; x < width; x += colStep) {
      if (isTextPixel(x, absoluteY)) continue;
      const idx = getPixelIndex(x, localY, width);
      const alpha = data[idx + 3] ?? 0;
      if (alpha < 8) continue;
      const r = data[idx] ?? 255;
      const g = data[idx + 1] ?? 255;
      const b = data[idx + 2] ?? 255;
      const brightness = (r + g + b) / 3;
      if (brightness < 245) darkCount += 1;
    }

    if (darkCount >= activeThreshold) {
      if (!activeBand) {
        activeBand = {
          top: absoluteY,
          bottom: absoluteY + rowStep,
          score: darkCount,
        };
      } else {
        activeBand.bottom = absoluteY + rowStep;
        activeBand.score += darkCount;
      }
      continue;
    }

    if (activeBand) {
      bands.push(activeBand);
      activeBand = null;
    }
  }

  if (activeBand) {
    bands.push(activeBand);
  }

  if (bands.length === 0) return null;

  const bestBand = bands
    .filter((band) => band.bottom - band.top >= 24)
    .sort((left, right) => right.score - left.score)[0];

  if (!bestBand) return null;

  return {
    top: clamp(bestBand.top - padding, safeTop, safeBottom),
    bottom: clamp(bestBand.bottom + padding, safeTop + 1, safeBottom),
  };
};
