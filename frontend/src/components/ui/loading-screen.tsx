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
          : "min-h-[420px] w-full rounded-[32px] border border-[#1f2937]",
        "grid place-items-center overflow-hidden bg-[#050816] text-white",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.2),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.16),_transparent_42%)]" />
      <div className="relative flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-7 grid place-items-center">
          <div className="absolute h-24 w-24 rounded-full bg-[#2563eb]/20 blur-2xl" />
          <div className="loading-ring h-[72px] w-[72px] rounded-full border border-white/12" />
          <div className="absolute h-14 w-14 rounded-full border border-white/8 bg-white/5 backdrop-blur-md" />
          <div className="loading-core absolute h-4 w-4 rounded-full bg-[#60a5fa] shadow-[0_0_24px_rgba(96,165,250,0.8)]" />
        </div>
        <div className={cn("space-y-2", compact && "space-y-1") }>
          <h2 className={cn("font-semibold tracking-[-0.03em] text-white", compact ? "text-xl" : "text-2xl")}>
            {title}
          </h2>
          <p className={cn("mx-auto max-w-sm text-white/60", compact ? "text-sm" : "text-sm leading-6")}>
            {subtitle}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.32em] text-white/35">
          <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
          Syncing
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          Preparing
          <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
          Loading
        </div>
      </div>
      {children}
    </div>
  );
}
