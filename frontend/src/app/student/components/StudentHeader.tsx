import { Bell, ChevronDown, CircleHelp, User2 } from "lucide-react";
import Image from "next/image";
import { useState, type FocusEvent, type ReactNode } from "react";
import type { NotificationItem, StudentTab } from "../types";
import {
  formatCompactStudentPoints,
  localizeStudentText,
} from "./student-ui-text";

const primaryTabs = ["Home", "Exams", "Progress"] as const;
const tabLabels: Record<(typeof primaryTabs)[number], string> = {
  Home: "Нүүр",
  Exams: "Шалгалт",
  Progress: "Ахиц",
};

type HeaderTab = (typeof primaryTabs)[number];

type StudentHeaderProps = {
  activeTab: StudentTab;
  currentUserName: string;
  currentUserInitials: string;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  xp: number;
  onTabChange: (value: HeaderTab) => void;
  onOpenProfile: () => void;
  onOpenHelp: () => void;
  roleControl?: ReactNode;
};

const closeOnBlur =
  (setter: (value: boolean) => void) => (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }
    setter(false);
  };

export default function StudentHeader({
  activeTab,
  currentUserName,
  currentUserInitials,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  xp,
  onTabChange,
  onOpenProfile,
  onOpenHelp,
  roleControl,
}: StudentHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full rounded-[36px] border border-[#e7ebfb] bg-white px-5 py-4 shadow-[0_20px_48px_rgba(77,93,138,0.07)] sm:px-7 lg:h-[88px] lg:px-8 lg:py-0">
      <div className="flex h-full flex-wrap items-center gap-4 lg:grid lg:grid-cols-[minmax(200px,1fr)_auto_minmax(220px,1fr)] lg:items-center lg:gap-6">
        {/* ── Logo ── */}
        <div className="flex min-w-[180px] shrink-0 items-center gap-3 lg:justify-self-start">
          <div className="overflow-hidden rounded-[14px]">
            <Image
              src="/group-web.svg"
              alt="Pinecone"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
          </div>
          <span className="text-[1rem] font-semibold tracking-[-0.03em] text-slate-900">
            Educore
          </span>
        </div>

        {/* ── Navigation pill ── */}
        <nav className="order-3 mx-auto grid h-[46px] w-full max-w-[280px] shrink-0 grid-cols-3 items-center gap-1 rounded-[20px] border border-[#e2e8fb] bg-[#f5f7ff] p-1 lg:order-none lg:justify-self-center">
          {primaryTabs.map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                className={`relative flex h-full min-w-0 items-center justify-center whitespace-nowrap rounded-[16px] px-3 text-[14px] font-medium tracking-[-0.015em] transition-all duration-150 ${
                  selected
                    ? "bg-white text-slate-900 shadow-[inset_0_-2.5px_0_0_#5c6cff,0_10px_20px_-16px_rgba(92,108,255,0.55)]"
                    : "text-[#94a3b8] hover:bg-white/60 hover:text-slate-600"
                }`}
                onClick={() => onTabChange(tab)}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </nav>

        {/* ── Right actions ── */}
        <div className="order-2 ml-auto flex shrink-0 items-center gap-1 rounded-full border border-[#edf0fb] bg-white px-2 py-2 shadow-[0_18px_38px_-28px_rgba(42,56,99,0.24)] lg:order-none lg:ml-0 lg:justify-self-end">
          {/* XP badge */}
          <div className="hidden h-[36px] items-center gap-1.5 rounded-full border border-[#fddcbb] bg-[#fff7ef] px-4 text-[12px] font-semibold text-[#f39a4a] sm:flex">
            <svg
              className="h-[15px] w-[15px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" />
            </svg>
            {formatCompactStudentPoints(xp)} XP
          </div>

          {/* Notification bell */}
          <div
            className="relative"
            tabIndex={0}
            onBlur={closeOnBlur(setNotificationsOpen)}
          >
            <button
              aria-label="Мэдэгдэл нээх"
              className="relative grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:text-slate-600"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell className="h-[17px] w-[17px]" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] -translate-y-[20%] translate-x-[8%] place-items-center rounded-full bg-[#f39a4a] px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            <div
              className={`absolute right-0 top-[calc(100%+0.6rem)] z-30 w-80 rounded-[24px] border border-[#eceefb] bg-white/98 p-4 shadow-[0_24px_60px_rgba(41,54,88,0.16)] backdrop-blur transition-all duration-200 ${
                notificationsOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Мэдэгдэл
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentUserName} · Сүүлийн мэдээллүүд
                  </div>
                </div>
                <span className="rounded-full bg-[#fff1e8] px-2.5 py-1 text-[11px] font-semibold text-[#ff8a3d]">
                  {unreadCount} уншаагүй
                </span>
              </div>

              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  className="mt-3 rounded-xl border border-[#eceefb] bg-[#fafbff] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                  onClick={onMarkAllNotificationsRead}
                >
                  Бүгдийг уншсан болгох
                </button>
              )}

              <div className="mt-3 space-y-2">
                {notifications.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-[#e5e7f4] bg-[#fafbff] px-4 py-5 text-sm text-slate-400">
                    Шинэ мэдэгдэл алга.
                  </div>
                )}

                {notifications.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onMarkNotificationRead(item.id)}
                    className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                      item.status === "read"
                        ? "border-[#efeef8] bg-[#fafbff]"
                        : "border-[#d7d2ff] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          item.severity === "critical"
                            ? "bg-red-500"
                            : item.severity === "warning"
                              ? "bg-amber-500"
                              : item.severity === "success"
                                ? "bg-emerald-500"
                                : "bg-[#5c6cff]"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {localizeStudentText(item.title)}
                        </div>
                        <div className="mt-0.5 text-sm text-slate-600">
                          {localizeStudentText(item.message)}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString("mn-MN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User menu */}
          <div
            className="relative"
            tabIndex={0}
            onBlur={closeOnBlur(setMenuOpen)}
          >
            <button
              aria-label="Дансны цэс нээх"
              className="flex h-9 items-center gap-1.5 rounded-full pl-0.5 pr-1 text-slate-400 transition hover:text-slate-600"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-gradient-to-br from-[#7b67ff] to-[#9a7dff] text-[13px] font-semibold text-white">
                {currentUserInitials}
              </span>
              <ChevronDown
                className={`hidden h-[15px] w-[15px] text-slate-400 transition-transform duration-200 sm:block ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User dropdown */}
            <div
              className={`absolute right-0 top-[calc(100%+0.6rem)] z-30 w-[min(24rem,calc(100vw-2rem))] rounded-[24px] border border-[#eceefb] bg-white/98 p-4 shadow-[0_24px_60px_rgba(41,54,88,0.16)] backdrop-blur transition-all duration-200 ${
                menuOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div className="rounded-[18px] bg-gradient-to-r from-[#f4f6ff] via-[#faf5ff] to-[#fff6f0] p-4">
                <div className="text-xs text-slate-400">
                  Нэвтэрсэн хэрэглэгч
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {currentUserName}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  className="flex items-center gap-2 rounded-[16px] border border-[#eceefb] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenProfile();
                    setMenuOpen(false);
                  }}
                >
                  <User2 className="h-4 w-4 text-[#5c6cff]" />
                  Профайл
                </button>
                <button
                  className="flex items-center gap-2 rounded-[16px] border border-[#eceefb] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenHelp();
                    setMenuOpen(false);
                  }}
                >
                  <CircleHelp className="h-4 w-4 text-[#5c6cff]" />
                  Тусламж
                </button>
              </div>

              {roleControl && (
                <div className="mt-3 rounded-[18px] border border-[#eceefb] bg-[#fafbff] p-3">
                  {roleControl}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
