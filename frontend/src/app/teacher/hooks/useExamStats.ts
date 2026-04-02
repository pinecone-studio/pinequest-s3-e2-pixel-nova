import { useEffect, useMemo, useRef, useState } from "react";
import type { StudentProgress, User } from "@/lib/examGuard";
import {
  buildCheatStudents,
  buildExamStats,
  buildTeacherOverviewStats,
  buildXpLeaderboard,
} from "../analytics";
import type {
  Exam,
  ExamStatsSummary,
  QuestionInsight,
  Submission,
  TeacherDashboardAnalytics,
} from "../types";
import {
  fetchExamQuestionInsights,
  fetchTeacherDashboardAnalytics,
  fetchTeacherExamDetail,
  fetchTeacherSubmissions,
} from "./teacher-api";

const DASHBOARD_REFRESH_MS = 5000;

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
  const [dashboardAnalytics, setDashboardAnalytics] =
    useState<TeacherDashboardAnalytics | null>(null);
  const loadedInsightExamIdsRef = useRef<Set<string>>(new Set());
  const activeExamRequestIdRef = useRef(0);

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
    const isResultsCandidate = (exam: Exam) => {
      const submissionCount = Number(exam.submissionCount ?? 0);
      const hasFinishedMarker = Boolean(exam.finishedAt);
      const status = String(exam.status ?? "").toLowerCase();

      return (
        submissionCount > 0 ||
        hasFinishedMarker ||
        status === "finished" ||
        status === "active" ||
        status === "completed" ||
        status === "graded"
      );
    };

    return exams
      .filter(isResultsCandidate)
      .sort((left, right) => {
        const rightSortKey =
          right.finishedAt ?? right.examStartedAt ?? right.scheduledAt ?? right.createdAt;
        const leftSortKey =
          left.finishedAt ?? left.examStartedAt ?? left.scheduledAt ?? left.createdAt;
        return rightSortKey.localeCompare(leftSortKey);
      });
  }, [exams]);

  const activeExamId = selectedExamId ?? examOptions[0]?.id ?? null;

  const activeExam = useMemo(() => {
    if (activeExamDetail?.id === activeExamId) return activeExamDetail;
    return exams.find((exam) => exam.id === activeExamId) ?? null;
  }, [activeExamDetail, activeExamId, exams]);

  const cheatStudents = useMemo(
    () =>
      buildCheatStudents({
        submissions: activeSubmissions.length > 0 ? activeSubmissions : submissions,
        exams,
      }),
    [activeSubmissions, submissions, exams],
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
    let cancelled = false;

    const loadDashboardAnalytics = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const payload = await fetchTeacherDashboardAnalytics(teacherId ?? undefined);
        if (cancelled) return;
        setDashboardAnalytics(payload);
      } catch {
        if (cancelled) return;
      }
    };

    void loadDashboardAnalytics();

    const interval = window.setInterval(() => {
      void loadDashboardAnalytics();
    }, DASHBOARD_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadDashboardAnalytics();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [teacherId]);

  useEffect(() => {
    if (!activeExamId) return;
    if (loadedInsightExamIdsRef.current.has(activeExamId)) return;

    let cancelled = false;
    loadedInsightExamIdsRef.current.add(activeExamId);

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
        loadedInsightExamIdsRef.current.delete(activeExamId);
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, [activeExamId, teacherId]);

  useEffect(() => {
    if (!activeExamId) {
      setActiveExamDetail(null);
      setActiveSubmissions([]);
      setSelectedSubmissionId(null);
      return;
    }

    let cancelled = false;
    const requestId = activeExamRequestIdRef.current + 1;
    activeExamRequestIdRef.current = requestId;

    const loadExamData = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      try {
        const [detail, submissionsForExam] = await Promise.all([
          fetchTeacherExamDetail(activeExamId, teacherId ?? undefined),
          fetchTeacherSubmissions(activeExamId, teacherId ?? undefined),
        ]);
        if (cancelled || requestId !== activeExamRequestIdRef.current) return;
        setActiveExamDetail(detail);
        setActiveSubmissions(
          [...submissionsForExam].sort((left, right) =>
            right.submittedAt.localeCompare(left.submittedAt),
          ),
        );
      } catch {
        if (cancelled || requestId !== activeExamRequestIdRef.current) return;
        setActiveExamDetail(exams.find((exam) => exam.id === activeExamId) ?? null);
        setActiveSubmissions([]);
      }
    };

    void loadExamData();

    const isLiveLikeExam = (() => {
      const exam = exams.find((item) => item.id === activeExamId) ?? activeExamDetail;
      if (!exam) return false;
      const status = String(exam.status ?? "").toLowerCase();
      return status === "active" || status === "in_progress";
    })();

    const interval = isLiveLikeExam
      ? window.setInterval(() => {
          void loadExamData();
        }, DASHBOARD_REFRESH_MS)
      : null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadExamData();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (interval !== null) {
        window.clearInterval(interval);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [activeExamDetail, activeExamId, exams, teacherId]);

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
    dashboardAnalytics,
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
