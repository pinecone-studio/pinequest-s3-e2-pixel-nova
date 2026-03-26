export type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
};

export type PdfPage = {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
  render: (args: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
  getViewport: (args: { scale: number }) => { width: number; height: number };
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
};

export type PdfDoc = {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfPage>;
};

export type PdfJs = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (args: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> };
};

export type Tesseract = {
  recognize: (
    image: HTMLCanvasElement,
    lang: string,
  ) => Promise<{ data: { text: string } }>;
};

export type PositionedLine = {
  text: string;
  top: number;
  bottom: number;
  lineCountWeight: number;
  minX: number;
  maxX: number;
  fragments: Array<{
    text: string;
    x: number;
  }>;
};

export type QuestionSegment = {
  number: number;
  text: string;
  top: number;
  bottom: number;
  lineCount: number;
  lines: PositionedLine[];
};
