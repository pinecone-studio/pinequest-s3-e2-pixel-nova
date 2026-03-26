import { useState, type ReactNode } from "react";
import { Bell, GraduationCap } from "lucide-react";

export type TeacherNavTab = string;

type TeacherHeaderProps = {
  notifications: { message: string; createdAt: string; read: boolean }[];
  onMarkRead?: (index: number) => void;
  roleControl?: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: readonly string[];
};

export default function TeacherHeader({
  notifications,
  onMarkRead,
  roleControl,
  activeTab,
  setActiveTab,
  tabs,
}: TeacherHeaderProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[#dce5ef] bg-white/95 px-6 py-0 shadow-[0_2px_16px_-6px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="flex shrink-0 items-center gap-2 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#2563eb] text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.7)]">
          <GraduationCap className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-slate-900">PineQuest</span>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap px-4 py-[18px] text-sm font-medium transition-colors ${
                isActive
                  ? "text-[#2563eb]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2563eb]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2 py-3">
        <div className="relative" tabIndex={0} onBlur={() => setOpen(false)}>
          <button
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#dce5ef] bg-white text-slate-500 transition hover:bg-[#f8fafc]"
            onClick={() => setOpen((prev) => !prev)}
            type="button"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#2563eb] px-1 text-[9px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <div
            className={`absolute right-0 z-20 mt-3 w-[320px] origin-top-right rounded-[24px] border border-[#d5dfeb] bg-white p-3 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.35)] transition ${
              open
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-1 opacity-0"
            }`}
          >
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Сүүлийн мэдэгдэл
            </div>
            {notifications.length === 0 && (
              <div className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
                Одоогоор мэдэгдэл алга.
              </div>
            )}
            {notifications.slice(0, 6).map((item, index) => (
              <button
                key={`${item.createdAt}-${index}`}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  item.read
                    ? "border-[#dce5ef] bg-[#f8fafc] text-slate-500"
                    : "border-[#bfdbfe] bg-[#eff6ff] text-slate-800"
                }`}
                onClick={() => onMarkRead?.(index)}
                type="button"
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
