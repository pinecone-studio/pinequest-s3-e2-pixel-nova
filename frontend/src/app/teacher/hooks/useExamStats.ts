import { useMemo, useState } from "react";
import type { Exam, Submission } from "../types";

export const useExamStats = (params: {
  exams: Exam[];
  submissions: Submission[];
}) => {
  const { exams, submissions } = params;
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const scheduledCount = exams.filter((exam) => exam.scheduledAt).length;
    const totalQuestions = exams.reduce((sum, exam) => {
      const count = exam.questions ? exam.questions.length : 0;
      return sum + count;
    }, 0);
    return [
      {
        label: "Нийт шалгалт",
        value: exams.length.toString(),
        trend: `${scheduledCount} нь товлогдсон`,
      },
      {
        label: "Нийт асуулт",
        value: totalQuestions.toString(),
        trend: "Шинэчилж байна",
      },
      {
        label: "Идэвхтэй өрөө",
        value: exams.length ? "1" : "0",
        trend: "Өрөөний код бэлэн",
      },
    ];
  }, [exams]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return submissions.find((item) => item.id === selectedSubmissionId) ?? null;
  }, [selectedSubmissionId, submissions]);

  const selectedExam = useMemo(() => {
    if (!selectedSubmission) return null;
    return exams.find((exam) => exam.id === selectedSubmission.examId) ?? null;
  }, [selectedSubmission, exams]);

  const examOptions = useMemo(() => {
    const finishedIds = new Set(submissions.map((s) => s.examId));
    return exams.filter((exam) => finishedIds.has(exam.id));
  }, [exams, submissions]);

  const activeExamId = selectedExamId ?? examOptions[0]?.id ?? null;
  const activeExam = useMemo(
    () => exams.find((exam) => exam.id === activeExamId) ?? null,
    [exams, activeExamId],
  );
  const activeSubmissions = useMemo(
    () => submissions.filter((s) => s.examId === activeExamId),
    [submissions, activeExamId],
  );

  const examStats = useMemo(() => {
    if (!activeExam) return null;
    const totalPoints = activeExam.questions?.length || 1;
    const average =
      activeSubmissions.reduce((sum, s) => sum + s.percentage, 0) /
      (activeSubmissions.length || 1);
    const hasAnswerDetails =
      activeSubmissions.some((s) => (s.answers ?? []).length > 0) &&
      (activeExam.questions?.length ?? 0) > 0;
    const questionStats = hasAnswerDetails
      ? (activeExam.questions ?? []).map((q) => {
          const correctCount = activeSubmissions.reduce((sum, s) => {
            const answer = s.answers?.find((a) => a.questionId === q.id);
            return sum + (answer?.correct ? 1 : 0);
          }, 0);
          return {
            id: q.id,
            text: q.text,
            correctCount,
            total: activeSubmissions.length,
            correctRate:
              activeSubmissions.length > 0
                ? Math.round((correctCount / activeSubmissions.length) * 100)
                : 0,
          };
        })
      : [];
    const mostMissed = hasAnswerDetails
      ? [...questionStats].sort((a, b) => a.correctRate - b.correctRate)[0]
      : undefined;
    const mostCorrect = hasAnswerDetails
      ? [...questionStats].sort((a, b) => b.correctRate - a.correctRate)[0]
      : undefined;
    const scoreDistribution = activeSubmissions.map((s) => ({
      name: s.studentName,
      score: Math.round((s.score / totalPoints) * 100),
    }));
    const correctTotal = activeSubmissions.reduce((sum, s) => sum + s.score, 0);
    const incorrectTotal =
      activeSubmissions.reduce((sum, s) => sum + (totalPoints - s.score), 0);
    return {
      average: Math.round(average),
      totalPoints,
      mostMissed,
      mostCorrect,
      scoreDistribution,
      correctTotal,
      incorrectTotal,
    };
  }, [activeExam, activeSubmissions]);

  return {
    stats,
    selectedSubmissionId,
    setSelectedSubmissionId,
    selectedSubmission,
    selectedExam,
    examOptions,
    selectedExamId,
    setSelectedExamId,
    activeExamId,
    activeExam,
    activeSubmissions,
    examStats,
  };
};
