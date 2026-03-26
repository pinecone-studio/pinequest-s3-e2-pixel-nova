import type { MutableRefObject } from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Settings,
  Trophy,
} from "lucide-react";
import { badgeClass } from "../styles";

const tabs = [
  { key: "Шалгалт үүсгэх", icon: LayoutGrid },
  { key: "Хадгалсан шалгалт", icon: ClipboardList },
  { key: "XP харах", icon: Trophy },
  { key: "Дүн", icon: BookOpen },
  { key: "Сурагч", icon: GraduationCap },
  { key: "Тохиргоо", icon: Settings },
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
      className={`border-r border-[#dce5ef] bg-white/88 backdrop-blur transition-all duration-300 ease-out ${
        collapsed ? "w-[84px]" : "w-[280px]"
      } overflow-hidden`}
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
      <div className="flex h-full flex-col px-3 py-4">
        <div className="rounded-[28px] border border-[#dce5ef] bg-[#f8fbff] p-3 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2563eb] text-white shadow-[0_16px_32px_-20px_rgba(37,99,235,0.7)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">EduCore</div>
                <div className="text-xs text-slate-500">Teacher Panel</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className={badgeClass}>UX Standard</span>
              <button
                className="rounded-xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#eff6ff]"
                onClick={() => setCollapsed((prev) => !prev)}
                type="button"
              >
                Хураах
              </button>
            </div>
          )}
        </div>

        <nav className="mt-6 flex-1 space-y-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                className={`group relative flex w-full items-center rounded-2xl px-3 py-3 text-left transition ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  isActive
                    ? "border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] shadow-[0_16px_32px_-28px_rgba(37,99,235,0.55)]"
                    : "border border-transparent text-slate-600 hover:border-[#dce5ef] hover:bg-white"
                }`}
                onClick={() => setActiveTab(item.key)}
                type="button"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${
                    isActive
                      ? "border-[#bfdbfe] bg-white text-[#2563eb]"
                      : "border-[#dce5ef] bg-[#f8fafc] text-slate-500"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {!collapsed && (
                  <span className="truncate text-sm font-medium">{item.key}</span>
                )}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-[#dce5ef] bg-white px-3 py-2 text-xs font-semibold text-slate-700 opacity-0 shadow-lg transition group-hover:opacity-100">
                    {item.key}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="rounded-[24px] border border-[#dce5ef] bg-white px-3 py-3 text-center shadow-[0_18px_38px_-34px_rgba(15,23,42,0.2)]">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#eff6ff] text-sm font-semibold text-[#1d4ed8]">
            {(currentUserName ?? "Б").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {currentUserName ?? "Багш"}
              </div>
              <div className="text-xs text-slate-500">Teacher account</div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
