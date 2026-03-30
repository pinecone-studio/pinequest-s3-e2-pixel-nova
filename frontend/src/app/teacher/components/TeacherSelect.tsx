import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type TeacherSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  label?: string;
  helperText?: string;
  options: Option[];
  leadingIcon?: ReactNode;
  compact?: boolean;
};

export default function TeacherSelect({
  label,
  helperText,
  options,
  leadingIcon,
  compact = false,
  className = "",
  ...props
}: TeacherSelectProps) {
  return (
    <label className="grid gap-2.5">
      {label && (
        <span className="text-[16px] font-semibold tracking-[-0.02em] text-slate-900">
          {label}
        </span>
      )}
      {helperText && <span className="text-[12px] text-slate-500">{helperText}</span>}
      <span
        className={`relative block overflow-hidden rounded-2xl border border-[#d5dfeb] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#dbeafe] ${compact ? "min-w-[140px]" : ""}`}
      >
        {leadingIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leadingIcon}
          </span>
        )}
        <select
          {...props}
          className={`h-full w-full appearance-none bg-transparent py-3 pr-11 text-sm text-slate-900 outline-none ${leadingIcon ? "pl-11" : "pl-4"} ${compact ? "min-h-[46px]" : "min-h-[52px]"} ${className}`}
        >
          {options.map((option) => (
            <option
              key={`${option.value}-${option.label}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </span>
      </span>
    </label>
  );
}
