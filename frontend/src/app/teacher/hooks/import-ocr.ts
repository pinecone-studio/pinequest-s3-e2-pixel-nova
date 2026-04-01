export const OCR_PRIMARY_LANG = "eng+mon";
export const OCR_FALLBACK_LANG = "eng";

type OcrEngine<TImage> = {
  recognize: (
    image: TImage,
    lang: string,
  ) => Promise<{ data: { text: string } }>;
};

export const recognizeWithFallback = async <TImage>(
  engine: OcrEngine<TImage>,
  image: TImage,
) => {
  try {
    return await engine.recognize(image, OCR_PRIMARY_LANG);
  } catch {
    return engine.recognize(image, OCR_FALLBACK_LANG);
  }
};
