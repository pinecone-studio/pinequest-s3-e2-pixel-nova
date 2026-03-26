import { cardClass, sectionDescriptionClass } from "../styles";
import type { Exam, Submission, ExamStatsSummary } from "../types";
import type { StudentProfile } from "@/lib/backend-auth";
import AttendanceStatsCard from "./AttendanceStatsCard";
import type { ExamAttendanceStats } from "../hooks/useExamAttendanceStats";

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

  return (
    <div className={cardClass}>
      <h2 className="text-xl font-semibold text-slate-900">Дэлгэрэнгүй</h2>
      <p className={`mt-2 ${sectionDescriptionClass}`}>
        Сонгосон сурагчийн профайл, зөрчил, асуулт тус бүрийн хариултыг нэг дороос харна.
      </p>
      <div className="mt-4">
        <AttendanceStatsCard
          stats={attendanceStats}
          loading={attendanceLoading}
        />
      </div>
      {!selectedSubmission && (
        <div className="mt-6 text-sm text-slate-500">
          {selectedExam
            ? `"${selectedExam.title}" шалгалтын дүнгээс нэг сурагч сонговол энд дэлгэрэнгүй гарна.`
            : "Дэлгэрэнгүй харахын тулд жагсаалтаас сонгоно уу."}
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
              <div className="mt-2 text-muted-foreground">Ачаалж байна...</div>
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
          {selectedExam && selectedSubmission.answers && (
            <div className="space-y-2">
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
                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-[#dce5ef] bg-[#fbfdff] px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="pr-3">
                        {index + 1}. {question.text}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          answer?.correct
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-red-600 dark:text-red-300"
                        }`}
                      >
                        {answer?.correct ? "Зөв" : "Буруу"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Өгсөн хариулт: {answer?.selectedAnswer || "Хариулаагүй"}
                    </div>
                    {!answer?.correct && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Зөв хариулт: {question.correctAnswer}
                      </div>
                    )}
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8edf3]">
                        <div
                          className={`h-full ${barTone}`}
                          style={{
                            width: `${rate}%`,
                            transition: "width 700ms ease",
                          }}
                        />
                      </div>
                      <div className="mt-1 text-right text-[11px] font-semibold text-slate-600">
                        {rate}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
