import { PDFParse } from "pdf-parse";

export interface ParsedPdf {
  text: string;
  pageCount: number;
  pages: string[];
}

const MAX_PAGES = 20;

/**
 * Extract text from a typed PDF buffer.
 * Throws if the PDF is scanned (no extractable text) or exceeds page limit.
 */
export async function parsePdf(data: Uint8Array | ArrayBuffer): Promise<ParsedPdf> {
  const input = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  const parser = new PDFParse({ data: input });

  try {
    const info = await parser.getInfo();
    const pageCount = info.total;

    if (pageCount > MAX_PAGES) {
      throw new PdfParseError(
        "TOO_MANY_PAGES",
        `PDF must be ${MAX_PAGES} pages or fewer (got ${pageCount})`,
      );
    }

    const textResult = await parser.getText();
    const fullText = textResult.text.trim();

    if (!fullText || fullText.length < 20) {
      throw new PdfParseError(
        "NO_TEXT",
        "This PDF appears to be scanned. Please upload a typed/digital PDF",
      );
    }

    // Get per-page text
    const pages = textResult.pages
      .map((p) => p.text.trim())
      .filter((t) => t.length > 0);

    return {
      text: fullText,
      pageCount,
      pages: pages.length > 0 ? pages : [fullText],
    };
  } finally {
    await parser.destroy();
  }
}

export class PdfParseError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
