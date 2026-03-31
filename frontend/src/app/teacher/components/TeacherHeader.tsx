import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import type { NotificationItem } from "@/lib/notifications";
import { Bell } from "lucide-react";

export type TeacherNavTab = string;

type TeacherHeaderProps = {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  roleControl?: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: readonly string[];
};

export default function TeacherHeader({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  roleControl,
  activeTab,
  setActiveTab,
  tabs,
}: TeacherHeaderProps) {
  const [open, setOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const visibleNotifications = useMemo(
    () => (showAllNotifications ? notifications : notifications.slice(0, 3)),
    [notifications, showAllNotifications],
  );

  return (
    <header className="relative z-40 flex items-center justify-between gap-4 border-b border-[#dce5ef] bg-white/95 px-4 py-2 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex shrink-0 items-center gap-3 py-2">
        <div className="overflow-hidden rounded-xl">
          <Image
            src="/group-web.svg"
            alt="Pinecone"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
        </div>
        <span className="text-[15px] font-bold text-slate-900">Pinecone</span>
      </div>

      <nav className="flex items-center gap-2 overflow-x-auto rounded-[20px] border border-[#e7edf5] bg-[#fbfcff] px-1.5 py-1.5 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.28)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap rounded-[14px] px-5 py-2.5 text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-[#f5f4ff] text-slate-900 shadow-[inset_0_-2px_0_0_#5c6cff,0_10px_18px_-16px_rgba(92,108,255,0.65)]"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span>{tab}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-3 py-2">
        <div
          className="relative z-50"
          tabIndex={0}
          onBlur={() => setOpen(false)}>
          <button
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#dce5ef] bg-white text-slate-500 transition hover:bg-[#f8fafc]"
            onClick={() => {
              setOpen((prev) => {
                const next = !prev;
                if (next) setShowAllNotifications(false);
                return next;
              });
            }}
            type="button"
            aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#2563eb] px-1 text-[9px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <div
            className={`absolute right-0 z-[80] mt-3 w-[320px] origin-top-right rounded-[24px] border border-[#d5dfeb] bg-white p-3 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.35)] transition ${
              open
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-1 opacity-0"
            }`}>
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Мэдэгдлийн төв
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                className="mb-2 rounded-xl border border-[#dce5ef] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                onClick={() => onMarkAllRead?.()}>
                Бүгдийг уншсан болгох
              </button>
            )}
            {notifications.length === 0 && (
              <div className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
                Одоогоор мэдэгдэл алга.
              </div>
            )}
            <div
              className={`${showAllNotifications ? "max-h-[420px] overflow-y-auto pr-1" : ""}`}>
              {visibleNotifications.map((item) => (
                <button
                  key={item.id}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    item.status === "read"
                      ? "border-[#dce5ef] bg-[#f8fafc] text-slate-500"
                      : "border-[#bfdbfe] bg-[#eff6ff] text-slate-800"
                  }`}
                  onClick={() => onMarkRead?.(item.id)}
                  type="button">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{item.title}</div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        item.severity === "critical"
                          ? "bg-red-50 text-red-600"
                          : item.severity === "warning"
                            ? "bg-amber-50 text-amber-700"
                            : item.severity === "success"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[#eef4ff] text-[#2563eb]"
                      }`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="mt-1">{item.message}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString("mn-MN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))}
            </div>
            {notifications.length > 3 && (
              <button
                type="button"
                className="mt-3 w-full rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white"
                onClick={() => setShowAllNotifications((prev) => !prev)}>
                {showAllNotifications
                  ? "Хураах"
                  : `Бүгдийг харах (${notifications.length})`}
              </button>
            )}
          </div>
        </div>

        {roleControl}
      </div>
    </header>
  );
}
