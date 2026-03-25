import {
  cardClass,
  mutedCardClass,
  inputClass,
  buttonPrimary,
  buttonGhost,
} from "../styles";
import { formatDate } from "../utils";
import type { Exam, NotificationItem } from "../types";
import { HistoryIcon, LockIcon, Star } from "lucide-react";

type StudentDashboardTabProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinError: string | null;
  onLookup: () => void;
  selectedExam: Exam | null;
  onStartExam: () => void;
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  progressSegments: number;
  nextLevel: { minXP: number };
  notifications: NotificationItem[];
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    date: string;
  }[];
};

export default function StudentDashboardTab({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinError,
  onLookup,
  selectedExam,
  onStartExam,
  levelInfo,
  studentProgress,
  progressSegments,
  nextLevel,
  notifications,
  studentHistory,
}: StudentDashboardTabProps) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))
        ) : (
          <>
            <div className={mutedCardClass}>
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <LockIcon className="w-4 h-4" />
                  Өрөөний код
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                <input
                  className={inputClass}
                  placeholder="Жишээ: AX7K2P"
                  value={roomCodeInput}
                  onChange={(event) => setRoomCodeInput(event.target.value)}
                />
                <button className={buttonPrimary} onClick={onLookup}>
                  Шалгах
                </button>
                {joinError && (
                  <div className="text-xs text-red-500">{joinError}</div>
                )}
              </div>
              {selectedExam && (
                <div className="mt-4 rounded-xl border border-border bg-muted px-3 py-2 text-xs">
                  <div className="font-semibold">{selectedExam.title}</div>
                  <div className="text-muted-foreground">
                    {selectedExam.questions.length} асуулт ·{" "}
                    {selectedExam.duration ?? 45} мин
                  </div>
                  <button
                    className={`mt-3 w-full ${buttonGhost}`}
                    onClick={onStartExam}
                  >
                    Шалгалт эхлэх
                  </button>
                </div>
              )}
            </div>
            <div className={mutedCardClass}>
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  XP ба түвшин
                </span>
              </div>
              <div className="mt-2 text-xl font-semibold">
                Түвшин {levelInfo.level} · {studentProgress.xp} XP
              </div>
              <div className="mt-3 grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full ${
                      idx < progressSegments ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Дараагийн түвшин хүртэл:{" "}
                {Math.max(nextLevel.minXP - studentProgress.xp, 0)} XP
              </div>
            </div>
            <div className={mutedCardClass}>
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
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
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {notifications.length === 0 && (
                  <div className="text-muted-foreground">
                    Одоогоор мэдэгдэл алга.
                  </div>
                )}
                {notifications.slice(0, 3).map((item) => (
                  <div
                    key={`${item.examId}-${item.createdAt}`}
                    className="rounded-lg border border-border bg-muted px-2 py-1"
                  >
                    {item.message}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HistoryIcon className="w-4 h-4" />
          Шалгалтын түүх
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          {studentHistory.length === 0 && (
            <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              Одоогоор шалгалтын түүх алга.
            </div>
          )}
          {studentHistory.map((exam) => (
            <div
              key={`${exam.examId}-${exam.date}`}
              className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
            >
              <div>
                <div className="font-medium">{exam.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(exam.date)}
                </div>
              </div>
              <div className="text-xs font-semibold text-foreground">
                {exam.percentage}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
