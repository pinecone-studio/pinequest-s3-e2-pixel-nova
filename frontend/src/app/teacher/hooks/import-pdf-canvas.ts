import { clamp } from "./import-pdf-logic";
import type { PdfPage } from "./import-pdf-types";

export const renderPageToCanvas = async (page: PdfPage, scale = 2) => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

export const createCropCanvas = (
  source: HTMLCanvasElement,
  top: number,
  bottom: number,
) => {
  const safeTop = Math.floor(clamp(top, 0, source.height - 1));
  const safeBottom = Math.ceil(clamp(bottom, safeTop + 1, source.height));
  const cropHeight = safeBottom - safeTop;
  if (cropHeight < 48) return null;

  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / source.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    source,
    0,
    safeTop,
    source.width,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
};

export const canvasToDataUrl = (
  canvas: HTMLCanvasElement | null,
  quality = 0.74,
) => {
  if (!canvas) return undefined;
  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return undefined;
  }
};
