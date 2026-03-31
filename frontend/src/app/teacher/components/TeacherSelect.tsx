import { ChevronDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type TeacherSelectChangeEvent = {
  target: { value: string };
  currentTarget: { value: string; blur: () => void };
};

type TeacherSelectProps = {
  label?: string;
  helperText?: string;
  options: Option[];
  leadingIcon?: ReactNode;
  compact?: boolean;
  className?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (event: TeacherSelectChangeEvent) => void;
  onWheel?: (event: { currentTarget: { blur: () => void } }) => void;
  placeholder?: string;
};

export default function TeacherSelect({
  label,
  helperText,
  options,
  leadingIcon,
  compact = false,
  className = "",
  value = "",
  disabled = false,
  onChange,
  onWheel,
  placeholder,
}: TeacherSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const visibleLabel = selectedOption?.label ?? placeholder ?? options[0]?.label ?? "Сонгоно уу";

  const emitChange = (nextValue: string) => {
    onChange?.({
      target: { value: nextValue },
      currentTarget: {
        value: nextValue,
        blur: () => setOpen(false),
      },
    });
  };

  return (
    <label className="grid gap-2.5">
      {label && (
        <span className="text-[16px] font-semibold tracking-[-0.02em] text-slate-900">
          {label}
        </span>
      )}
      {helperText && <span className="text-[12px] text-slate-500">{helperText}</span>}
      <div
        className={`relative ${compact ? "min-w-[140px]" : ""}`}
        tabIndex={disabled ? -1 : 0}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setOpen(false);
        }}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          onWheel={() => onWheel?.({ currentTarget: { blur: () => setOpen(false) } })}
          className={`flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#d5dfeb] bg-white py-3 pr-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-[#2563eb] focus:outline-none focus:ring-4 focus:ring-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-60 ${leadingIcon ? "pl-11" : "pl-4"} ${compact ? "min-h-[46px]" : "min-h-[52px]"} ${className}`}
        >
          {leadingIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {leadingIcon}
            </span>
          )}
          <span className={`truncate text-left ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
            {visibleLabel}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <div
          className={`absolute z-30 mt-2 w-full rounded-2xl border border-[#d5dfeb] bg-white p-2 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.3)] transition ${
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  disabled={option.disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (option.disabled) return;
                    emitChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    option.disabled
                      ? "cursor-not-allowed text-slate-300"
                      : selected
                        ? "bg-[#2563eb] text-white"
                        : "text-slate-700 hover:bg-[#f8fbff]"
                  }`}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </label>
  );
}
