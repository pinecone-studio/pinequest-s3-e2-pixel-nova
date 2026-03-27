import { useRef, useState, type ChangeEvent } from "react";
import {
  buttonGhost,
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
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="grid gap-2">
          <span className={labelClass}>Асуулт</span>
          <textarea
            className={`${inputClass} min-h-[88px] resize-y py-3`}
            placeholder="Асуултаа оруулна уу"
            value={questionText ?? ""}
            onChange={(event) => setQuestionText(event.target.value)}
          />
        </label>

        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className={labelClass}>Төрөл</span>
            <select
              className={`${selectClass} h-12`}
              value={questionType}
              onChange={(event) =>
                setQuestionType(event.target.value as "text" | "open" | "mcq")
              }
            >
              <option value="text">Текст</option>
              <option value="open">Задгай</option>
              <option value="mcq">Олон сонголт</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Оноо</span>
            <input
              type="number"
              min={1}
              className={`${inputClass} h-12`}
              value={Number.isFinite(questionPoints) ? questionPoints : 1}
              onChange={(event) =>
                setQuestionPoints(Number(event.target.value || 1))
              }
              placeholder="Оноо"
            />
          </label>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            className={buttonGhost}
            onClick={() => imageInputRef.current?.click()}
            type="button"
          >
            {questionImageUrl ? "Зураг солих" : "Зураг нэмэх"}
          </button>
          {questionImageUrl && (
            <button
              className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
              onClick={() => setQuestionImageUrl(undefined)}
              type="button"
            >
              Зураг устгах
            </button>
          )}
        </div>

        {questionImageUrl && (
          <div className="mt-3 overflow-hidden rounded-[18px] border border-[#e7edf5] bg-white p-3">
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

      {questionType === "mcq" ? (
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            {optionLabels.map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-[18px] border border-[#e7edf5] bg-[#f8fbff] px-3 py-3"
              >
                <span className="grid h-7 w-7 place-items-center rounded-xl border border-[#d8e1ec] bg-white text-xs font-semibold text-slate-500">
                  {label}
                </span>
                <input
                  className="w-full bg-transparent text-sm text-slate-800 outline-none"
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

          <div className="max-w-sm">
            <label className="grid gap-2">
              <span className={labelClass}>Зөв хариулт</span>
              <div
                className="relative"
                tabIndex={0}
                onBlur={() => setCorrectOpen(false)}
              >
                <button
                  className={`${selectClass} flex h-12 w-full items-center justify-between`}
                  onClick={() => setCorrectOpen((prev) => !prev)}
                  type="button"
                >
                  <span>
                    {mcqOptions[questionCorrectIndex]
                      ? `${optionLabels[questionCorrectIndex]}. ${mcqOptions[questionCorrectIndex]}`
                      : "Зөв хариулт сонгох"}
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
          </div>
        </div>
      ) : (
        <label className="grid gap-2">
          <span className={labelClass}>Хариулт</span>
          <input
            className={`${inputClass} h-12`}
            placeholder="Хариулт"
            value={questionAnswer ?? ""}
            onChange={(event) => setQuestionAnswer(event.target.value)}
          />
        </label>
      )}
    </div>
  );
}
