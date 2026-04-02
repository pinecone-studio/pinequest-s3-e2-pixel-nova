import { ChevronRight } from "lucide-react";
import RoomCodeCopyButton from "./RoomCodeCopyButton";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import type {
  ScheduleCategory,
  ScheduleItem,
} from "./teacher-schedule-helpers";
import { ROW_HEIGHT } from "./teacher-schedule-helpers";

function formatTimeRange(date: Date, duration: number) {
  const endTime = new Date(date.getTime() + duration * 60_000);
  const format = (value: Date) =>
    `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

  return `${format(date)}-${format(endTime)}`;
}

export function LegendDot({ category }: { category: ScheduleCategory }) {
  const tone =
    category === "required" ? "border-[#2d6cff]" : "border-[#ffb14a]";

  return (
    <span className={`inline-block size-4 rounded-full border-[4px] ${tone}`} />
  );
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
      ? {
          border: "border-t-[4px] border-t-[#2d6cff]",
          dot: "required" as const,
        }
      : {
          border: "border-t-[4px] border-t-[#ffb14a]",
          dot: "elective" as const,
        };
  const isFinished = item.lifecycle === "finished";
  const titleLength = item.title.trim().length;
  const secondaryLabel = isFinished
    ? "Дууссан"
    : formatTimeRange(item.scheduledDate, item.duration);
  const minCardHeight = isFinished || titleLength > 15 ? 72 : 56;
  const titleClass =
    titleLength > 20
      ? "line-clamp-2 text-[12px] font-semibold leading-4 text-[#2e2e2e]"
      : "line-clamp-2 text-[13px] font-semibold leading-5 text-[#2e2e2e]";

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={`absolute overflow-hidden rounded-[10px] border border-[#ececec] bg-[#f4f4f4] px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-[#d5d9e3] ${tone.border}`}
      style={{
        left: `calc(${item.dayIndex} * (100% / ${daysCount}) + 12px)`,
        width: `calc((100% / ${daysCount}) - 16px)`,
        top: `${Math.max(8, (item.startMinutes / 60) * ROW_HEIGHT + 8)}px`,
        height: `${Math.max((item.duration / 60) * ROW_HEIGHT - 10, minCardHeight)}px`,
      }}
    >
      <div className="flex h-full gap-2">
        <div className="pt-0.5">
          <LegendDot category={tone.dot} />
        </div>
        <div className="min-w-0">
          <div className={titleClass}>
            {item.title}
          </div>
          {item.subtitle ? (
            <div className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-[#8d8d8d]">
              {item.subtitle}
            </div>
          ) : null}
          <div
            className={`mt-1 line-clamp-1 text-[11px] leading-4 ${
              isFinished ? "font-medium text-[#8d8d8d]" : "text-[#a3a3a3]"
            }`}
          >
            {secondaryLabel}
          </div>
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
      ? "bg-[#f3f7fb] text-[#2563eb]"
      : "bg-[rgba(255,174,88,0.12)] text-[#ffae58]";
  const lifecycleTone =
    item.lifecycle === "finished"
      ? "bg-slate-100 text-slate-600"
      : item.lifecycle === "active"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#eef2ff] text-[#5c6cff]";
  const lifecycleLabel =
    item.lifecycle === "finished"
      ? "Дууссан"
      : item.lifecycle === "active"
        ? null
        : "Товлосон";

  return (
    <div className="relative min-h-[340px] rounded-[24px] border border-[#dfdfdf] bg-white px-6 pb-5 pt-6 text-left transition hover:border-[#d3d7de]">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`${item.title} дэлгэрэнгүй`}
        className="absolute inset-0 rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355cde]"
      />

      <div className="relative flex h-full flex-col">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[64%]">
              <h3 className="min-h-[64px] text-[26px] font-semibold leading-[31px] tracking-[-0.03em] text-black break-words">
                {item.title}
              </h3>
              {item.subtitle ? (
                <p className="mt-1 text-[15px] font-medium leading-5 text-[#8a94a6]">
                  {item.subtitle}
                </p>
              ) : null}
            </div>
            <div className="mt-1 flex shrink-0 flex-col items-end gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold leading-4 ${tagTone}`}
              >
                {item.category === "required" ? "Заавал судлах" : "Сонгон судлах"}
              </span>
              {lifecycleLabel ? (
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold leading-4 ${lifecycleTone}`}
                >
                  {lifecycleLabel}
                </span>
              ) : null}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[16px] leading-5">
              <span className="text-[#959595]">Өдөр:</span>
              <span className="text-black">
                {formatDateValue(item.scheduledDate)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[16px] leading-5">
              <span className="text-[#959595]">Эхлэх цаг:</span>
              <span className="text-black">
                {formatTimeValue(item.scheduledDate)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[16px] leading-5">
              <span className="text-[#959595]">Үргэлжлэх хугацаа:</span>
              <span className="text-black">{item.duration} минут</span>
            </div>
            <div className="flex items-center justify-between text-[16px] leading-5">
              <span className="text-[#959595]">Өрөөний код:</span>
              <div className="relative z-10 flex items-center gap-2 text-black">
                <span>{item.roomCode}</span>
                <RoomCodeCopyButton
                  code={item.roomCode}
                  onCopyCode={onCopyCode}
                  className="relative z-10 size-[20px]"
                  iconClassName="size-[18px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-[#dfe4ff] pt-4">
          <span className="ml-auto flex items-center justify-end gap-4 text-[16px] font-normal leading-5 text-black transition hover:text-slate-950">
            Дэлгэрэнгүй
            <ChevronRight className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}
