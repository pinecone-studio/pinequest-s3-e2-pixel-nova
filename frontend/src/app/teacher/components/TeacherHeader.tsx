type TeacherHeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
};

export default function TeacherHeader({
  theme,
  onToggleTheme,
  onLogout,
}: TeacherHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
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
        <button className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted">
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
        <button
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
          onClick={onLogout}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Гарах
        </button>
      </div>
    </header>
  );
}
