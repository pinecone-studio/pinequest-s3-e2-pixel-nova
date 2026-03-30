import {
  Bell,
  ChevronDown,
  CircleHelp,
  MoonIcon,
  Settings,
  User2,
} from "lucide-react";
import { useState, type FocusEvent, type ReactNode } from "react";
import type { NotificationItem, StudentTab } from "../types";

const primaryTabs = ["Home", "Exams", "Progress", "Leaderboard"] as const;
const tabLabels: Record<(typeof primaryTabs)[number], string> = {
  Home: "Нүүр",
  Exams: "Шалгалт",
  Progress: "Ахиц",
  Leaderboard: "Тэргүүлэгчид",
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
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onToggleTheme: () => void;
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
  onOpenSettings,
  onOpenHelp,
  onToggleTheme,
  roleControl,
}: StudentHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="rounded-[28px] border border-[#eceaf7] bg-white/95 px-4 py-3 shadow-[0_20px_60px_rgba(55,70,110,0.08)] backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center gap-4 xl:flex-nowrap xl:justify-between">
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#5c6cff] to-[#7b61ff] text-white shadow-[0_14px_30px_rgba(92,108,255,0.3)]">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4 4.5 8 12 12l7.5-4L12 4Z" />
              <path d="M7 10.7V14c0 1.8 2.2 3.3 5 3.3s5-1.5 5-3.3v-3.3" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
              EduCore LMS
            </div>
            <div className="text-xs text-slate-400">Сурагчийн орчин</div>
          </div>
        </div>

        <nav className="order-3 flex w-full flex-wrap items-center gap-2 xl:order-2 xl:w-auto xl:justify-center">
          {primaryTabs.map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                className={`relative rounded-xl px-3 py-2 text-sm font-medium transition cursor-pointer sm:px-4 ${
                  selected
                    ? "bg-[#f5f4ff] text-slate-900 shadow-[inset_0_-2px_0_0_#5c6cff]"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                }`}
                onClick={() => onTabChange(tab)}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 xl:order-3">
          <div
            className="relative"
            tabIndex={0}
            onBlur={closeOnBlur(setNotificationsOpen)}
          >
            <button
              aria-label="Мэдэгдэл нээх"
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#ebe8f8] bg-white text-slate-500 transition hover:border-[#d7d2ff] hover:text-slate-700"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff8a3d] px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-80 rounded-[24px] border border-[#eceaf7] bg-white p-4 shadow-[0_30px_70px_rgba(41,54,88,0.18)] transition ${
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
                  className="mt-3 rounded-xl border border-[#eceaf7] bg-[#fafbff] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                  onClick={onMarkAllNotificationsRead}
                >
                  Бүгдийг уншсан болгох
                </button>
              )}

              <div className="mt-4 space-y-2">
                {notifications.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#e5e7f4] bg-[#fafbff] px-4 py-5 text-sm text-slate-400">
                    Шинэ мэдэгдэл алга.
                  </div>
                )}

                {notifications.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onMarkNotificationRead(item.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left ${
                      item.status === "read"
                        ? "border-[#efeef8] bg-[#fafbff]"
                        : "border-[#d7d2ff] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
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
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                          {item.message}
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

          <div className="hidden items-center gap-2 rounded-full bg-[#fff4eb] px-4 py-2 text-sm font-semibold text-[#ff8a3d] sm:flex">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" />
            </svg>
            {xp.toLocaleString()} XP
          </div>

          <div
            className="relative"
            tabIndex={0}
            onBlur={closeOnBlur(setMenuOpen)}
          >
            <button
              aria-label="Дансны цэс нээх"
              className="flex items-center gap-2 rounded-full border border-[#ebe8f8] bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-[#d7d2ff]"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#6d6bff] to-[#8f6aff] text-sm font-semibold text-white">
                {currentUserInitials}
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(26rem,calc(100vw-2rem))] rounded-[24px] border border-[#eceaf7] bg-white p-4 shadow-[0_30px_70px_rgba(41,54,88,0.18)] transition ${
                menuOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div className="rounded-[20px] bg-gradient-to-r from-[#f2f6ff] via-[#f8f1ff] to-[#fff3f1] p-4">
                <div className="text-sm text-slate-400">Нэвтэрсэн хэрэглэгч</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {currentUserName}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  className="flex items-center gap-2 rounded-2xl border border-[#eceaf7] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenProfile();
                    setMenuOpen(false);
                  }}
                >
                  <User2 className="h-4 w-4 text-[#5c6cff]" />
                  Профайл
                </button>
                <button
                  className="flex items-center gap-2 rounded-2xl border border-[#eceaf7] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenSettings();
                    setMenuOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 text-[#5c6cff]" />
                  Тохиргоо
                </button>
                <button
                  className="flex items-center gap-2 rounded-2xl border border-[#eceaf7] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenHelp();
                    setMenuOpen(false);
                  }}
                >
                  <CircleHelp className="h-4 w-4 text-[#5c6cff]" />
                  Тусламж
                </button>
                <button
                  className="flex items-center gap-2 rounded-2xl border border-[#eceaf7] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onToggleTheme();
                    setMenuOpen(false);
                  }}
                >
                  <MoonIcon className="h-4 w-4 text-[#5c6cff]" />
                  Өнгө солих
                </button>
              </div>

              {roleControl && (
                <div className="mt-4 rounded-[22px] border border-[#eceaf7] bg-[#fafbff] p-3">
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
