import { buttonPrimary, cardClass, inputClass } from "../styles";

type ExamScheduleCardProps = {
  scheduleTitle: string;
  setScheduleTitle: (value: string) => void;
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  roomCode: string | null;
  onSchedule: () => void;
  onCopyCode: (code: string) => void;
};

export default function ExamScheduleCard({
  scheduleTitle,
  setScheduleTitle,
  scheduleDate,
  setScheduleDate,
  durationMinutes,
  setDurationMinutes,
  roomCode,
  onSchedule,
  onCopyCode,
}: ExamScheduleCardProps) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
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
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
          Шалгалт товлох
        </h2>
        <span className="text-xs text-muted-foreground">Маргаашийн сануулга</span>
      </div>
      <div className="mt-4 grid gap-3">
        <input
          className={inputClass}
          placeholder="Шалгалтын нэр"
          value={scheduleTitle}
          onChange={(event) => setScheduleTitle(event.target.value)}
        />
        <input
          type="number"
          min={10}
          className={inputClass}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.target.value))}
          placeholder="Хугацаа (минут)"
        />
        <input
          type="datetime-local"
          className={inputClass}
          value={scheduleDate}
          onChange={(event) => setScheduleDate(event.target.value)}
        />
        <button className={`w-full ${buttonPrimary}`} onClick={onSchedule}>
          Товлох
        </button>
        {roomCode && (
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-sm">
            Өрөөний код: <span className="font-semibold">{roomCode}</span>
            <button
              className="ml-3 rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted"
              onClick={() => onCopyCode(roomCode)}
            >
              Хуулах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
