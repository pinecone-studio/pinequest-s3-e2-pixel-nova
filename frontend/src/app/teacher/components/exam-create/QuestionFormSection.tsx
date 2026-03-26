import { useRef, useState, type ChangeEvent } from "react";
import { buttonGhost, inputClass, selectClass } from "../../styles";

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
        return;
      }
      window.alert("Зураг уншиж чадсангүй.");
    };
    reader.onerror = () => window.alert("Зураг уншиж чадсангүй.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-3 rounded-[24px] border border-[#dce5ef] bg-[#fbfdff] p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          className={inputClass}
          placeholder="Асуултаа оруулна уу"
          value={questionText ?? ""}
          onChange={(event) => setQuestionText(event.target.value)}
        />
        <div className="grid gap-1.5">
          <select
            className={selectClass}
            value={questionType}
            onChange={(event) =>
              setQuestionType(event.target.value as "text" | "open" | "mcq")
            }
          >
            <option value="text">Текст</option>
            <option value="open">Нөхөх</option>
            <option value="mcq">Сонголт</option>
          </select>
          <div className="grid gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Оноо
            </span>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={Number.isFinite(questionPoints) ? questionPoints : 1}
              onChange={(event) =>
                setQuestionPoints(Number(event.target.value || 1))
              }
              placeholder="Оноо"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-2xl border border-[#dce5ef] bg-white p-3">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={buttonGhost}
            onClick={() => imageInputRef.current?.click()}
            type="button"
          >
            {questionImageUrl ? "Зураг солих" : "Зураг нэмэх"}
          </button>
          {questionImageUrl && (
            <button
              className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => setQuestionImageUrl(undefined)}
              type="button"
            >
              Зураг устгах
            </button>
          )}
        </div>

        {questionImageUrl && (
          <div className="overflow-hidden rounded-2xl border border-[#dce5ef] bg-[#f8fbff] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={questionImageUrl}
              alt="Шинэ асуултын зураг"
              className="w-full rounded-xl border border-border object-contain"
              style={{ maxHeight: 280 }}
            />
          </div>
        )}
      </div>

      {questionType === "mcq" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {optionLabels.map((label, index) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-2xl border border-[#dce5ef] bg-white px-3 py-3"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground">
                {label}
              </span>
              <input
                className="w-full bg-transparent text-sm outline-none"
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
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Зөв хариулт
            </label>
            <div
              className="relative mt-1"
              tabIndex={0}
              onBlur={() => setCorrectOpen(false)}
            >
              <button
                className={`${selectClass} flex w-full items-center justify-between`}
                onClick={() => setCorrectOpen((prev) => !prev)}
                type="button"
              >
                <span>
                  {mcqOptions[questionCorrectIndex]
                    ? `${optionLabels[questionCorrectIndex] || "A"} - ${mcqOptions[questionCorrectIndex]}`
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
                className={`absolute z-20 mt-2 w-full rounded-xl border border-border bg-card p-2 text-sm shadow-xl transition ${
                  correctOpen
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 -translate-y-1"
                }`}
              >
                {optionLabels.map((label, index) => (
                  <button
                    key={label}
                    className={`w-full rounded-xl px-3 py-2 text-left transition ${
                      questionCorrectIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      setQuestionCorrectIndex(index);
                      setCorrectOpen(false);
                    }}
                    type="button"
                  >
                    {label}{" "}
                    {mcqOptions[index] ? `- ${mcqOptions[index]}` : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <input
          className={inputClass}
          placeholder="Зөв хариулт"
          value={questionAnswer ?? ""}
          onChange={(event) => setQuestionAnswer(event.target.value)}
        />
      )}
    </div>
  );
}
