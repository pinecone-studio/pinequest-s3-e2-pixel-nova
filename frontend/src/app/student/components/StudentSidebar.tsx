import type { MutableRefObject } from "react";

const tabs = [
  { key: "Шалгалт", icon: "exam" },
  { key: "Дүн", icon: "grades" },
  { key: "Тохиргоо", icon: "settings" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

type StudentSidebarProps = {
  collapsed: boolean;
  setCollapsed: (value: boolean | ((value: boolean) => boolean)) => void;
  activeTab: TabKey;
  setActiveTab: (value: TabKey) => void;
  sidebarTimerRef: MutableRefObject<number | null>;
};

export default function StudentSidebar({
  collapsed,
  setCollapsed,
  activeTab,
  setActiveTab,
  sidebarTimerRef,
}: StudentSidebarProps) {
  return (
    <aside
      className={`border-r border-border bg-card/70 backdrop-blur transition-all duration-500 ease-in-out overflow-hidden flex flex-col group ${
        collapsed ? "w-20" : "w-64"
      }`}
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
        }, 800);
      }}
    >
      <div className="p-4 pb-3 transition-all duration-500">
        <div className="flex items-center gap-3 transition-all duration-500">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-500 flex-shrink-0 group-hover:scale-110">
            <svg
              className="h-5 w-5 transition-transform duration-500"
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
          <div
            className={`transition-all duration-500 ${
              collapsed ? "hidden opacity-0" : "block opacity-100"
            }`}
          >
            <h1 className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EduCore
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Learning Hub
            </p>
          </div>
        </div>

        <button
          className={`mt-4 w-full group/btn relative rounded-xl border border-border/50 bg-muted/50 hover:bg-muted hover:border-border px-3 py-2.5 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground transition-all duration-500 overflow-hidden flex items-center gap-2 justify-center group-hover:gap-3 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <span
            className={`transition-all duration-500 ${
              collapsed ? "hidden opacity-0 w-0" : "inline opacity-100 w-auto"
            }`}
          >
            {collapsed ? "Өргөх" : "Хураах"}
          </span>
          <svg
            className={`h-4 w-4 transition-transform duration-500 flex-shrink-0 ${
              collapsed ? "rotate-0" : "rotate-180"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto scrollbar-hide">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`group/nav relative w-full flex items-center transition-all duration-500 ease-in-out ${
              collapsed ? "justify-center px-2" : "gap-3 px-4"
            } py-3 rounded-xl overflow-hidden ${
              activeTab === item.key
                ? "bg-gradient-to-r from-primary/25 to-primary/5 border border-primary/40 shadow-lg"
                : "border border-transparent hover:border-border/50 hover:bg-muted/40"
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${
                activeTab === item.key
                  ? "opacity-100"
                  : "group-hover/nav:opacity-50"
              }`}
            />
            <span
              className={`relative grid h-10 w-10 place-items-center rounded-lg border flex-shrink-0 transition-all duration-500 ${
                activeTab === item.key
                  ? "border-primary/50 bg-gradient-to-br from-primary/30 to-primary/10 text-primary shadow-md scale-100"
                  : "border-border/40 bg-card text-muted-foreground group-hover/nav:text-foreground group-hover/nav:border-border/60 group-hover/nav:bg-muted/60 group-hover/nav:scale-105"
              }`}
            >
              {item.key === "Шалгалт" && (
                <svg
                  className={`h-5 w-5 transition-all duration-500 ${
                    activeTab === item.key
                      ? "text-primary"
                      : "text-muted-foreground group-hover/nav:text-foreground"
                  }`}
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
              )}
              {item.key === "Дүн" && (
                <svg
                  className={`h-5 w-5 transition-all duration-500 ${
                    activeTab === item.key
                      ? "text-primary"
                      : "text-muted-foreground group-hover/nav:text-foreground"
                  }`}
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
              )}
              {item.key === "Тохиргоо" && (
                <svg
                  className={`h-5 w-5 transition-all duration-500 ${
                    activeTab === item.key
                      ? "text-primary"
                      : "text-muted-foreground group-hover/nav:text-foreground"
                  }`}
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
              )}

              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg opacity-0 transition-all duration-500 ease-out group-hover/nav:ml-4 group-hover/nav:opacity-100 group-hover/nav:shadow-xl translate-x-4 scale-90 group-hover/nav:translate-x-0 group-hover/nav:scale-100 z-50">
                  {item.key}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card" />
                </span>
              )}
            </span>

            <span
              className={`relative font-medium text-sm transition-all duration-500 overflow-hidden ${
                collapsed
                  ? "w-0 -translate-x-4 opacity-0"
                  : "w-auto translate-x-0 opacity-100"
              }`}
            >
              {item.key}
            </span>

            {activeTab === item.key && !collapsed && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-primary via-primary to-primary/50 rounded-l-full transition-all duration-500 shadow-lg" />
            )}
          </button>
        ))}
      </nav>

      <div
        className={`border-t border-border/30 p-3 transition-all duration-500 ${
          collapsed ? "text-center" : ""
        }`}
      >
        <button
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-500 justify-center ${
            collapsed ? "" : "justify-start"
          }`}
        >
          <svg
            className="h-4 w-4 flex-shrink-0 transition-transform duration-500 group-hover:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M9 9h6M9 15h6" />
          </svg>
          {!collapsed && (
            <span className="transition-opacity duration-500">Гарах</span>
          )}
        </button>
      </div>
    </aside>
  );
}
