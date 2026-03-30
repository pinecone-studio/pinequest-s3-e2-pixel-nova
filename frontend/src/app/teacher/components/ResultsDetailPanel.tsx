import { FileSearch, UserRoundSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cardClass, sectionDescriptionClass } from "../styles";
import type { Exam, Submission, ExamStatsSummary } from "../types";
import type { StudentProfile } from "@/lib/backend-auth";
import AttendanceStatsCard from "./AttendanceStatsCard";
import type { ExamAttendanceStats } from "../hooks/useExamAttendanceStats";
import TeacherEmptyState from "./TeacherEmptyState";
import { Skeleton } from "@/components/ui/skeleton";

type ResultsDetailPanelProps = {
  selectedSubmission: Submission | null;
  selectedExam: Exam | null;
  examStats: ExamStatsSummary | null;
  attendanceStats: ExamAttendanceStats | null;
  attendanceLoading: boolean;
  studentProfile: StudentProfile | null;
  profileLoading: boolean;
};

export default function ResultsDetailPanel({
  selectedSubmission,
  selectedExam,
  examStats,
  attendanceStats,
  attendanceLoading,
  studentProfile,
  profileLoading,
}: ResultsDetailPanelProps) {
  const [countdown, setCountdown] = useState("00:00:00");

  const violationEntries = selectedSubmission?.violations
    ? [
        { label: "Tab", value: selectedSubmission.violations.tabSwitch },
        { label: "Blur", value: selectedSubmission.violations.windowBlur },
        { label: "Copy", value: selectedSubmission.violations.copyAttempt },
        { label: "Paste", value: selectedSubmission.violations.pasteAttempt },
        { label: "Fullscreen", value: selectedSubmission.violations.fullscreenExit },
        { label: "Shortcut", value: selectedSubmission.violations.keyboardShortcut },
      ]
    : [];

  const finishAt = useMemo(() => {
    if (!selectedExam) return null;
    if (selectedExam.finishedAt) return selectedExam.finishedAt;
    if (selectedExam.examStartedAt && selectedExam.duration) {
      const start = new Date(selectedExam.examStartedAt).getTime();
      if (!Number.isNaN(start)) {
        return new Date(start + selectedExam.duration * 60_000).toISOString();
      }
    }
    return null;
  }, [selectedExam]);

  const resultsLocked = Boolean(
    selectedExam &&
      selectedExam.status !== "finished" &&
      !selectedExam.finishedAt,
  );

  useEffect(() => {
    if (!finishAt || !resultsLocked) {
      setCountdown("00:00:00");
      return;
    }
    const updateCountdown = () => {
      const target = new Date(finishAt).getTime();
      if (Number.isNaN(target)) {
        setCountdown("00:00:00");
        return;
      }
      const diff = Math.max(target - Date.now(), 0);
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      const pad = (value: number) => value.toString().padStart(2, "0");
      setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [finishAt, resultsLocked]);

  return (
    <div className={cardClass}>
      <h2 className="text-xl font-semibold text-slate-900">Дэлгэрэнгүй</h2>
      <p className={`mt-2 ${sectionDescriptionClass}`}>
        Сонгосон сурагчийн профайл, зөрчил, асуулт тус бүрийн хариултыг нэг дороос харна.
      </p>
      {!selectedSubmission && (
        <div className="mt-6">
          <TeacherEmptyState
            icon={
              selectedExam ? (
                <UserRoundSearch className="h-5 w-5" />
              ) : (
                <FileSearch className="h-5 w-5" />
              )
            }
            title={
              selectedExam
                ? "Сурагч сонгоогүй байна"
                : "Шалгалт сонгоогүй байна"
            }
            description={
              selectedExam
                ? `"${selectedExam.title}" шалгалтын жагсаалтаас нэг сурагч сонговол энд дэлгэрэнгүй тайлан харагдана.`
                : "Гүйцэтгэлийн жагсаалтаас шалгалт сонгоод дүн, тайлан, хариултын мэдээллээ нээнэ үү."
            }
          />
        </div>
      )}
      {selectedSubmission && (
        <div className="mt-6 space-y-3 text-sm">
          <div className="rounded-[24px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">
              Student Snapshot
            </div>
            <div className="mt-2 text-lg font-semibold">{selectedSubmission.studentName}</div>
            <div className="mt-1 text-sm text-slate-500">
              {selectedSubmission.percentage}% · {selectedSubmission.score}/
              {selectedSubmission.totalPoints} оноо
            </div>
          </div>
          <div className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-4 py-4 text-xs">
            <div className="font-semibold text-foreground">Сурагчийн профайл</div>
            {profileLoading && (
              <div className="mt-3 grid gap-2">
                <Skeleton className="h-4 w-28 rounded-full bg-slate-200" />
                <Skeleton className="h-4 w-40 rounded-full bg-slate-200" />
                <Skeleton className="h-4 w-32 rounded-full bg-slate-200" />
              </div>
            )}
            {!profileLoading && !studentProfile && (
              <div className="mt-2 text-muted-foreground">
                Профайл мэдээлэл алга.
              </div>
            )}
            {!profileLoading && studentProfile && (
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <div>Нэр: {studentProfile.fullName}</div>
                {studentProfile.email && (
                  <div>Имэйл: {studentProfile.email}</div>
                )}
                {studentProfile.phone && (
                  <div>Утас: {studentProfile.phone}</div>
                )}
                {studentProfile.school && (
                  <div>Сургууль: {studentProfile.school}</div>
                )}
                {studentProfile.grade && (
                  <div>Анги: {studentProfile.grade}</div>
                )}
                {studentProfile.groupName && (
                  <div>Бүлэг: {studentProfile.groupName}</div>
                )}
                {studentProfile.bio && (
                  <div>Танилцуулга: {studentProfile.bio}</div>
                )}
                {typeof studentProfile.level === "number" && (
                  <div>Түвшин: Lv.{studentProfile.level}</div>
                )}
                {typeof studentProfile.xp === "number" && (
                  <div>XP: {studentProfile.xp}</div>
                )}
              </div>
            )}
          </div>
          {violationEntries.length > 0 && (
            <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs">
              <div className="font-semibold text-foreground">Хяналтын тэмдэглэл</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {violationEntries.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-2 py-1"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resultsLocked && (
            <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-4 text-xs text-amber-800">
              <div className="text-sm font-semibold">
                Шалгалт дуусаагүй байна
              </div>
              <div className="mt-1">
                Шалгалт дууссаны дараа хариулт, тайлан гарна.
              </div>
              {finishAt && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-700">
                  Дуусах хүртэл: {countdown}
                </div>
              )}
            </div>
          )}
          {selectedExam && selectedSubmission.answers && !resultsLocked && (
            <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                {selectedExam.questions.map((question, index) => {
                  const answer = selectedSubmission.answers?.find(
                    (item) => item.questionId === question.id,
                  );
                  const stat = examStats?.questionStats.find(
                    (item) => item.id === question.id,
                  );
                  const rate = stat?.correctRate ?? 0;
                  const barTone =
                    rate >= 70
                      ? "bg-emerald-500"
                      : rate >= 45
                        ? "bg-amber-500"
                        : "bg-rose-500";
                  const textTone =
                    rate >= 70
                      ? "text-emerald-600"
                      : rate >= 45
                        ? "text-amber-600"
                        : "text-rose-600";
                  return (
                    <div
                      key={question.id}
                      className="rounded-[22px] border border-[#f2dede] bg-[#fff1f1] px-5 py-4 shadow-[0_10px_24px_rgba(255,158,158,0.12)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800">
                          {index + 1}. {question.text}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            answer?.correct ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {answer?.correct ? "Зөв" : "Буруу"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 text-xs text-slate-600">
                          Өгсөн хариулт:{" "}
                          <span className="font-semibold text-slate-800">
                            {answer?.selectedAnswer || "Хариулаагүй"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-[6px] w-[170px] overflow-hidden rounded-full bg-[#f2dede]">
                            <div
                              className={`h-full ${barTone}`}
                              style={{
                                width: `${rate}%`,
                                transition: "width 700ms ease",
                              }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${textTone}`}>
                            {rate}%
                          </span>
                        </div>
                      </div>
                      {!answer?.correct && (
                        <div className="mt-2 text-xs text-slate-500">
                          Зөв хариулт: {question.correctAnswer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="self-start">
                <AttendanceStatsCard
                  stats={attendanceStats}
                  loading={attendanceLoading}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
