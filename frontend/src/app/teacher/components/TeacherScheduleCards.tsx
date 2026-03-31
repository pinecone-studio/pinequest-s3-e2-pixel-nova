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

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={`absolute rounded-[10px] border border-[#ececec] bg-[#f4f4f4] px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-[#d5d9e3] ${tone.border}`}
      style={{
        left: `calc(${item.dayIndex} * (100% / ${daysCount}) + 12px)`,
        width: `calc((100% / ${daysCount}) - 16px)`,
        top: `${Math.max(8, (item.startMinutes / 60) * ROW_HEIGHT + 8)}px`,
        height: `${Math.max((item.duration / 60) * ROW_HEIGHT - 10, 56)}px`,
      }}
    >
      <div className="flex h-full gap-2">
        <div className="pt-0.5">
          <LegendDot category={tone.dot} />
        </div>
        <div className="min-w-0">
          <div className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#2e2e2e]">
            {item.title}
          </div>
          <div className="mt-1 text-[11px] leading-4 text-[#a3a3a3]">
            {formatTimeRange(item.scheduledDate, item.duration)}
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

  return (
    <div className="relative min-h-[320px] rounded-[24px] border border-[#dfdfdf] bg-white px-6 pb-5 pt-6 text-left transition hover:border-[#d3d7de]">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`${item.title} дэлгэрэнгүй`}
        className="absolute inset-0 rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355cde]"
      />

      <div className="relative flex h-full flex-col">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="min-h-[64px] max-w-[64%] text-[26px] font-semibold leading-[31px] tracking-[-0.03em] text-black break-words">
              {item.title}
            </h3>
            <span
              className={`mt-1 shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold leading-4 ${tagTone}`}
            >
              {item.category === "required" ? "Заавал судлах" : "Сонгон судлах"}
            </span>
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
