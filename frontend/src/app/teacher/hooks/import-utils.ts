export const promptQuestionLimit = (
  message: string,
  fallback: string,
): number | null => {
  const input = window.prompt(message, fallback);
  if (input === null) return null;
  const parsed = Number(input);
  const limit = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 0;
  return limit || null;
};

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Файл уншиж чадсангүй."));
    reader.readAsDataURL(file);
  });

export const downscaleImage = (rawDataUrl: string) =>
  new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 900;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(rawDataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
