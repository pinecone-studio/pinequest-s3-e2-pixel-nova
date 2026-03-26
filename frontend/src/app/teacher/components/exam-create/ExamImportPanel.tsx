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
    <div className="rounded-[24px] border border-dashed border-[#d5dfeb] bg-[#f8fbff] px-4 py-4 text-sm text-slate-500">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-slate-700">Файл оруулах</span>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eff6ff] ${importLoading ? "opacity-60 pointer-events-none" : ""}`}
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
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eff6ff] ${importLoading ? "opacity-60 pointer-events-none" : ""}`}
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
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eff6ff] ${importLoading ? "opacity-60 pointer-events-none" : ""}`}
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
        <div className="mt-2 text-xs">
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
