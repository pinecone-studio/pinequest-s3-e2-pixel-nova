import type { ReactNode } from "react";

type TeacherEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function TeacherEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: TeacherEmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-[28px] border border-dashed border-[#d8e3f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fe_100%)] px-6 py-10 text-center shadow-[0_18px_34px_-34px_rgba(15,23,42,0.22)] ${className}`}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-[0_14px_30px_-24px_rgba(37,99,235,0.5)]">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-slate-900">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-[#d7e3f4] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eff6ff] hover:text-slate-900"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
