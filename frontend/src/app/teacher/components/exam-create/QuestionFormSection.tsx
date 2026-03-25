import { useState } from "react";
import { inputClass, selectClass } from "../../styles";

type QuestionFormSectionProps = {
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: "text" | "open" | "mcq";
  setQuestionType: (value: "text" | "open" | "mcq") => void;
  mcqOptions: string[];
  setMcqOptions: (value: string[]) => void;
  questionAnswer: string;
  setQuestionAnswer: (value: string) => void;
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
  questionPoints,
  setQuestionPoints,
  questionCorrectIndex,
  setQuestionCorrectIndex,
}: QuestionFormSectionProps) {
  const [correctOpen, setCorrectOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 md:grid-cols-[1fr_200px]">
        <input
          className={inputClass}
          placeholder="Асуултын текст"
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

      {questionType === "mcq" ? (
        <div className="grid gap-2 md:grid-cols-2">
          {optionLabels.map((label, index) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2"
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
                    className={`w-full rounded-lg px-3 py-2 text-left transition ${
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
