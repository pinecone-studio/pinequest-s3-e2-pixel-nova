import { buttonGhost } from "../../styles";

type QuestionImageCropModalProps = {
  open: boolean;
  source: string | null;
  cropTop: number;
  setCropTop: (value: number) => void;
  cropBottom: number;
  setCropBottom: (value: number) => void;
  imageBusy: boolean;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
};

export default function QuestionImageCropModal({
  open,
  source,
  cropTop,
  setCropTop,
  cropBottom,
  setCropBottom,
  imageBusy,
  onClose,
  onReset,
  onApply,
}: QuestionImageCropModalProps) {
  if (!open || !source) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
      <div className="w-full max-w-4xl rounded-[28px] border border-[#dce5ef] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Question Image Crop</div>
            <div className="text-xs text-slate-500">
              Дээш, доош crop-оо тааруулаад хадгална.
            </div>
          </div>
          <button className={buttonGhost} onClick={onClose} type="button">
            Хаах
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-[#dce5ef] bg-[#f8fbff] p-4">
            <div className="text-xs font-semibold text-slate-500">Original</div>
            <div className="mt-3 max-h-[480px] overflow-auto rounded-2xl border border-border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={source}
                alt="Crop source"
                className="w-full rounded-xl border border-border object-contain"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-[#dce5ef] bg-[#f8fbff] p-4">
            <div className="text-xs font-semibold text-slate-500">
              Cropped preview
            </div>
            <div className="mt-3 h-[320px] overflow-hidden rounded-2xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={source}
                alt="Crop preview"
                className="w-full object-cover"
                style={{
                  height: `${100 / Math.max(cropBottom - cropTop, 0.02)}%`,
                  transform: `translateY(-${cropTop * 100}%)`,
                  transformOrigin: "top center",
                }}
              />
            </div>

            <div className="mt-4 space-y-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">
                  Top crop: {Math.round(cropTop * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={95}
                  value={Math.round(cropTop * 100)}
                  onChange={(event) => {
                    const nextTop = Number(event.target.value) / 100;
                    setCropTop(Math.min(nextTop, cropBottom - 0.02));
                  }}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">
                  Bottom crop: {Math.round(cropBottom * 100)}%
                </span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={Math.round(cropBottom * 100)}
                  onChange={(event) => {
                    const nextBottom = Number(event.target.value) / 100;
                    setCropBottom(Math.max(nextBottom, cropTop + 0.02));
                  }}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className={buttonGhost} onClick={onReset} type="button">
                Reset
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                disabled={imageBusy}
                onClick={onApply}
                type="button"
              >
                {imageBusy ? "Хадгалж байна..." : "Apply crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
