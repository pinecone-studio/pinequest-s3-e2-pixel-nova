"use client";

import { useState, type ReactNode } from "react";
import { Bell, GraduationCap, MoonStar, SunMedium } from "lucide-react";

type TeacherHeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notifications: { message: string; createdAt: string; read: boolean }[];
  onMarkRead?: (index: number) => void;
  roleControl?: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: readonly string[];
};

export default function TeacherHeader({
  theme,
  onToggleTheme,
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
    <header className="sticky top-0 z-40 border-b border-[#e8edf3] bg-white">
      <div className="relative mx-auto flex h-14 w-full max-w-[1480px] items-center px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#2563eb] text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">PineQuest</span>
        </div>

        {/* Tabs — centered */}
        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 px-4 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[#2563eb]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#2563eb]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-[#f1f5f9] hover:text-slate-800"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </button>

          <div className="relative" tabIndex={0} onBlur={() => setOpen(false)}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-[#f1f5f9] hover:text-slate-800"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#2563eb] px-1 text-[9px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div
              className={`absolute right-0 z-20 mt-2 w-[300px] origin-top-right rounded-2xl border border-[#d5dfeb] bg-white p-3 shadow-xl transition ${
                open
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Мэдэгдэл
              </div>
              {notifications.length === 0 && (
                <div className="rounded-xl bg-[#f8fafc] px-4 py-3 text-sm text-slate-400">
                  Одоогоор мэдэгдэл алга.
                </div>
              )}
              {notifications.slice(0, 6).map((item, index) => (
                <button
                  key={`${item.createdAt}-${index}`}
                  type="button"
                  className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                    item.read
                      ? "border-[#dce5ef] bg-[#f8fafc] text-slate-500"
                      : "border-[#bfdbfe] bg-[#eff6ff] text-slate-800"
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
      </div>
    </header>
  );
}
