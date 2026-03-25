type ExamImportPanelProps = {
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  onPdfUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
};

export default function ExamImportPanel({
  pdfUseOcr,
  setPdfUseOcr,
  answerKeyPage,
  setAnswerKeyPage,
  pdfLoading,
  pdfError,
  importError,
  onPdfUpload,
  onImageUpload,
  onDocxUpload,
}: ExamImportPanelProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>Файл импорт (PDF / IMAGE / DOCX)</span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
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
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
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
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
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

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={pdfUseOcr}
            onChange={(event) => setPdfUseOcr(event.target.checked)}
          />
          <span>Зөв хариултын зураг OCR ашиглах</span>
        </label>
        <input
          type="number"
          min={1}
          className="ml-auto w-24 rounded-lg border border-border bg-card px-2 py-1 text-[11px]"
          placeholder="Page"
          value={answerKeyPage === "last" ? "" : answerKeyPage}
          onChange={(event) => {
            const value = event.target.value;
            setAnswerKeyPage(value ? Number(value) : "last");
          }}
        />
        <span className="text-[11px] text-muted-foreground">(blank = last)</span>
      </div>

      {pdfLoading && <div className="mt-2 text-xs">PDF уншиж байна...</div>}
      {pdfError && <div className="mt-2 text-xs text-red-500">{pdfError}</div>}
      {importError && (
        <div className="mt-2 text-xs text-red-500">{importError}</div>
      )}
    </div>
  );
}
