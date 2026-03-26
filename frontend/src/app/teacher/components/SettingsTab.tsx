import type { Exam, Submission } from "../types";
import { badgeClass, sectionDescriptionClass, sectionTitleClass } from "../styles";

type SettingsTabProps = {
  activeExam: Exam | null;
  submissions: Submission[];
  currentUserName?: string | null;
};

type QuestionPerformance = {
  index: number;
  id: string;
  text: string;
  type: "text" | "open" | "mcq";
  options: string[];
  correctAnswer: string;
  correctRate: number;
  correctCount: number;
  total: number;
  answeredCount: number;
  leadingAnswer: string;
  topStudentName: string | null;
};

function getInitials(name?: string | null) {
  const source = name?.trim();
  if (!source) return "Б";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getProgressTone(rate: number) {
  if (rate >= 70) {
    return {
      track: "bg-lime-100 dark:bg-lime-950/50",
      fill: "bg-lime-500",
      text: "text-lime-500",
    };
  }

  if (rate >= 50) {
    return {
      track: "bg-amber-100 dark:bg-amber-950/50",
      fill: "bg-amber-500",
      text: "text-amber-500",
    };
  }

  return {
    track: "bg-orange-100 dark:bg-orange-950/50",
    fill: "bg-orange-400",
    text: "text-orange-400",
  };
}

function EditIcon() {
  return (
    <svg
      className="h-5 w-5 text-foreground/80"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function ProgressMeter({
  rate,
  studentName,
}: {
  rate: number;
  studentName?: string | null;
}) {
  const tone = getProgressTone(rate);

  return (
    <div className="flex items-center gap-3">
      <div className={`h-2.5 w-40 overflow-hidden rounded-full ${tone.track}`}>
        <div
          className={`h-full rounded-full ${tone.fill}`}
          style={{ width: `${Math.max(rate, 6)}%` }}
        />
      </div>
      <span className={`text-2xl font-semibold ${tone.text}`}>{rate}%</span>
      {studentName && (
        <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-xs font-semibold text-foreground shadow-sm">
          {getInitials(studentName)}
        </div>
      )}
    </div>
  );
}

function buildQuestionPerformance(
  activeExam: Exam | null,
  submissions: Submission[],
): QuestionPerformance[] {
  if (!activeExam) return [];

  return activeExam.questions.map((question, index) => {
    const relatedAnswers = submissions
      .map((submission) => {
        const answer = submission.answers?.find((item) => item.questionId === question.id);
        if (!answer) return null;

        return {
          studentName: submission.studentName,
          selectedAnswer: answer.selectedAnswer?.trim() ?? "",
          correct: answer.correct,
        };
      })
      .filter(
        (
          item,
        ): item is {
          studentName: string;
          selectedAnswer: string;
          correct: boolean;
        } => Boolean(item),
      );

    const answerCounts = new Map<string, number>();
    for (const answer of relatedAnswers) {
      if (!answer.selectedAnswer) continue;
      answerCounts.set(
        answer.selectedAnswer,
        (answerCounts.get(answer.selectedAnswer) ?? 0) + 1,
      );
    }

    const leadingAnswer =
      [...answerCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      question.correctAnswer;
    const topStudentName =
      relatedAnswers.find((answer) => answer.correct)?.studentName ?? null;
    const correctCount = relatedAnswers.filter((answer) => answer.correct).length;
    const total = submissions.length;
    const answeredCount = relatedAnswers.filter((answer) => answer.selectedAnswer).length;

    return {
      index,
      id: question.id,
      text: question.text,
      type: question.type,
      options: question.options ?? [],
      correctAnswer: question.correctAnswer,
      correctRate: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      correctCount,
      total,
      answeredCount,
      leadingAnswer,
      topStudentName,
    };
  });
}

export default function SettingsTab({
  activeExam,
  submissions,
  currentUserName,
}: SettingsTabProps) {
  const questions = buildQuestionPerformance(activeExam, submissions);

  if (!activeExam) {
    return (
      <section className="rounded-[30px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-6 py-10 text-center shadow-sm">
        <h2 className="text-2xl font-semibold">Шалгалтын гүйцэтгэл</h2>
        <p className="mt-3 text-sm text-slate-500">
          Дүнтэй шалгалт орж ирсний дараа энэ хэсэгт асуулт бүрийн гүйцэтгэл харагдана.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={badgeClass}>After Exam</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>
            Шалгалтын гүйцэтгэл
          </h2>
          <p className={`mt-2 ${sectionDescriptionClass}`}>
            Сурагчдын гүйцэтгэлийг хувиар харах хэсэг
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-[#dce5ef] bg-white px-4 py-2 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f5f9] text-sm font-semibold text-foreground">
            {getInitials(currentUserName)}
          </div>
          <span className="text-sm font-medium text-foreground">
            {currentUserName ?? "Багш"}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((question) => (
          <article
            key={question.id}
            className="rounded-[30px] border border-[#dce5ef] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">
                {question.index + 1}. {question.text}
              </h3>
              {question.type !== "text" && <EditIcon />}
            </div>

            {question.type === "text" && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-lime-500/15 text-lime-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-500" />
                  </span>
                  <span className="truncate text-2xl font-medium text-foreground">
                    {question.leadingAnswer || question.correctAnswer}
                  </span>
                </div>
                <ProgressMeter
                  rate={question.correctRate}
                  studentName={question.topStudentName}
                />
              </div>
            )}

            {question.type === "open" && (
              <>
                <div className="mt-5 rounded-2xl border border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground min-h-[110px]">
                  Хариултаа энд бичнэ үү
                </div>
              </>
            )}

            {question.type === "mcq" && (
              <>
                <div className="mt-5 space-y-3">
                  {(question.options.length > 0
                    ? question.options
                    : [question.leadingAnswer || question.correctAnswer]
                  ).map((option) => (
                    <div
                      key={`${question.id}-${option}`}
                      className="flex items-center gap-3 text-base text-foreground"
                    >
                      <span className="h-6 w-6 rounded-md border-2 border-border bg-background" />
                      <span>{option}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <ProgressMeter rate={question.correctRate} />
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
