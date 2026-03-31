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

const primaryTabs = ["Home", "Exams", "Progress", "AIInsights"] as const;
const tabLabels: Record<(typeof primaryTabs)[number], string> = {
  Home: "Нүүр",
  Exams: "Шалгалт",
  Progress: "Ахиц",
  AIInsights: "AI дүгнэлт",
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

const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact =
      value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
    return `${compact.toString().replace(/\.0$/, "")}k XP`;
  }

  return `${value.toLocaleString()} XP`;
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
    <header className="rounded-[32px] border border-[#e5e9fb]  bg-white px-4 py-4 shadow-[0_18px_44px_rgba(77,93,138,0.08)] sm:px-6">
      <div className="flex flex-wrap items-center gap-4 xl:flex-nowrap xl:justify-between">
        <div className="flex min-w-[220px] items-center gap-3 py-2">
          <div className="overflow-hidden rounded-xl">
            <img
              src="/group-web.svg"
              alt="Pinecone"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </div>
          <span className="text-[15px] font-bold text-slate-900">Pinecone</span>
        </div>

        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto rounded-[20px] border border-[#e7edf5] bg-[#fbfcff] px-1.5 py-1.5 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.28)] xl:order-2 xl:w-auto xl:justify-center">
          {primaryTabs.map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                className={`relative whitespace-nowrap rounded-[14px] px-5 py-2.5 text-sm font-medium transition ${
                  selected
                    ? "bg-[#f5f4ff] text-slate-900 shadow-[inset_0_-2px_0_0_#5c6cff,0_10px_18px_-16px_rgba(92,108,255,0.65)]"
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
          <div className="hidden items-center gap-2 rounded-full border border-[#ffe6d4] bg-[#fff5ec] px-4 py-2 text-[13px] font-semibold text-[#ef8c46] sm:flex">
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
            {formatCompactXp(xp)}
          </div>

          <div
            className="relative"
            tabIndex={0}
            onBlur={closeOnBlur(setNotificationsOpen)}
          >
            <button
              aria-label="Мэдэгдэл нээх"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-[#e4e8fb] bg-white text-slate-500 transition hover:border-[#cfd8ff] hover:text-slate-700"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff8a3d] px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-80 rounded-[28px] border border-[#eceefb] bg-white/98 p-4 shadow-[0_30px_70px_rgba(41,54,88,0.18)] backdrop-blur transition ${
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
                  className="mt-3 rounded-2xl border border-[#eceefb] bg-[#fafbff] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                  onClick={onMarkAllNotificationsRead}
                >
                  Бүгдийг уншсан болгох
                </button>
              )}

              <div className="mt-4 space-y-2">
                {notifications.length === 0 && (
                  <div className="rounded-[22px] border border-dashed border-[#e5e7f4] bg-[#fafbff] px-4 py-5 text-sm text-slate-400">
                    Шинэ мэдэгдэл алга.
                  </div>
                )}

                {notifications.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onMarkNotificationRead(item.id)}
                    className={`w-full rounded-[22px] border px-4 py-3 text-left ${
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

          <div
            className="relative"
            tabIndex={0}
            onBlur={closeOnBlur(setMenuOpen)}
          >
            <button
              aria-label="Дансны цэс нээх"
              className="flex items-center gap-2 rounded-full border border-[#e4e8fb] bg-white px-2 py-1.5 shadow-[0_10px_24px_rgba(77,93,138,0.08)] transition hover:border-[#cfd8ff]"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#7b67ff] to-[#9a7dff] text-sm font-semibold text-white">
                {currentUserInitials}
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(26rem,calc(100vw-2rem))] rounded-[28px] border border-[#eceefb] bg-white/98 p-4 shadow-[0_30px_70px_rgba(41,54,88,0.18)] backdrop-blur transition ${
                menuOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div className="rounded-[22px] bg-gradient-to-r from-[#f4f6ff] via-[#faf5ff] to-[#fff6f0] p-4">
                <div className="text-sm text-slate-400">
                  Нэвтэрсэн хэрэглэгч
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {currentUserName}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  className="flex items-center gap-2 rounded-[20px] border border-[#eceefb] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenProfile();
                    setMenuOpen(false);
                  }}
                >
                  <User2 className="h-4 w-4 text-[#5c6cff]" />
                  Профайл
                </button>
                <button
                  className="flex items-center gap-2 rounded-[20px] border border-[#eceefb] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenSettings();
                    setMenuOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 text-[#5c6cff]" />
                  Тохиргоо
                </button>
                <button
                  className="flex items-center gap-2 rounded-[20px] border border-[#eceefb] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
                  onClick={() => {
                    onOpenHelp();
                    setMenuOpen(false);
                  }}
                >
                  <CircleHelp className="h-4 w-4 text-[#5c6cff]" />
                  Тусламж
                </button>
                <button
                  className="flex items-center gap-2 rounded-[20px] border border-[#eceefb] bg-[#fafbff] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#d7d2ff] hover:bg-white"
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
                <div className="mt-4 rounded-[22px] border border-[#eceefb] bg-[#fafbff] p-3">
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
