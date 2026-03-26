import type { PdfJs, Tesseract } from "./import-pdf-types";

export const getPdfJs = async () => {
  const pdfModule = (await import("pdfjs-dist/legacy/build/pdf")) as {
    default?: PdfJs;
  } & PdfJs;
  const pdfjsLib = pdfModule.default ?? pdfModule;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
};

let tesseractPromise: Promise<Tesseract> | null = null;

export const getTesseract = async () => {
  tesseractPromise ??= import("tesseract.js") as Promise<Tesseract>;
  return tesseractPromise;
};
