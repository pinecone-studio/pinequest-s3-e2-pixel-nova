import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import type { NotificationItem } from "@/lib/notifications";
import { Bell } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export type TeacherNavTab = string;

type TeacherHeaderProps = {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onNotificationAction?: (notification: NotificationItem) => void;
  roleControl?: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loadingTab?: string | null;
  tabs: readonly string[];
  contentWidthClass?: string;
  outerPaddingClass?: string;
};

export default function TeacherHeader({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onNotificationAction,
  roleControl,
  activeTab,
  setActiveTab,
  loadingTab = null,
  tabs,
  contentWidthClass = "max-w-[1380px]",
  outerPaddingClass = "px-4 py-2 sm:px-6 lg:px-8",
}: TeacherHeaderProps) {
  const [open, setOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const visibleNotifications = useMemo(
    () => (showAllNotifications ? notifications : notifications.slice(0, 3)),
    [notifications, showAllNotifications],
  );
  const getSeverityLabel = (severity: NotificationItem["severity"]) => {
    if (severity === "critical") return "Ноцтой";
    if (severity === "warning") return "Анхаарах";
    if (severity === "success") return "Амжилттай";
    return "Мэдээлэл";
  };
  const getNotificationActionLabel = (item: NotificationItem) => {
    if (item.type === "student_flagged" || item.type === "student_submitted") {
      return "Хуваарь руу очих";
    }
    if (item.type === "exam_finished" || item.type === "result_published") {
      return "Аналитик руу очих";
    }
    if (item.type === "exam_ending_soon" || item.type === "student_joined") {
      return "Шалгалт харах";
    }
    return null;
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b border-[#dde5ee] bg-white/90 backdrop-blur ${outerPaddingClass}`}
    >
      <div
        className={`mx-auto flex w-full items-center justify-between gap-4 ${contentWidthClass}`}
      >
        <div className="flex shrink-0 items-center gap-3 py-1.5">
          <div className="overflow-hidden rounded-xl">
            <Image
              src="/group-web.svg"
              alt="Educore"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
              unoptimized
            />
          </div>
          <span className="text-[15px] font-bold text-slate-900">Educore</span>
        </div>

        <div className="flex min-w-0 flex-1 justify-center px-2">
          <nav className="inline-flex items-center gap-2 overflow-x-auto rounded-[20px] border border-[#e7edf5] bg-[#fbfcff] px-1.5 py-1.5 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.28)]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const isLoading = loadingTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  disabled={Boolean(loadingTab) && !isLoading}
                  className={`relative whitespace-nowrap rounded-[14px] px-5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#f5f4ff] text-slate-900 shadow-[inset_0_-2px_0_0_#5c6cff,0_10px_18px_-16px_rgba(92,108,255,0.65)]"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  } ${isLoading ? "cursor-progress" : ""}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {isLoading && <Spinner className="size-3.5 text-[#5c6cff]" />}
                    {tab}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3 py-1.5">
          <div
            className="relative z-50"
            tabIndex={0}
            onBlur={() => setOpen(false)}
          >
            <button
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#dde5ee] bg-white text-slate-500 transition hover:bg-[#f8fafc]"
              onClick={() => {
                setOpen((prev) => {
                  const next = !prev;
                  if (next) setShowAllNotifications(false);
                  return next;
                });
              }}
              type="button"
              aria-label="Мэдэгдэл"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#2563eb] px-1 text-[9px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div
              className={`absolute right-0 z-[80] mt-3 w-[320px] origin-top-right rounded-[24px] border border-[#dde5ee] bg-white p-3 shadow-[0_24px_52px_-34px_rgba(15,23,42,0.3)] transition ${
                open
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-1 opacity-0"
              }`}
            >
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Мэдэгдлийн төв
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  className="mb-2 rounded-xl border border-[#dde5ee] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                  onClick={() => onMarkAllRead?.()}
                >
                  Бүгдийг уншсан болгох
                </button>
              )}
              {notifications.length === 0 && (
                <div className="rounded-2xl border border-[#dde5ee] bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
                  Одоогоор мэдэгдэл алга.
                </div>
              )}
              <div
                className={`${
                  showAllNotifications
                    ? "max-h-[420px] overflow-y-auto pr-1"
                    : ""
                }`}
              >
                {visibleNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`mt-2 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      item.status === "read"
                        ? "border-[#dde5ee] bg-[#f8fafc] text-slate-500"
                        : "border-[#d9e4f0] bg-[#f5f9fd] text-slate-800"
                    }`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => onMarkRead?.(item.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{item.title}</div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            item.severity === "critical"
                              ? "bg-[#fbf4f4] text-[#9a6868]"
                              : item.severity === "warning"
                                ? "bg-[#fbf8f2] text-[#8a7654]"
                                : item.severity === "success"
                                  ? "bg-[#f6faf7] text-[#557565]"
                                  : "bg-[#f4f8fc] text-[#5b718b]"
                          }`}
                        >
                          {getSeverityLabel(item.severity)}
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
                    {getNotificationActionLabel(item) ? (
                      <button
                        type="button"
                        className="mt-3 rounded-xl border border-[#d7e3f4] bg-white px-3 py-2 text-xs font-semibold text-[#355cde] transition hover:bg-[#f8fbff]"
                        onClick={() => {
                          onMarkRead?.(item.id);
                          onNotificationAction?.(item);
                          setOpen(false);
                        }}
                      >
                        {getNotificationActionLabel(item)}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {notifications.length > 3 && (
                <button
                  type="button"
                  className="mt-3 w-full rounded-2xl border border-[#dde5ee] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white"
                  onClick={() => setShowAllNotifications((prev) => !prev)}
                >
                  {showAllNotifications
                    ? "Хураах"
                    : `Бүгдийг харах (${notifications.length})`}
                </button>
              )}
            </div>
          </div>

          {roleControl}
        </div>
      </div>
    </header>
  );
}
