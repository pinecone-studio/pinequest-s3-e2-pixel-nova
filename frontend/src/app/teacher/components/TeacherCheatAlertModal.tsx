"use client";

import type { NotificationItem } from "@/lib/notifications";

type TeacherCheatAlertModalProps = {
  notification: NotificationItem | null;
  busy?: boolean;
  onClose: () => void;
  onDisqualify: () => void;
  onWarn: () => void;
};

const getStudentName = (notification: NotificationItem | null) => {
  const metadata = notification?.metadata as
    | { studentName?: string; reason?: string }
    | undefined;
  return metadata?.studentName || "Сурагч";
};

const getReason = (notification: NotificationItem | null) => {
  const metadata = notification?.metadata as
    | { studentName?: string; reason?: string }
    | undefined;
  return metadata?.reason || notification?.message || "зөрчил илэрсэн";
};

export default function TeacherCheatAlertModal({
  notification,
  busy = false,
  onClose,
  onDisqualify,
  onWarn,
}: TeacherCheatAlertModalProps) {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-140 grid place-items-center bg-[rgba(15,23,42,0.58)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-[540px] rounded-[32px] border border-[#f0dcdc] bg-white px-8 py-7 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.48)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="flex-1 text-center text-[22px] font-semibold text-slate-950">
            Зөрчил
          </h2>
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onClose}
            disabled={busy}
            aria-label="Close cheat alert">
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="mt-8 text-center text-[18px] leading-9 text-slate-900">
          {getStudentName(notification)} суралцагч шалгалтын журам
          <br />
          {getReason(notification)} үйлдэл хийсэн байна.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-[18px] border border-[#ff7d7d] bg-[#fff4f4] px-6 py-3 text-[15px] font-medium text-slate-900 transition hover:bg-[#ffeded] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onDisqualify}
            disabled={busy}>
            Шалгалтаас чөлөөлөх
          </button>
          <button
            type="button"
            className="rounded-[18px] border border-[#ff7d7d] bg-[#fff4f4] px-6 py-3 text-[15px] font-medium text-slate-900 transition hover:bg-[#ffeded] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onWarn}
            disabled={busy}>
            Сануулга өгөх
          </button>
        </div>
      </div>
    </div>
  );
}
