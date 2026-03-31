import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

type QuestionTypeValue = "open" | "mcq" | "text";

type QuestionTypeDropdownProps = {
  value: QuestionTypeValue;
  onChange: (value: "open" | "mcq") => void;
  className?: string;
};

const typeOptions = [
  { value: "open" as const, label: "Задгай даалгавар" },
  { value: "mcq" as const, label: "Сонголттой" },
];

export default function QuestionTypeDropdown({
  value,
  onChange,
  className = "",
}: QuestionTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const normalizedValue = value === "text" ? "open" : value;
  const selectedLabel = useMemo(
    () =>
      typeOptions.find((option) => option.value === normalizedValue)?.label ??
      "Задгай даалгавар",
    [normalizedValue],
  );

  return (
    <div
      className={`relative ${className}`}
      tabIndex={0}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[52px] w-full items-center justify-between rounded-[18px] border border-[#d8e0ea] bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.28)] transition hover:border-[#bfd3ff] focus:border-[#2563eb] focus:outline-none focus:ring-4 focus:ring-[#dbeafe]"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute z-30 mt-2 w-full rounded-[20px] border border-[#d8e0ea] bg-white p-2 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.3)] transition ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {typeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
              normalizedValue === option.value
                ? "bg-[#2563eb] text-white"
                : "text-slate-700 hover:bg-[#f5f8ff]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
