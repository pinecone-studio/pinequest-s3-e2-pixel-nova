const tabs = [
  { key: "Шалгалт", icon: "exam" },
  { key: "Дүн", icon: "results" },
  { key: "Хуваарь", icon: "schedule" },
  { key: "Шалгалтын гүйцэтгэл", icon: "performance" },
] as const;

type TabKey = (typeof tabs)[number]["key"];
type TabIconKey = (typeof tabs)[number]["icon"];

type TeacherSidebarProps = {
  activeTab: TabKey;
  setActiveTab: (value: TabKey) => void;
  currentUserName?: string | null;
};

function TabIcon({ icon, active }: { icon: TabIconKey; active: boolean }) {
  const iconClassName = `h-4 w-4 transition-colors ${
    active ? "text-primary" : "text-muted-foreground"
  }`;

  if (icon === "exam") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
        <path d="M6 3v15" />
        <path d="M10 7h4" />
        <path d="M10 11h4" />
      </svg>
    );
  }

  if (icon === "results") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
        <path d="M3 7h18" />
        <path d="M7 11v6" />
        <path d="M12 11v6" />
        <path d="M17 11v6" />
      </svg>
    );
  }

  if (icon === "schedule") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (icon === "performance") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 2 4-5" />
        <path d="M17 8h2v2" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClassName}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-6.08 0l-4.24 4.24" />
    </svg>
  );
}

export default function TeacherSidebar({
  activeTab,
  setActiveTab,
  currentUserName,
}: TeacherSidebarProps) {
  return (
    <header className="border-b border-border bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path
                d="M3 7l9-4 9 4-9 4-9-4Z"
                fill="currentColor"
                opacity="0.8"
              />
              <path
                d="M12 11l-9-4v4c0 2.5 4 4 9 4s9-1.5 9-4v-4l-9 4Z"
                fill="currentColor"
                opacity="0.6"
              />
              <path
                d="M21 15.5v4c0 2.5-4 4-9 4s-9-1.5-9-4v-4l9 4 9-4Z"
                fill="currentColor"
                opacity="0.4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EduCore
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Багшийн төв
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-wrap items-center justify-center gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                activeTab === item.key
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab(item.key)}
            >
              <TabIcon icon={item.icon} active={activeTab === item.key} />
              <span>{item.key}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground">
          <svg
            className="h-4 w-4 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M9 9h6M9 15h6" />
          </svg>
          <span>{currentUserName ?? "Багш"}</span>
        </div>
      </div>
    </header>
  );
}
