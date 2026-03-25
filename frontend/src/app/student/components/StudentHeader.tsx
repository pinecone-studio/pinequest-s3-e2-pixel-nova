import { LogOut, MoonIcon } from "lucide-react";
import { useState } from "react";

type StudentHeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
  notifications: { message: string; createdAt: string }[];
};

export default function StudentHeader({
  theme,
  onToggleTheme,
  onLogout,
  notifications,
}: StudentHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
      <div>
        <h1 className="text-2xl font-semibold">Сурагчийн самбар</h1>
        <p className="text-sm text-muted-foreground">
          Бодит цагийн шалгалтын өрөө ба явц
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted"
          onClick={onToggleTheme}
        >
          <MoonIcon />
          {theme === "dark" ? "Гэрэлтэй горим" : "Харанхуй горим"}
        </button>
        <div className="relative" tabIndex={0} onBlur={() => setOpen(false)}>
          <button
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted"
            onClick={() => setOpen((prev) => !prev)}
          >
            <svg
              className="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Мэдэгдэл
          </button>
          <div
            className={`absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-card p-3 text-xs shadow-xl transition ${
              open
                ? "opacity-100 translate-y-0"
                : "pointer-events-none opacity-0 translate-y-1"
            }`}
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Сүүлийн мэдэгдэл
            </div>
            {notifications.length === 0 && (
              <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                Одоогоор мэдэгдэл алга.
              </div>
            )}
            {notifications.slice(0, 6).map((item) => (
              <div
                key={item.createdAt}
                className="mt-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground"
              >
                {item.message}
              </div>
            ))}
          </div>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Гарах
        </button>
      </div>
    </header>
  );
}
