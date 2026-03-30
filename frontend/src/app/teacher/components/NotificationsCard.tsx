import { BellOff } from "lucide-react";
import { cardClass } from "../styles";
import { formatDateTime } from "../utils";
import type { NotificationItem } from "../types";
import TeacherEmptyState from "./TeacherEmptyState";

type NotificationsCardProps = {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
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
          <TeacherEmptyState
            icon={<BellOff className="h-5 w-5" />}
            title="Мэдэгдэл алга"
            description="Шинэ шалгалтын явц, зөрчил, илгээлтийн мэдэгдлүүд энд бодитоор харагдана."
          />
        )}
        {notifications.map((item) => (
          <button
            key={item.id}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-xs transition ${
              item.status === "read"
                ? "border-[#dce5ef] bg-[#f8fafc] text-slate-500"
                : "border-[#bfdbfe] bg-[#eff6ff]"
            }`}
            onClick={() => onMarkRead(item.id)}
            type="button"
          >
            <div className="text-[11px] font-semibold">{item.title}</div>
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
