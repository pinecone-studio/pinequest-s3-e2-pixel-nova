export const optionLabels = ["A", "B", "C", "D", "E", "F"];

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Зураг уншиж чадсангүй."));
    reader.readAsDataURL(file);
  });

export const fetchImageAsDataUrl = async (imageUrl: string) => {
  if (imageUrl.startsWith("data:image/")) return imageUrl;

  const response = await fetch(imageUrl, {
    credentials: "omit",
    mode: "cors",
  });
  if (!response.ok) {
    throw new Error("Зургийг татаж чадсангүй.");
  }

  const blob = await response.blob();
  return readFileAsDataUrl(
    new File([blob], "question-image", {
      type: blob.type || "image/jpeg",
    }),
  );
};

export const cropImageDataUrl = async (
  dataUrl: string,
  topPercent: number,
  bottomPercent: number,
) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const top = Math.max(0, Math.min(0.95, topPercent));
      const bottom = Math.max(top + 0.02, Math.min(1, bottomPercent));
      const sourceY = Math.round(image.height * top);
      const sourceHeight = Math.max(
        1,
        Math.round(image.height * (bottom - top)),
      );

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = sourceHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas үүсгэж чадсангүй."));
        return;
      }

      context.drawImage(
        image,
        0,
        sourceY,
        image.width,
        sourceHeight,
        0,
        0,
        image.width,
        sourceHeight,
      );

      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () => reject(new Error("Зураг ачаалж чадсангүй."));
    image.src = dataUrl;
  });
