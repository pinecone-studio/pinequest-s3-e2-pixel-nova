import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  fullScreen?: boolean;
  compact?: boolean;
  children?: ReactNode;
};

export default function LoadingScreen({
  title = "Ачаалж байна",
  subtitle = "Өгөгдлийг бэлдэж байна. Түр хүлээнэ үү.",
  className,
  fullScreen = false,
  compact = false,
  children,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        fullScreen
          ? "fixed inset-0 z-50"
          : "min-h-[420px] w-full rounded-[32px] border border-[#dbe5f1]",
        "grid place-items-center overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] text-slate-900",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_42%)]" />
      <div className="relative flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-7 grid place-items-center">
          <div className="absolute h-24 w-24 rounded-full bg-[#2563eb]/18 blur-2xl" />
          <div className="loading-ring h-[72px] w-[72px] rounded-full border border-[#d7e3f5]" />
          <div className="absolute h-14 w-14 rounded-full border border-[#e5edf8] bg-white/90 backdrop-blur-md" />
          <div className="loading-core absolute h-4 w-4 rounded-full bg-[#4f7cff] shadow-[0_0_24px_rgba(79,124,255,0.45)]" />
        </div>
        <div className={cn("space-y-2", compact && "space-y-1") }>
          <h2 className={cn("font-semibold tracking-[-0.03em] text-slate-900", compact ? "text-xl" : "text-2xl")}>
            {title}
          </h2>
          <p className={cn("mx-auto max-w-sm text-slate-500", compact ? "text-sm" : "text-sm leading-6")}>
            {subtitle}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.32em] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4f7cff]" />
          Syncing
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Preparing
          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
          Loading
        </div>
      </div>
      {children}
    </div>
  );
}
