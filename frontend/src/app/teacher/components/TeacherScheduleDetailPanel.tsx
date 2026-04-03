import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  AudioLines,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clipboard,
  Clock3,
  Headphones,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import { getExamAudioChunks } from "@/api/cheat";
import RoomCodeCopyButton from "./RoomCodeCopyButton";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import type {
  Exam,
  ExamAudioChunk,
  ExamRosterDetail,
  ExamRosterParticipant,
} from "../types";
import { sectionTitleClass } from "../styles";
import TeacherEmptyState from "./TeacherEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import TeacherSelect from "./TeacherSelect";

const formatCompactDateTime = (value?: string | null) => {
  if (!value) return "Илгэээгээгүй байна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Илгэээгээгүй байна";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  const year = lookup("year");
  const month = lookup("month");
  const day = lookup("day");
  const hour = lookup("hour");
  const minute = lookup("minute");

  return `${year}.${month}.${day}-${hour}:${minute}`;
};

function getParticipantMeta(participant: ExamRosterParticipant) {
  if (
    participant.riskLevel === "critical" ||
    participant.riskLevel === "high" ||
    participant.isFlagged ||
    participant.flagCount > 0
  ) {
    return {
      label: participant.riskLevel === "critical" ? " Зөрчил" : "Зөрчил",
      tone: "border-[#ffb8b8] bg-[#fff4f3] text-[#ff5b57]",
      progressTone: "bg-[#c5cad3]",
    };
  }
  if (participant.riskLevel === "medium") {
    return {
      label: "Хэвийн",
      tone: "border-[#bdd2ff] bg-[#eff5ff] text-[#3566ff]",
      progressTone: "bg-[#29c15f]",
    };
  }
  if (participant.status === "submitted" || participant.status === "graded") {
    return {
      label: "Илгээсэн",
      tone: "border-[#bce9ca] bg-[#eefcf3] text-[#22b454]",
      progressTone: "bg-[#29c15f]",
    };
  }
  return {
    label: participant.status === "late" ? "Хоцорсон" : "Хэвийн",
    tone: "border-[#bdd2ff] bg-[#eff5ff] text-[#3566ff]",
    progressTone: "bg-[#29c15f]",
  };
}

function formatParticipantEvidence(participant: ExamRosterParticipant) {
  if (!participant.latestEvent) {
    return {
      summary: "Зөрчил бүртгэгдээгүй",
    };
  }

  const sourceLabel =
    participant.latestEvent.eventSource === "browser_camera"
      ? "камер"
      : participant.latestEvent.eventSource === "browser"
        ? "browser"
        : (participant.latestEvent.eventSource ?? "unknown");

  return {
    summary: [
      `${participant.latestEvent.label} · ${sourceLabel}`,
      `${participant.eventCount} үйлдэл`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

function formatAudioWindow(chunk: ExamAudioChunk) {
  const format = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ulaanbaatar",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));

  return `${format(chunk.chunkStartedAt)} - ${format(chunk.chunkEndedAt)}`;
}

function SummaryStatCard({
  icon,
  label,
  value,
  tone,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "success" | "primary" | "danger";
  action?: ReactNode;
}) {
  const styles = {
    neutral: "text-slate-900",
    success: "text-[#22b454]",
    primary: "text-[#3566ff]",
    danger: "text-[#ff5b57]",
  }[tone];

  return (
    <div className="rounded-[28px] border border-[#eadcdc] bg-white px-5 py-5 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex items-center gap-2 text-[15px] font-medium ${styles}`}
        >
          <span className="grid size-6 place-items-center">{icon}</span>
          {label}
        </div>
        {action}
      </div>
      <div className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
        {value}
      </div>
    </div>
  );
}

function AudioSummaryCard({
  loading,
  buttonDisabled,
  participantName,
  helperText,
  onListen,
}: {
  loading: boolean;
  buttonDisabled: boolean;
  participantName: string;
  helperText: string;
  onListen: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#eadcdc] bg-white px-5 py-5 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[15px] font-medium text-[#ef8f20]">
          <span className="grid size-6 place-items-center">
            <Headphones className="size-5" />
          </span>
          Дуу хураагуур
        </div>
        <button
          type="button"
          onClick={onListen}
          disabled={buttonDisabled}
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#f3dfc2] bg-[#fff8ee] text-[#ef8f20] transition hover:bg-[#fff2de] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Сурагчийн дуу бичлэг сонсох"
        >
          <AudioLines className="size-5" />
        </button>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
            {loading ? "Хайж байна..." : participantName}
          </div>
          <div className="mt-1 text-sm text-slate-400">{helperText}</div>
        </div>
      </div>
    </div>
  );
}

function useExamCountdown(exam: Exam, roster: ExamRosterDetail | null) {
  const isFinished = Boolean(
    roster?.finishedAt || exam.finishedAt || exam.status === "finished",
  );
  const finishAt = useMemo(() => {
    if (roster?.finishedAt) return roster.finishedAt;
    if (exam.finishedAt) return exam.finishedAt;
    if (exam.examStartedAt && exam.duration) {
      return new Date(
        new Date(exam.examStartedAt).getTime() + exam.duration * 60_000,
      ).toISOString();
    }
    return null;
  }, [exam.duration, exam.examStartedAt, exam.finishedAt, roster?.finishedAt]);

  const [countdown, setCountdown] = useState("--");

  useEffect(() => {
    if (isFinished) {
      setCountdown("Дууссан");
      return;
    }

    if (!finishAt) {
      setCountdown("--");
      return;
    }

    const update = () => {
      const diff = Math.max(new Date(finishAt).getTime() - Date.now(), 0);
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      setCountdown(
        [hours, minutes, seconds]
          .map((v) => String(v).padStart(2, "0"))
          .join(":"),
      );
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [finishAt, isFinished]);

  return countdown;
}

export default function TeacherScheduleDetailPanel({
  exam,
  roster,
  rosterLoading,
  attendanceJoined,
  attendanceSubmitted,
  onBack,
  onCopyCode,
}: {
  exam: Exam;
  roster: ExamRosterDetail | null;
  rosterLoading: boolean;
  attendanceJoined: number;
  attendanceSubmitted: number;
  onBack: () => void;
  onCopyCode?: CopyCodeHandler;
}) {
  const countdown = useExamCountdown(exam, roster);
  const participants = useMemo(
    () => roster?.participants ?? [],
    [roster?.participants],
  );
  const expectedCount = Math.max(
    roster?.expectedStudentsCount ?? exam.expectedStudentsCount ?? 0,
    participants.length,
  );
  const joinedCount = Math.max(
    participants.length,
    attendanceJoined,
    attendanceSubmitted,
  );
  const submittedStatuses = new Set(["submitted", "graded"]);
  const audioMonitoringEnabled = Boolean(
    exam.requiresAudioRecording ||
    exam.enabledCheatDetections?.includes("audio_recording_interrupted"),
  );
  const flaggedCount = participants.filter(
    (participant) =>
      participant.riskLevel !== "low" ||
      participant.isFlagged ||
      participant.flagCount > 0,
  ).length;
  const normalCount = Math.max(joinedCount - flaggedCount, 0);
  const submittedCount = Math.max(
    participants.filter((participant) =>
      submittedStatuses.has(participant.status),
    ).length,
    attendanceSubmitted,
  );
  const [audioChunksBySession, setAudioChunksBySession] = useState<
    Record<string, ExamAudioChunk[]>
  >({});
  const [audioLoading, setAudioLoading] = useState(false);
  const [selectedAudioSessionId, setSelectedAudioSessionId] = useState("");
  const audioSectionRef = useRef<HTMLDivElement>(null);
  const audioParticipantSignature = useMemo(
    () =>
      participants
        .map(
          (participant) =>
            `${participant.sessionId}:${participant.status}:${participant.submittedAt ?? ""}`,
        )
        .join("|"),
    [participants],
  );

  useEffect(() => {
    if (!audioMonitoringEnabled || participants.length === 0) {
      setAudioChunksBySession({});
      setAudioLoading(false);
      setSelectedAudioSessionId("");
      return;
    }

    let active = true;
    setAudioLoading(true);

    void Promise.allSettled(
      participants.map(async (participant) => ({
        sessionId: participant.sessionId,
        chunks: await getExamAudioChunks(participant.sessionId),
      })),
    )
      .then((results) => {
        if (!active) return;

        const nextMap: Record<string, ExamAudioChunk[]> = {};
        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          nextMap[result.value.sessionId] = result.value.chunks;
        }

        setAudioChunksBySession(nextMap);
        setSelectedAudioSessionId((current) => {
          if (current && (nextMap[current]?.length ?? 0) > 0) return current;
          const firstAvailable = participants.find(
            (participant) => (nextMap[participant.sessionId]?.length ?? 0) > 0,
          );
          return firstAvailable?.sessionId ?? "";
        });
      })
      .finally(() => {
        if (active) setAudioLoading(false);
      });

    return () => {
      active = false;
    };
  }, [audioMonitoringEnabled, audioParticipantSignature, participants]);

  const audioParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          (audioChunksBySession[participant.sessionId]?.length ?? 0) > 0,
      ),
    [audioChunksBySession, participants],
  );
  const selectedAudioParticipant = useMemo(() => {
    if (!selectedAudioSessionId) return audioParticipants[0] ?? null;
    return (
      audioParticipants.find(
        (participant) => participant.sessionId === selectedAudioSessionId,
      ) ??
      audioParticipants[0] ??
      null
    );
  }, [audioParticipants, selectedAudioSessionId]);
  const selectedAudioChunks = selectedAudioParticipant
    ? (audioChunksBySession[selectedAudioParticipant.sessionId] ?? [])
    : [];
  const totalAudioClipCount = useMemo(
    () =>
      Object.values(audioChunksBySession).reduce(
        (sum, chunks) => sum + chunks.length,
        0,
      ),
    [audioChunksBySession],
  );
  const handleOpenAudioSection = () => {
    audioSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const audioSummaryTitle = audioLoading
    ? "Хайж байна..."
    : (selectedAudioParticipant?.studentName ??
      (audioMonitoringEnabled ? "Бичлэг хүлээгдэж байна" : "Идэвхжүүлээгүй"));
  const audioSummaryHelperText = audioLoading
    ? "Бичлэгүүдийг уншиж байна"
    : totalAudioClipCount > 0
      ? `${totalAudioClipCount} бичлэг бэлэн`
      : audioMonitoringEnabled
        ? "Одоогоор бичлэг алга"
        : "Энэ шалгалтад асаагаагүй";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-[#dbe4ef] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#f8fafc]"
          >
            <ChevronLeft className="size-4" />
            Буцах
          </button>
          <h2 className={sectionTitleClass}>Шалгалтын үйл явц</h2>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-400">
            Сурагчид зөрчил (хуулах) үйлдэл гаргасан тохиолдолд танд мэдэгдэл
            ирж, системд бүртгэгдэхийг анхаарна уу.
          </p>
        </div>

        <div className="w-full max-w-[280px] rounded-[22px] border border-[#e5e9ef] bg-white px-5 py-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.18)]">
          <div className="flex items-center gap-2 text-[15px] font-medium text-slate-800">
            <Clock3 className="size-4.5" />
            Шалгалт дуусахад
          </div>
          <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">
            {countdown === "Дууссан"
              ? "Дууссан"
              : countdown === "--"
                ? "--:--"
                : countdown}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <SummaryStatCard
          icon={<Clipboard className="size-5" />}
          label="Өрөөний код"
          value={exam.roomCode || "--"}
          tone="neutral"
          action={
            exam.roomCode ? (
              <RoomCodeCopyButton
                code={exam.roomCode}
                onCopyCode={onCopyCode}
                className="size-9"
              />
            ) : null
          }
        />
        <SummaryStatCard
          icon={<CheckCircle2 className="size-5" />}
          label="Илгээсэн"
          value={String(submittedCount)}
          tone="success"
        />
        <SummaryStatCard
          icon={<CalendarDays className="size-5" />}
          label="Хэвийн"
          value={String(normalCount)}
          tone="primary"
        />
        <SummaryStatCard
          icon={<AlertCircle className="size-5" />}
          label="Зөрчил"
          value={String(flaggedCount)}
          tone="danger"
        />
        <AudioSummaryCard
          loading={audioLoading}
          buttonDisabled={audioLoading}
          participantName={audioSummaryTitle}
          helperText={audioSummaryHelperText}
          onListen={handleOpenAudioSection}
        />
      </div>

      <div
        ref={audioSectionRef}
        className="rounded-[28px] border border-[#e7ebf2] bg-white px-6 py-6 shadow-[0_26px_50px_-38px_rgba(15,23,42,0.2)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">
              Сурагчийн дуу бичлэг
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-slate-400">
              Сурагч сонгоод play дарж дуу бичлэгийг шууд сонсоно. Зөрчилтэй үед
              багшид хурдан шалгах боломжтойгоор энгийн байдлаар үзүүлж байна.
            </p>
          </div>
          {audioParticipants.length > 0 ? (
            <div className="w-full max-w-[320px]">
              <TeacherSelect
                options={audioParticipants.map((participant) => ({
                  value: participant.sessionId,
                  label: `${participant.studentName} · ${
                    audioChunksBySession[participant.sessionId]?.length ?? 0
                  } бичлэг`,
                }))}
                value={selectedAudioParticipant?.sessionId ?? ""}
                onChange={(event) =>
                  setSelectedAudioSessionId(event.target.value)
                }
                className="min-h-[48px] rounded-[16px] border-[#d8dee8] py-0 text-[15px] font-medium text-[#20232d] shadow-[0_2px_10px_-8px_rgba(15,23,42,0.15)]"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          {!audioMonitoringEnabled ? (
            <div className="rounded-[20px] border border-dashed border-[#dce5ef] bg-[#fbfdff] px-5 py-5 text-sm leading-6 text-slate-500">
              Энэ шалгалтад дуу бичлэгийн хяналт асаагаагүй байна. Дараагийн
              шалгалтад сэжигтэй үйлдэлүүдийг тохиргоон дээрээс `Дуу хураагуур`
              хэсгийг идэвхжүүлээд ашиглаж болно.
            </div>
          ) : audioLoading ? (
            <div className="flex items-center gap-3 rounded-[20px] border border-[#e8edf5] bg-[#fbfdff] px-5 py-5 text-sm text-slate-500">
              <LoaderCircle className="size-5 animate-spin text-[#ef8f20]" />
              Дуу бичлэгүүдийг ачаалж байна...
            </div>
          ) : audioParticipants.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#dce5ef] bg-[#fbfdff] px-5 py-5 text-sm text-slate-500">
              Одоогоор сурагчдаас ирсэн дуу бичлэг алга байна.
            </div>
          ) : selectedAudioParticipant ? (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-[#e8edf5] bg-[#fbfdff] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-semibold text-slate-900">
                      {selectedAudioParticipant.studentName}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {selectedAudioParticipant.studentCode || "--"} ·{" "}
                      {selectedAudioChunks.length} бичлэг
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f3dfc2] bg-[#fff8ee] px-3 py-2 text-sm font-semibold text-[#ef8f20]">
                    <Headphones className="size-4" />
                    Сонсож шалгана
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedAudioChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="rounded-[20px] border border-[#e8edf5] bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Бичлэг #{chunk.sequenceNumber + 1}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatAudioWindow(chunk)}
                        </div>
                      </div>
                      <span className="rounded-full border border-[#dce5ef] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {Math.round(chunk.durationMs / 1000)} сек
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <audio
                        controls
                        preload="none"
                        src={chunk.assetUrl}
                        className="w-full max-w-[420px]"
                      />
                      <a
                        className="inline-flex items-center rounded-[12px] border border-[#dce5ef] bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-[#f8fafc]"
                        href={chunk.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Тусдаа нээх
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e7ebf2] bg-white shadow-[0_26px_50px_-38px_rgba(15,23,42,0.2)]">
        <div className="grid grid-cols-[1.35fr_1.2fr_1fr_1.2fr_1.15fr_1fr] gap-4 border-b border-[#edf1f5] px-7 py-4 text-[13px] font-medium text-slate-500">
          <div>Сурагчдийн нэрс ↑↓</div>
          <div>Сурагчийн код</div>
          <div>Оноо</div>
          <div>Гүйцэтгэлийн явц</div>
          <div>Илгээсэн цаг</div>
          <div>Төлөв</div>
        </div>
        <div className="divide-y divide-[#edf1f5]">
          {rosterLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.35fr_1.2fr_1fr_1.2fr_1.15fr_1fr] gap-4 px-7 py-5"
              >
                {Array.from({ length: 6 }).map((__, cellIndex) => (
                  <Skeleton
                    key={cellIndex}
                    className="h-6 rounded-full border border-[#edf2fb]"
                  />
                ))}
              </div>
            ))
          ) : participants.length === 0 ? (
            <div className="px-6 py-8">
              <TeacherEmptyState
                icon={<UsersRound className="h-5 w-5" />}
                title="Одоогоор сурагч нэвтрээгүй байна"
                description="Нэвтэрсэн сурагчид энд явц болон эрсдэлийн мэдээлэлтэй харагдана."
              />
            </div>
          ) : (
            participants.map((participant) => {
              const meta = getParticipantMeta(participant);
              const evidence = formatParticipantEvidence(participant);
              const scoreLabel =
                participant.score !== null && participant.score !== undefined
                  ? `${participant.score}/${participant.totalQuestions || "--"}`
                  : "Илгэээгээгүй байна";
              const progressBaseTone =
                participant.progressPercent === 0
                  ? "bg-[#c9ced7]"
                  : "bg-[#b6e8c7]";

              return (
                <div
                  key={participant.sessionId}
                  className="grid grid-cols-[1.35fr_1.2fr_1fr_1.2fr_1.15fr_1fr] gap-4 px-7 py-5 text-[15px] text-slate-800"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">
                      {participant.studentName}
                    </div>
                    {evidence.summary !== "Зөрчил бүртгэгдээгүй" ? (
                      <div className="mt-2 text-sm text-slate-400">
                        {evidence.summary}
                      </div>
                    ) : null}
                  </div>
                  <div className="font-medium text-slate-900">
                    {participant.studentCode || "--"}
                  </div>
                  <div
                    className={
                      participant.score == null
                        ? "text-slate-400"
                        : "text-slate-900"
                    }
                  >
                    {scoreLabel}
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-[5px] w-[106px] overflow-hidden rounded-full ${progressBaseTone}`}
                    >
                      <div
                        className={`h-full rounded-full ${meta.progressTone}`}
                        style={{ width: `${participant.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {participant.progressPercent}%
                    </span>
                  </div>
                  <div
                    className={
                      participant.submittedAt
                        ? "text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {participant.submittedAt
                      ? formatCompactDateTime(participant.submittedAt)
                      : "Илгэээгээгүй байна"}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-[#edf1f5] px-7 py-4 text-sm text-slate-500">
          Нийт {expectedCount} сурагч
        </div>
      </div>
    </div>
  );
}
