import { Grip, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
  buttonGhost,
  buttonPrimary,
  inputClass,
  labelClass,
  selectClass,
} from "../../styles";

type QuestionFormSectionProps = {
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: "text" | "open" | "mcq";
  setQuestionType: (value: "text" | "open" | "mcq") => void;
  mcqOptions: string[];
  setMcqOptions: (value: string[]) => void;
  questionAnswer: string;
  setQuestionAnswer: (value: string) => void;
  questionImageUrl?: string;
  setQuestionImageUrl: (value: string | undefined) => void;
  questionPoints: number;
  setQuestionPoints: (value: number) => void;
  questionCorrectIndex: number;
  setQuestionCorrectIndex: (value: number) => void;
  addQuestion: () => void;
  saveExam: () => void;
  saving: boolean;
  hasUser: boolean;
};

const optionLabels = ["A", "B", "C", "D"];

export default function QuestionFormSection({
  questionText,
  setQuestionText,
  questionType,
  setQuestionType,
  mcqOptions,
  setMcqOptions,
  questionAnswer,
  setQuestionAnswer,
  questionImageUrl,
  setQuestionImageUrl,
  questionPoints,
  setQuestionPoints,
  questionCorrectIndex,
  setQuestionCorrectIndex,
  addQuestion,
  saveExam,
  saving,
  hasUser,
}: QuestionFormSectionProps) {
  const [correctOpen, setCorrectOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQuestionImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-[28px] border border-[#e7edf5] bg-white px-6 py-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.14)]">
      <div className="mb-2 flex justify-center text-slate-300">
        <Grip className="h-4 w-4" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#edf4ff] text-xs font-semibold text-[#2563eb]">
            1
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              Асуултаа оруулна уу.
            </div>
            <div className="text-xs text-slate-400">
              PDF-ээс уншсан асуултыг эндээс нэмж засварлаж болно.
            </div>
          </div>
        </div>

        <div className="w-full max-w-[220px]">
          <select
            className={`${selectClass} h-[46px] rounded-[18px] border-[#d8e0ea] bg-[#eef2f6] text-sm shadow-none`}
            value={questionType}
            onChange={(event) =>
              setQuestionType(event.target.value as "text" | "open" | "mcq")
            }
          >
            <option value="open">Задгай даалгавар</option>
            <option value="mcq">Сонголттой</option>
            <option value="text">Текстэн хариулт</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <textarea
            className="min-h-[86px] w-full resize-y border-b border-[#e8edf5] bg-transparent px-0 py-2 text-[15px] text-slate-800 outline-none placeholder:text-slate-300"
            placeholder="Асуултаа оруулна уу"
            value={questionText ?? ""}
            onChange={(event) => setQuestionText(event.target.value)}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_120px]">
          {questionType === "mcq" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {optionLabels.map((label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-[18px] border border-[#e9eef5] bg-[#fbfcff] px-3 py-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-semibold text-slate-500 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.16)]">
                    {label}
                  </span>
                  <input
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300"
                    placeholder={`${label} сонголт`}
                    value={mcqOptions[index] ?? ""}
                    onChange={(event) => {
                      const next = [...mcqOptions];
                      next[index] = event.target.value;
                      setMcqOptions(next);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <label className="grid gap-2">
              <span className="text-xs font-medium text-slate-300">Хариулт</span>
              <input
                className="h-12 w-full border-b border-[#e6edf5] bg-transparent px-0 text-sm text-slate-700 outline-none placeholder:text-slate-300"
                placeholder="Хариулт"
                value={questionAnswer ?? ""}
                onChange={(event) => setQuestionAnswer(event.target.value)}
              />
            </label>
          )}

          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className={labelClass}>Оноо</span>
              <input
                type="number"
                min={1}
                className={`${inputClass} h-12 rounded-[18px] border-[#e2e8f0] bg-white shadow-none`}
                value={Number.isFinite(questionPoints) ? questionPoints : 1}
                onChange={(event) =>
                  setQuestionPoints(Number(event.target.value || 1))
                }
                placeholder="Оноо"
              />
            </label>

            {questionType === "mcq" && (
              <label className="grid gap-2">
                <span className={labelClass}>Зөв хариулт</span>
                <div
                  className="relative"
                  tabIndex={0}
                  onBlur={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node)) {
                      return;
                    }
                    setCorrectOpen(false);
                  }}
                >
                  <button
                    className={`${selectClass} flex h-12 w-full items-center justify-between rounded-[18px] border-[#e2e8f0] bg-white shadow-none`}
                    onClick={() => setCorrectOpen((prev) => !prev)}
                    type="button"
                  >
                    <span className="truncate">
                      {mcqOptions[questionCorrectIndex]
                        ? `${optionLabels[questionCorrectIndex]}. ${mcqOptions[questionCorrectIndex]}`
                        : "Заавал хариулах"}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        correctOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`absolute z-20 mt-2 w-full rounded-2xl border border-[#e7edf5] bg-white p-2 shadow-xl transition ${
                      correctOpen
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                  >
                    {optionLabels.map((label, index) => (
                      <button
                        key={label}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                          questionCorrectIndex === index
                            ? "bg-[#2563eb] text-white"
                            : "hover:bg-[#f8fbff]"
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuestionCorrectIndex(index);
                          setCorrectOpen(false);
                        }}
                        type="button"
                      >
                        {label}. {mcqOptions[index]}
                      </button>
                    ))}
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f7] pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e0ea] bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:border-[#bfd3ff] hover:text-[#2563eb]"
              onClick={() => imageInputRef.current?.click()}
              type="button"
            >
              <ImagePlus className="h-4 w-4" />
              Зураг нэмэх
            </button>
            {questionImageUrl && (
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={() => setQuestionImageUrl(undefined)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Заавал хариулах</span>
              <button
                type="button"
                className="relative h-7 w-12 rounded-full bg-[#4a6cf0]"
                aria-label="Заавал хариулах"
              >
                <span className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            <button className={buttonGhost} onClick={addQuestion} type="button">
              + Асуулт нэмэх
            </button>
            <button
              className={`${buttonPrimary} ${saving || !hasUser ? "opacity-70" : ""}`}
              onClick={saveExam}
              type="button"
              disabled={saving || !hasUser}
            >
              {!hasUser ? "Багш сонгоогдоогүй" : saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>

        {questionImageUrl && (
          <div className="overflow-hidden rounded-[18px] border border-[#e7edf5] bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={questionImageUrl}
              alt="Шинэ асуултын зураг"
              className="w-full rounded-xl object-contain"
              style={{ maxHeight: 260 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
