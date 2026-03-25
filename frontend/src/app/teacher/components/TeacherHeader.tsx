import { useState } from "react";

type TeacherHeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notifications: { message: string; createdAt: string; read: boolean }[];
  onMarkRead?: (index: number) => void;
  roleControl?: React.ReactNode;
};

export default function TeacherHeader({
  theme,
  onToggleTheme,
  notifications,
  onMarkRead,
  roleControl,
}: TeacherHeaderProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
      <div>
        <h1 className="text-2xl font-semibold">Багшийн самбар</h1>
        <p className="text-sm text-muted-foreground">
          Шалгалт товлох, үүсгэх, өрөөг удирдах
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted"
          onClick={onToggleTheme}
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
            <path d="M12 3a1 1 0 0 0 0 2" />
            <path d="M12 19a1 1 0 0 0 0 2" />
            <path d="M4.93 4.93a1 1 0 0 0 1.41 1.41" />
            <path d="M17.66 17.66a1 1 0 0 0 1.41 1.41" />
            <path d="M3 12a1 1 0 0 0 2 0" />
            <path d="M19 12a1 1 0 0 0 2 0" />
            <path d="M4.93 19.07a1 1 0 0 0 1.41-1.41" />
            <path d="M17.66 6.34a1 1 0 0 0 1.41-1.41" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {theme === "dark" ? "Гэрэлтэй горим" : "Харанхуй горим"}
        </button>
        <div
          className="relative"
          tabIndex={0}
          onBlur={() => setOpen(false)}
        >
          <button
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted"
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className="relative">
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
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </span>
            Мэдэгдэл
          </button>
          <div
            className={`absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-card p-3 text-xs shadow-xl transition ${
              open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"
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
            {notifications.slice(0, 6).map((item, index) => (
              <button
                key={`${item.createdAt}-${index}`}
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                  item.read
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-primary/40 bg-primary/5"
                }`}
                onClick={() => onMarkRead?.(index)}
              >
                {item.message}
              </button>
            ))}
          </div>
        </div>
        {roleControl}
      </div>
    </header>
  );
}
