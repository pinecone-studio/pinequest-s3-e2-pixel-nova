import { cardClass } from "../styles";
import type { Exam, Submission } from "../types";
import type { StudentProfile } from "@/lib/backend-auth";

type ResultsDetailPanelProps = {
  selectedSubmission: Submission | null;
  selectedExam: Exam | null;
  studentProfile: StudentProfile | null;
  profileLoading: boolean;
};

export default function ResultsDetailPanel({
  selectedSubmission,
  selectedExam,
  studentProfile,
  profileLoading,
}: ResultsDetailPanelProps) {
  return (
    <div className={cardClass}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">Дэлгэрэнгүй</h2>
      {!selectedSubmission && (
        <div className="mt-4 text-sm text-muted-foreground">
          Дэлгэрэнгүй харахын тулд жагсаалтаас сонгоно уу.
        </div>
      )}
      {selectedSubmission && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl border border-border bg-muted px-3 py-2">
            {selectedSubmission.studentName} · {selectedSubmission.percentage}% ·{" "}
            {selectedSubmission.score}/{selectedSubmission.totalPoints}
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs">
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
          {selectedSubmission.violations && (
            <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs">
              Зөрчил: Таб {selectedSubmission.violations.tabSwitch} · Цонх алдалт{" "}
              {selectedSubmission.violations.windowBlur} · Хуулах{" "}
              {selectedSubmission.violations.copyAttempt} · Буулгах{" "}
              {selectedSubmission.violations.pasteAttempt} · Бүтэн дэлгэц{" "}
              {selectedSubmission.violations.fullscreenExit} · Товч{" "}
              {selectedSubmission.violations.keyboardShortcut}
            </div>
          )}
          {selectedExam && selectedSubmission.answers && (
            <div className="space-y-2">
              {selectedExam.questions.map((question, index) => {
                const answer = selectedSubmission.answers?.find(
                  (item) => item.questionId === question.id,
                );
                return (
                  <div
                    key={question.id}
                    className="rounded-xl border border-border bg-muted px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span>
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
                    {!answer?.correct && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Зөв хариулт: {question.correctAnswer}
                      </div>
                    )}
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
