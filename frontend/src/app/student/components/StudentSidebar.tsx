import {
  ComputerIcon,
  GraduationCap,
  HelpCircle,
  List,
  Settings,
  User,
} from "lucide-react";
import type { MutableRefObject } from "react";

const tabs = [
  { key: "Шалгалт", icon: "exam" },
  { key: "Дүн", icon: "grades" },
  { key: "Профайл", icon: "profile" },
  { key: "Тохиргоо", icon: "settings" },
  { key: "Тусламж", icon: "help" },
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
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-500 flex-shrink-0 group-hover:scale-110">
            <GraduationCap />
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
              Суралцах төв
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 px-3 py-4 overflow-y-auto scrollbar-hide">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`group/nav relative w-full flex items-center transition-all duration-500 ease-in-out ${
              collapsed ? "justify-center px-2" : "gap-3 px-4"
            } py-3 rounded-2xl overflow-hidden ${
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
              className={`relative grid h-11 w-11 place-items-center rounded-2xl border flex-shrink-0 transition-all duration-500 ${
                activeTab === item.key
                  ? "border-primary/50 bg-gradient-to-br from-primary/30 to-primary/10 text-primary shadow-md scale-100"
                  : "border-border/40 bg-card text-muted-foreground group-hover/nav:text-foreground group-hover/nav:border-border/60 group-hover/nav:bg-muted/60 group-hover/nav:scale-105"
              }`}
            >
              {item.key === "Шалгалт" && <ComputerIcon className="w-5 h-5" />}
              {item.key === "Дүн" && <List className="w-5 h-5" />}
              {item.key === "Тохиргоо" && <Settings className="w-5 h-5" />}
              {item.key === "Профайл" && <User className="w-5 h-5" />}
              {item.key === "Тусламж" && <HelpCircle className="w-5 h-5" />}

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
