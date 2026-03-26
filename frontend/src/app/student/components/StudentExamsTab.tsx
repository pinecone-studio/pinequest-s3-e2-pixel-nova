import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronUp,
  CircleAlert,
  ClipboardX,
  Clock3,
  Hourglass,
  Info,
  LockKeyhole,
  Play,
  TimerReset,
  UserSquare2,
} from "lucide-react";
import type { Exam } from "../types";
import { formatDate, gradeFromPercentage } from "../utils";

type StudentExamsTabProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinError: string | null;
  onLookup: () => void;
  selectedExam: Exam | null;
  onStartExam: () => void;
  onClearSelection: () => void;
  teacherName?: string | null;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
};

const subjectFromExam = (exam: Exam) => {
  if (exam.description?.trim()) return exam.description.trim();
  return exam.title.split(/\s+/).slice(0, 2).join(" ");
};

const formatClock = (value: Date) =>
  value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });

function JoinExamPanel({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinError,
  onLookup,
  studentHistory,
}: Omit<
  StudentExamsTabProps,
  "selectedExam" | "onStartExam" | "onClearSelection" | "teacherName"
>) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-[30px] border border-[#e8edf9] bg-white p-6 shadow-[0_22px_55px_rgba(68,84,125,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Exam Detail
        </div>
        <div className="mt-5">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">
            Join your next exam
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter the room code to open the exam detail page before you start.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Room code
          </label>
          <input
            className="w-full rounded-2xl border border-[#dbe5ff] bg-[#fbfcff] px-4 py-3 text-base font-medium tracking-[0.18em] text-slate-900 uppercase outline-none transition focus:border-[#7aa5ff] focus:bg-white"
            placeholder="AX7K2P"
            value={roomCodeInput}
            onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
          />
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5c4fe6] to-[#5148df] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(92,79,230,0.25)] transition hover:brightness-105"
            onClick={onLookup}
          >
            Open exam detail
            <Play className="h-4 w-4" />
          </button>
          {joinError && (
            <div className="rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm text-[#e45d5d]">
              {joinError}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[24px] border border-[#e6ecfb] bg-[#f8fbff] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Info className="h-4 w-4 text-[#62a9ff]" />
            Before you start
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Check the exam rules and timing first.</li>
            <li>Fullscreen and anti-cheat protection will turn on automatically.</li>
            <li>Once the exam starts, your answers will auto-save.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[30px] border border-[#e8edf9] bg-white p-6 shadow-[0_22px_55px_rgba(68,84,125,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Previous sessions
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Your recent graded exams will show up here.
            </p>
          </div>
          <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#5c6cff]">
            {studentHistory.length} items
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[92px] animate-pulse rounded-[24px] border border-[#e8edf9] bg-[#f8faff]"
              />
            ))}

          {!loading && studentHistory.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-[#dbe3f6] bg-[#fbfcff] px-5 py-8 text-center text-sm text-slate-400">
              No graded exams yet.
            </div>
          )}

          {!loading &&
            studentHistory.map((exam) => {
              const grade = exam.grade ?? gradeFromPercentage(exam.percentage);

              return (
                <div
                  key={`${exam.examId}-${exam.date}`}
                  className="rounded-[24px] border border-[#e8edf9] bg-[#fbfcff] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {exam.title}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span>{formatDate(exam.date)}</span>
                        <span>
                          Score {exam.score ?? "—"}/{exam.totalPoints ?? "—"}
                        </span>
                        <span>{exam.percentage}%</span>
                      </div>
                    </div>
                    <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {grade}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

export default function StudentExamsTab({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinError,
  onLookup,
  selectedExam,
  onStartExam,
  onClearSelection,
  teacherName,
  studentHistory,
}: StudentExamsTabProps) {
  const [rulesOpen, setRulesOpen] = useState(true);

  const examMeta = useMemo(() => {
    if (!selectedExam) return null;

    const start = new Date(selectedExam.scheduledAt ?? selectedExam.createdAt);
    const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const end = new Date(
      safeStart.getTime() + (selectedExam.duration ?? 45) * 60 * 1000,
    );

    return {
      subject: subjectFromExam(selectedExam),
      status: selectedExam.examStartedAt ? "Идэвхтэй" : "Бэлэн",
      teacher: teacherName?.trim() || "Smart Exam Team",
      room: selectedExam.roomCode || "OPEN",
      dateLabel: formatDate(safeStart.toISOString()),
      startLabel: formatClock(safeStart),
      endLabel: formatClock(end),
      durationLabel: `${selectedExam.duration ?? 45} минут`,
      examStatusMessage: joinError || "Та энэ шалгалтыг эхлүүлэхэд бэлэн байна.",
    };
  }, [joinError, selectedExam, teacherName]);

  const canStart = !joinError && !selectedExam?.examStartedAt;

  if (!selectedExam || !examMeta) {
    return (
      <JoinExamPanel
        loading={loading}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        joinError={joinError}
        onLookup={onLookup}
        studentHistory={studentHistory}
      />
    );
  }

  return (
    <section className="w-full space-y-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Exam Detail
      </div>

      <div className="grid gap-5 xl:grid-cols-[72px_minmax(0,1fr)]">
        <button
          aria-label="Go back to exam list"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#eef1f7] bg-white text-slate-500 shadow-sm transition hover:border-[#d8dff0] hover:text-slate-700 xl:mt-3"
          onClick={onClearSelection}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 rounded-[28px] border border-[#e8edf9] bg-white p-4 shadow-[0_22px_55px_rgba(68,84,125,0.08)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[1.7rem] font-semibold tracking-[-0.035em] text-slate-900">
                {selectedExam.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#74b8ff]">
                {examMeta.subject}
              </p>
            </div>
            <span className="inline-flex self-start rounded-full bg-[#eaf9ee] px-3 py-1 text-xs font-semibold text-[#49b971]">
              {examMeta.status}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-[#eaf2ff] bg-[#fbfdff] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7fbef9]">
                <UserSquare2 className="h-4 w-4" />
                Teacher
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-800">
                {examMeta.teacher}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#eaf2ff] bg-[#fbfdff] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7fbef9]">
                <LockKeyhole className="h-4 w-4" />
                Room
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-800">
                {examMeta.room}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e8edf9] bg-white p-5 shadow-[0_22px_55px_rgba(68,84,125,0.08)] sm:p-6">
        <div className="flex items-center gap-2 text-[1.05rem] font-semibold text-slate-900">
          <Clock3 className="h-5 w-5" />
          Хугацаа
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <div className="rounded-[20px] border border-[#bfd4ff] bg-[#f4f8ff] px-4 py-4 text-center">
            <CalendarDays className="mx-auto h-5 w-5 text-slate-500" />
            <div className="mt-3 text-xs text-slate-400">Огноо</div>
            <div className="mt-1 text-base font-semibold text-slate-800">
              {examMeta.dateLabel}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#ccefd9] bg-[#f2fcf4] px-4 py-4 text-center">
            <Play className="mx-auto h-5 w-5 text-[#49b971]" />
            <div className="mt-3 text-xs text-slate-400">Эхлэх цаг</div>
            <div className="mt-1 text-base font-semibold text-slate-800">
              {examMeta.startLabel}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#ffd6d2] bg-[#fff6f5] px-4 py-4 text-center">
            <TimerReset className="mx-auto h-5 w-5 text-[#f06d65]" />
            <div className="mt-3 text-xs text-slate-400">Дуусах цаг</div>
            <div className="mt-1 text-base font-semibold text-slate-800">
              {examMeta.endLabel}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#ffe0b9] bg-[#fffaf1] px-4 py-4 text-center">
            <Hourglass className="mx-auto h-5 w-5 text-[#f0a12c]" />
            <div className="mt-3 text-xs text-slate-400">Үргэлжлэх хугацаа</div>
            <div className="mt-1 text-base font-semibold text-slate-800">
              {examMeta.durationLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e8edf9] bg-white p-5 shadow-[0_22px_55px_rgba(68,84,125,0.08)] sm:p-6">
        <button
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setRulesOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2 text-[1.05rem] font-semibold text-slate-900">
            <CircleAlert className="h-5 w-5" />
            Шалгалтын дүрэм ба мэдээлэл
          </span>
          <ChevronUp
            className={`h-4 w-4 text-[#7fc5ff] transition ${
              rulesOpen ? "" : "rotate-180"
            }`}
          />
        </button>

        {rulesOpen && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-[#ffe2ae] bg-[#fffaf0] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ArrowLeft className="h-4 w-4 text-[#f0a12c]" />
                Go Back
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Cannot return to previous
              </div>
            </div>

            <div className="rounded-[18px] border border-[#ffe2ae] bg-[#fffaf0] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Clock3 className="h-4 w-4 text-[#f0a12c]" />
                Auto Submit
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Submits when time ends
              </div>
            </div>

            <div className="rounded-[18px] border border-[#ffd5d3] bg-[#fff5f5] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ClipboardX className="h-4 w-4 text-[#ef6d63]" />
                Copy/Paste
              </div>
              <div className="mt-1 text-xs text-slate-400">Disabled</div>
            </div>

            <div className="rounded-[18px] border border-[#ffd5d3] bg-[#fff5f5] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Camera className="h-4 w-4 text-[#ef6d63]" />
                Camera
              </div>
              <div className="mt-1 text-xs text-slate-400">Required</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[26px] border-2 border-[#62a9ff] bg-white p-4 shadow-[0_20px_45px_rgba(98,169,255,0.12)]">
        <div className="rounded-[18px] border border-dashed border-[#9bccff] px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle className="h-4 w-4 text-[#f0a12c]" />
            Анхааруулах зүйлс
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Шалгалт эхэлсэн тохиолдолд зогсоох боломжгүй.</li>
            <li>Бүтэн дэлгэцтэй байх ёстой.</li>
            <li>Дэлгэц солигдвол зөрчил бүртгэгдэнэ.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[20px] bg-[#f7f9ff] px-4 py-3 text-sm text-slate-500">
        {examMeta.examStatusMessage}
      </div>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#5c4fe6] to-[#5148df] px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(92,79,230,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onStartExam}
        disabled={!canStart}
      >
        <Play className="h-4 w-4" />
        Start Exam
      </button>
    </section>
  );
}
