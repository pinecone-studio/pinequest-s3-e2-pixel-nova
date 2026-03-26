import { cardClass } from "../styles";
import { formatDateTime } from "../utils";
import type { NotificationItem } from "../types";

type NotificationsCardProps = {
  notifications: NotificationItem[];
  onMarkRead: (index: number) => void;
};

export default function NotificationsCard({
  notifications,
  onMarkRead,
}: NotificationsCardProps) {
  return (
    <div className={cardClass}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <svg
          className="h-4 w-4 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Мэдэгдэл
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        {notifications.length === 0 && (
          <div className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-3 py-3 text-xs text-slate-500">
            Одоогоор мэдэгдэл алга.
          </div>
        )}
        {notifications.map((item, index) => (
          <button
            key={`${item.examId}-${item.createdAt}`}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-xs transition ${
              item.read
                ? "border-[#dce5ef] bg-[#f8fafc] text-slate-500"
                : "border-[#bfdbfe] bg-[#eff6ff]"
            }`}
            onClick={() => onMarkRead(index)}
            type="button"
          >
            <div className="text-xs">{item.message}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {formatDateTime(item.createdAt)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
