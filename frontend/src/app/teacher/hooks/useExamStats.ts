import { useEffect, useMemo, useState } from "react";
import type { StudentProgress, User } from "@/lib/examGuard";
import {
  buildCheatStudents,
  buildExamStats,
  buildTeacherOverviewStats,
  buildXpLeaderboard,
} from "../analytics";
import type { Exam, Submission } from "../types";

export const useExamStats = (params: {
  exams: Exam[];
  submissions: Submission[];
  studentProgress: StudentProgress;
  users: User[];
}) => {
  const { exams, submissions, studentProgress, users } = params;
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedSubmissionId) return;
    const belongsToActiveExam = activeSubmissions.some(
      (submission) => submission.id === selectedSubmissionId,
    );
    if (!belongsToActiveExam) {
      setSelectedSubmissionId(null);
    }
  }, [activeSubmissions, selectedSubmissionId]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return activeSubmissions.find((item) => item.id === selectedSubmissionId) ?? null;
  }, [selectedSubmissionId, activeSubmissions]);

  const selectedExam = useMemo(() => {
    if (selectedSubmission) {
      return exams.find((exam) => exam.id === selectedSubmission.examId) ?? null;
    }
    return activeExam;
  }, [selectedSubmission, activeExam, exams]);

  const xpLeaderboard = useMemo(
    () =>
      buildXpLeaderboard({
        progress: studentProgress,
        submissions,
        users,
      }),
    [studentProgress, submissions, users],
  );

  const cheatStudents = useMemo(
    () =>
      buildCheatStudents({
        submissions,
        exams,
      }),
    [submissions, exams],
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

  const examStats = useMemo(
    () =>
      buildExamStats({
        activeExam,
        activeSubmissions,
      }),
    [activeExam, activeSubmissions],
  );

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
    examStats,
  };
};
