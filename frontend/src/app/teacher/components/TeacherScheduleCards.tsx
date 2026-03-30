import { ChevronRight } from "lucide-react";
import RoomCodeCopyButton from "./RoomCodeCopyButton";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import type { ScheduleCategory, ScheduleItem } from "./teacher-schedule-helpers";
import { ROW_HEIGHT } from "./teacher-schedule-helpers";

export function LegendDot({ category }: { category: ScheduleCategory }) {
  const tone =
    category === "required"
      ? "border-blue-500 text-blue-500"
      : "border-amber-400 text-amber-400";

  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full border-[3px] ${tone}`}
    />
  );
}

function getLifecycleBadge(lifecycle: ScheduleItem["lifecycle"]) {
  if (lifecycle === "finished") {
    return {
      label: "Дууссан",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
  }

  if (lifecycle === "active") {
    return {
      label: "Явагдаж буй",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }

  return {
    label: "Товлосон",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  };
}

export function ScheduleCard({
  item,
  daysCount,
  onOpen,
}: {
  item: ScheduleItem;
  daysCount: number;
  onOpen: (examId: string) => void;
}) {
  const tone =
    item.category === "required"
      ? { border: "border-t-2 border-t-blue-500", dot: "required" as const }
      : { border: "border-t-2 border-t-amber-400", dot: "elective" as const };
  const lifecycleBadge = getLifecycleBadge(item.lifecycle);

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={`absolute rounded-2xl bg-white px-3 py-3 text-left shadow-[0_16px_32px_-28px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_-28px_rgba(15,23,42,0.28)] ${tone.border}`}
      style={{
        left: `calc(${item.dayIndex} * (100% / ${daysCount}) + 12px)`,
        width: `calc((100% / ${daysCount}) - 16px)`,
        top: `${Math.max(8, (item.startMinutes / 60) * ROW_HEIGHT + 8)}px`,
        height: `${Math.max((item.duration / 60) * ROW_HEIGHT - 10, 52)}px`,
      }}
    >
      <div className="flex h-full gap-2 text-foreground/85">
        <LegendDot category={tone.dot} />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="line-clamp-2 text-sm font-semibold">{item.title}</div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${lifecycleBadge.className}`}
            >
              {lifecycleBadge.label}
            </span>
          </div>
          {item.subtitle && (
            <div className="mt-1 line-clamp-1 text-[11px] text-slate-500">
              {item.subtitle}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function ScheduleListCard({
  item,
  onOpen,
  onCopyCode,
  formatDateValue,
  formatTimeValue,
}: {
  item: ScheduleItem;
  onOpen: (examId: string) => void;
  onCopyCode?: CopyCodeHandler;
  formatDateValue: (date: Date) => string;
  formatTimeValue: (date: Date) => string;
}) {
  const tagTone =
    item.category === "required"
      ? "bg-[#f1efff] text-[#4b63f6]"
      : "bg-[#fff0e7] text-[#ff9a45]";
  const lifecycleBadge = getLifecycleBadge(item.lifecycle);

  return (
    <div className="relative rounded-[28px] border border-[#efd7d7] bg-white px-7 py-8 text-left shadow-[0_18px_36px_-32px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:shadow-[0_24px_38px_-28px_rgba(15,23,42,0.24)]">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`${item.title} дэлгэрэнгүй`}
        className="absolute inset-0 rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355cde]"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tagTone}`}>
                {item.category === "required" ? "Заавал судлах" : "Сонгон судлах"}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-[12px] font-semibold ${lifecycleBadge.className}`}
              >
                {lifecycleBadge.label}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 text-[16px]">
          <span className="text-[#b49494]">Өдөр:</span>
          <span className="justify-self-end text-slate-900">
            {formatDateValue(item.scheduledDate)}
          </span>
          <span className="text-[#b49494]">Эхлэх цаг:</span>
          <span className="justify-self-end text-slate-900">
            {formatTimeValue(item.scheduledDate)}
          </span>
          <span className="text-[#b49494]">Үргэлжлэх хугацаа:</span>
          <span className="justify-self-end text-slate-900">{item.duration} минут</span>
          <span className="text-[#b49494]">Өрөөний код:</span>
          <div className="relative z-10 flex items-center justify-self-end gap-2 text-slate-900">
            <span>{item.roomCode}</span>
            <RoomCodeCopyButton
              code={item.roomCode}
              onCopyCode={onCopyCode}
              className="relative z-10 size-8"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-[#ead7d7] pt-5">
          <span className="ml-auto flex items-center justify-end gap-3 text-[15px] font-medium text-slate-800 transition hover:text-slate-950">
            Дэлгэрэнгүй
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
