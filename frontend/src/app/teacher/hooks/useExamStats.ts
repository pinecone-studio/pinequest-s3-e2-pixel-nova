import { useEffect, useMemo, useState } from "react";
import type { StudentProgress, User } from "@/lib/examGuard";
import {
  buildCheatStudents,
  buildExamStats,
  buildTeacherOverviewStats,
  buildXpLeaderboard,
} from "../analytics";
import type { Exam, ExamStatsSummary, QuestionInsight, Submission } from "../types";
import {
  fetchExamQuestionInsights,
  fetchTeacherExamDetail,
  fetchTeacherSubmissions,
} from "./teacher-api";

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
  const [activeExamDetail, setActiveExamDetail] = useState<Exam | null>(null);
  const [activeSubmissions, setActiveSubmissions] = useState<Submission[]>([]);
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
    return activeSubmissions.find((item) => item.id === selectedSubmissionId) ?? null;
  }, [activeSubmissions, selectedSubmissionId]);

  const selectedExam = useMemo(() => {
    if (!selectedSubmission) return activeExamDetail;
    if (activeExamDetail?.id === selectedSubmission.examId) return activeExamDetail;
    return exams.find((exam) => exam.id === selectedSubmission.examId) ?? null;
  }, [activeExamDetail, exams, selectedSubmission]);

  const examOptions = useMemo(() => {
    return exams
      .filter((exam) => Number(exam.submissionCount ?? 0) > 0)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [exams]);

  const activeExamId = selectedExamId ?? examOptions[0]?.id ?? null;

  const activeExam = useMemo(() => {
    if (activeExamDetail?.id === activeExamId) return activeExamDetail;
    return exams.find((exam) => exam.id === activeExamId) ?? null;
  }, [activeExamDetail, activeExamId, exams]);

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

  useEffect(() => {
    if (!activeExamId) {
      setActiveExamDetail(null);
      setActiveSubmissions([]);
      setSelectedSubmissionId(null);
      return;
    }

    let cancelled = false;

    const loadExamData = async () => {
      try {
        const [detail, submissionsForExam] = await Promise.all([
          fetchTeacherExamDetail(activeExamId, teacherId ?? undefined),
          fetchTeacherSubmissions(activeExamId, teacherId ?? undefined),
        ]);
        if (cancelled) return;
        setActiveExamDetail(detail);
        setActiveSubmissions(
          [...submissionsForExam].sort((left, right) =>
            right.submittedAt.localeCompare(left.submittedAt),
          ),
        );
      } catch {
        if (cancelled) return;
        setActiveExamDetail(exams.find((exam) => exam.id === activeExamId) ?? null);
        setActiveSubmissions([]);
      }
    };

    void loadExamData();

    return () => {
      cancelled = true;
    };
  }, [activeExamId, exams, teacherId]);

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
