import { useEffect, useMemo, useState } from "react";
import type { StudentProgress, User } from "@/lib/examGuard";
import {
  buildCheatStudents,
  buildExamStats,
  buildTeacherOverviewStats,
  buildXpLeaderboard,
} from "../analytics";
import type { Exam, ExamStatsSummary, QuestionInsight, Submission } from "../types";
import { fetchExamQuestionInsights } from "./teacher-api";

export const useExamStats = (params: {
  exams: Exam[];
  submissions: Submission[];
  studentProgress: StudentProgress;
  users: User[];
  teacherId?: string | null;
}) => {
  const { exams, submissions, studentProgress, users, teacherId } = params;
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [remoteInsightsByExam, setRemoteInsightsByExam] = useState<
    Record<
      string,
      {
        questionStats: QuestionInsight[];
        mostMissed: QuestionInsight[];
        mostCorrect: QuestionInsight[];
      }
    >
  >({});

  const xpLeaderboard = useMemo(
    () =>
      buildXpLeaderboard({
        progress: studentProgress,
        submissions,
        users,
      }),
    [studentProgress, submissions, users],
  );

  const stats = useMemo(
    () =>
      buildTeacherOverviewStats({
        exams,
        submissions,
        xpLeaderboard,
      }),
    [exams, submissions, xpLeaderboard],
  );

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return submissions.find((item) => item.id === selectedSubmissionId) ?? null;
  }, [selectedSubmissionId, submissions]);

  const selectedExam = useMemo(() => {
    if (!selectedSubmission) return null;
    return exams.find((exam) => exam.id === selectedSubmission.examId) ?? null;
  }, [selectedSubmission, exams]);

  const examOptions = useMemo(() => {
    const finishedIds = new Set(submissions.map((submission) => submission.examId));
    return exams
      .filter((exam) => finishedIds.has(exam.id))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [exams, submissions]);

  const activeExamId = selectedExamId ?? examOptions[0]?.id ?? null;

  const activeExam = useMemo(
    () => exams.find((exam) => exam.id === activeExamId) ?? null,
    [exams, activeExamId],
  );

  const activeSubmissions = useMemo(
    () =>
      submissions
        .filter((submission) => submission.examId === activeExamId)
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt)),
    [submissions, activeExamId],
  );

  const cheatStudents = useMemo(
    () =>
      buildCheatStudents({
        submissions,
        exams,
      }),
    [submissions, exams],
  );

  const examStats = useMemo(
    () =>
      buildExamStats({
        activeExam,
        activeSubmissions,
      }),
    [activeExam, activeSubmissions],
  );

  useEffect(() => {
    if (!activeExamId || remoteInsightsByExam[activeExamId]) return;

    let cancelled = false;

    const loadInsights = async () => {
      try {
        const payload = await fetchExamQuestionInsights(activeExamId, teacherId ?? undefined);
        if (cancelled) return;
        setRemoteInsightsByExam((current) => ({
          ...current,
          [activeExamId]: payload,
        }));
      } catch {
        if (cancelled) return;
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, [activeExamId, remoteInsightsByExam, teacherId]);

  const mergedExamStats = useMemo<ExamStatsSummary | null>(() => {
    if (!examStats || !activeExamId) return examStats;
    const remote = remoteInsightsByExam[activeExamId];
    if (!remote) return examStats;

    return {
      ...examStats,
      questionStats: remote.questionStats,
      mostMissed: remote.mostMissed,
      mostCorrect: remote.mostCorrect,
    };
  }, [activeExamId, examStats, remoteInsightsByExam]);

  return {
    stats,
    cheatStudents,
    xpLeaderboard,
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
    examStats: mergedExamStats,
  };
};
