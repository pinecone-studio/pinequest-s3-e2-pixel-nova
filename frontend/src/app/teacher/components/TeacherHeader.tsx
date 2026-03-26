import { useState, type ReactNode } from "react";
import { Bell, MoonStar, SunMedium } from "lucide-react";
import { badgeClass, buttonSecondary, sectionDescriptionClass, sectionTitleClass } from "../styles";

type TeacherHeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notifications: { message: string; createdAt: string; read: boolean }[];
  onMarkRead?: (index: number) => void;
  roleControl?: ReactNode;
};

export default function TeacherHeader({
  theme,
  onToggleTheme,
  notifications,
  onMarkRead,
  roleControl,
}: TeacherHeaderProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-[30px] border border-[#dce5ef] bg-white/90 px-5 py-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)] backdrop-blur">
      <div className="space-y-2">
        <span className={badgeClass}>Teacher Workspace</span>
        <div>
          <h1 className={sectionTitleClass}>Багшийн самбар</h1>
          <p className={sectionDescriptionClass}>
            Шалгалт үүсгэх, товлох, сурагчийн гүйцэтгэл болон дүнг нэг загвараар удирдана.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          className={buttonSecondary}
          onClick={onToggleTheme}
          type="button"
        >
          {theme === "dark" ? (
            <SunMedium className="mr-2 h-4 w-4" />
          ) : (
            <MoonStar className="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Гэрэлтэй" : "Харанхуй"} горим
        </button>
        <div className="relative" tabIndex={0} onBlur={() => setOpen(false)}>
          <button
            className={buttonSecondary}
            onClick={() => setOpen((prev) => !prev)}
            type="button"
          >
            <span className="relative mr-2">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#2563eb] px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
            Мэдэгдэл
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
