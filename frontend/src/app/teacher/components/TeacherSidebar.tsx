import type { MutableRefObject } from "react";

const tabs = [
  { key: "Шалгалт", icon: "exam" },
  { key: "Дүн", icon: "results" },
  { key: "Тохиргоо", icon: "settings" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

type TeacherSidebarProps = {
  collapsed: boolean;
  setCollapsed: (value: boolean | ((value: boolean) => boolean)) => void;
  activeTab: TabKey;
  setActiveTab: (value: TabKey) => void;
  sidebarTimerRef: MutableRefObject<number | null>;
  currentUserName?: string | null;
};

export default function TeacherSidebar({
  collapsed,
  setCollapsed,
  activeTab,
  setActiveTab,
  sidebarTimerRef,
  currentUserName,
}: TeacherSidebarProps) {
  return (
    <aside
      className="border-r border-border bg-card/70 p-4 backdrop-blur transition-[width,transform,opacity] duration-300 ease-out overflow-hidden"
      onMouseEnter={() => {
        if (sidebarTimerRef.current) {
          window.clearTimeout(sidebarTimerRef.current);
          sidebarTimerRef.current = null;
        }
        setCollapsed(false);
      }}
      onMouseLeave={() => {
        if (sidebarTimerRef.current) {
          window.clearTimeout(sidebarTimerRef.current);
        }
        sidebarTimerRef.current = window.setTimeout(() => {
          setCollapsed(true);
        }, 300);
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-muted text-primary">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7l9-4 9 4-9 4-9-4Z" />
            <path d="M7 10v4c0 2.5 4 4 5 4s5-1.5 5-4v-4" />
            <path d="M4 12v4" />
          </svg>
        </span>
        {!collapsed && <span>EduCore</span>}
      </div>
      <button
        className="mt-4 w-full rounded-xl border border-border bg-muted px-3 py-2 text-[11px] uppercase tracking-wide"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? "Өргөх" : "Хураах"}
      </button>
      <nav className="mt-6 space-y-2 text-sm">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`group flex w-full items-center ${
              collapsed ? "justify-center gap-0 px-2" : "gap-3 px-3"
            } rounded-full border py-2 text-left text-[13px] transition duration-200 ease-out hover:scale-[1.01] hover:ring-1 hover:ring-primary/30 ${
              activeTab === item.key
                ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                : "border-transparent hover:border-border hover:bg-muted"
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            <span
              className={`relative grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold transition ${
                activeTab === item.key
                  ? "border-primary/30 bg-linear-to-br from-primary/20 to-transparent text-primary"
                  : "border-border bg-card text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {item.key === "Шалгалт" && (
                <svg
                  className={`h-4 w-4 transition group-hover:scale-110 ${
                    activeTab === item.key
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
                  <path d="M6 3v15" />
                </svg>
              )}
              {item.key === "Дүн" && (
                <svg
                  className={`h-4 w-4 transition group-hover:scale-110 ${
                    activeTab === item.key
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19V5" />
                  <path d="M4 19h16" />
                  <path d="M8 15v-4" />
                  <path d="M12 15V9" />
                  <path d="M16 15v-6" />
                </svg>
              )}
              {item.key === "Тохиргоо" && (
                <svg
                  className={`h-4 w-4 transition group-hover:scale-110 ${
                    activeTab === item.key
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                </svg>
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground opacity-0 shadow-sm transition duration-200 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-hover:shadow-md translate-x-1 scale-95">
                  {item.key}
                </span>
              )}
            </span>
            <span
              className={`transition-all duration-200 ${
                collapsed
                  ? "pointer-events-none -translate-x-2 opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              {item.key}
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
        {!collapsed && currentUserName}
      </div>
    </aside>
  );
}
