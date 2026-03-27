type ExamImportPanelProps = {
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  importLoading: boolean;
  importLoadingLabel: string | null;
  onPdfUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
};

export default function ExamImportPanel({
  pdfLoading,
  pdfError,
  importError,
  importLoading,
  importLoadingLabel,
  onPdfUpload,
  onImageUpload,
  onDocxUpload,
}: ExamImportPanelProps) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#dbe5f0] bg-[#fbfdff] px-4 py-4 text-sm text-slate-500">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Файл импорт
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eff6ff] ${importLoading ? "pointer-events-none opacity-60" : ""}`}
          >
            PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPdfUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eff6ff] ${importLoading ? "pointer-events-none opacity-60" : ""}`}
          >
            Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImageUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eff6ff] ${importLoading ? "pointer-events-none opacity-60" : ""}`}
          >
            DOCX
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onDocxUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {importLoading && (
        <div className="mt-3 text-xs">
          {importLoadingLabel ?? "Файл боловсруулж байна..."}
        </div>
      )}

      {pdfError && <div className="mt-2 text-xs text-red-500">{pdfError}</div>}
      {importError && (
        <div className="mt-2 text-xs text-red-500">{importError}</div>
      )}
    </div>
  );
}
