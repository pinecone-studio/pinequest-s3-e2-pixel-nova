import {
  OCR_FALLBACK_LANG,
  OCR_PRIMARY_LANG,
  recognizeWithFallback,
} from "@/app/teacher/hooks/import-ocr";

describe("recognizeWithFallback", () => {
  it("uses the primary OCR language first", async () => {
    const recognize = jest.fn().mockResolvedValue({ data: { text: "ok" } });

    await recognizeWithFallback({ recognize }, "image-data");

    expect(recognize).toHaveBeenCalledWith("image-data", OCR_PRIMARY_LANG);
  });

  it("falls back to English if the primary OCR language fails", async () => {
    const recognize = jest
      .fn()
      .mockRejectedValueOnce(new Error("missing traineddata"))
      .mockResolvedValueOnce({ data: { text: "ok" } });

    await recognizeWithFallback({ recognize }, "image-data");

    expect(recognize).toHaveBeenNthCalledWith(1, "image-data", OCR_PRIMARY_LANG);
    expect(recognize).toHaveBeenNthCalledWith(2, "image-data", OCR_FALLBACK_LANG);
  });
});
