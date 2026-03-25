import {
  calculateXP,
  generateId,
  getJSON,
  getJSONForRole,
  getLevel,
  setJSON,
  setJSONForRole,
} from "@/lib/examGuard";
import { getTeacherRoles } from "@/lib/role-session";
import type {
  Exam,
  Grade,
  NotificationItem,
  Question,
  StudentProgress,
  Submission,
  Violations,
} from "../types";
import type { User } from "@/lib/examGuard";

export const buildAnswerReport = (
  exam: Exam,
  answers: Record<string, string>,
): { question: Question; answer: string; correct: boolean }[] =>
  exam.questions.map((question) => {
    const studentAnswer = (answers[question.id] || "").trim();
    const correctAnswer = question.correctAnswer.trim();
    const correct =
      studentAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
      (question.type === "mcq" &&
        !!question.options?.some(
          (opt) =>
            opt.toLowerCase() === correctAnswer.toLowerCase() &&
            studentAnswer.toLowerCase() === opt.toLowerCase(),
        ));
    return { question, answer: studentAnswer, correct: !!correct };
  });

export const calculateSubmissionMetrics = (
  exam: Exam,
  report: { question: Question; correct: boolean }[],
  terminated: boolean,
) => {
  const score = terminated
    ? 0
    : report.reduce(
        (sum, item) => sum + (item.correct ? item.question.points ?? 1 : 0),
        0,
      );
  const totalPoints =
    exam.questions.reduce((sum, question) => sum + (question.points ?? 1), 0) ||
    1;
  const percentage = terminated ? 0 : Math.round((score / totalPoints) * 100);
  const grade: Grade =
    percentage >= 90
      ? "A"
      : percentage >= 80
      ? "B"
      : percentage >= 70
      ? "C"
      : percentage >= 60
      ? "D"
      : "F";
  return { score, totalPoints, percentage, grade };
};

export const persistSubmissionData = (params: {
  exam: Exam;
  currentUser: User;
  report: { question: Question; answer: string; correct: boolean }[];
  violations: Violations;
  terminated: boolean;
  reason?: string;
  setNotifications: (items: NotificationItem[]) => void;
}) => {
  const { exam, currentUser, report, violations, terminated, reason, setNotifications } =
    params;
  const { score, totalPoints, percentage, grade } = calculateSubmissionMetrics(
    exam,
    report,
    terminated,
  );
  const submission: Submission = {
    id: generateId(),
    examId: exam.id,
    studentId: currentUser.id,
    studentНэр: currentUser.username,
    answers: report.map((item) => ({
      questionId: item.question.id,
      selectedAnswer: item.answer,
      correct: item.correct,
    })),
    score,
    totalPoints,
    percentage,
    terminated,
    terminationReason: reason,
    violations,
    submittedAt: new Date().toISOString(),
  };
  const stored = getJSON<Submission[]>("submissions", []);
  setJSON("submissions", [submission, ...stored]);

  const teacherRoles = getTeacherRoles();
  teacherRoles.forEach((role) => {
    const roleExams = getJSONForRole<Exam[]>("exams", [], role);
    const match = roleExams.some(
      (item) => item.id === exam.id || item.roomCode === exam.roomCode,
    );
    if (!match) return;
    const teacherSubs = getJSONForRole<Submission[]>("submissions", [], role);
    setJSONForRole("submissions", [submission, ...teacherSubs], role);
  });

  const progress = getJSON<StudentProgress>("studentProgress", {});
  const existing = progress[currentUser.id] ?? {
    xp: 0,
    level: 1,
    history: [],
  };
  const xpEarned = terminated ? 0 : calculateXP(percentage);
  const nextXp = existing.xp + xpEarned;
  const level = getLevel(nextXp);
  progress[currentUser.id] = {
    xp: nextXp,
    level: level.level,
    history: [
      {
        examId: exam.id,
        percentage,
        xp: xpEarned,
        date: new Date().toISOString(),
        score,
        totalPoints,
        grade,
      },
      ...existing.history,
    ],
  };
  setJSON("studentProgress", progress);

  teacherRoles.forEach((role) => {
    const roleExams = getJSONForRole<Exam[]>("exams", [], role);
    const match = roleExams.some(
      (item) => item.id === exam.id || item.roomCode === exam.roomCode,
    );
    if (!match) return;
    const teacherProgress = getJSONForRole<StudentProgress>(
      "studentProgress",
      {},
      role,
    );
    const teacherExisting = teacherProgress[currentUser.id] ?? {
      xp: 0,
      level: 1,
      history: [],
    };
    const teacherNextXp = teacherExisting.xp + xpEarned;
    const teacherLevel = getLevel(teacherNextXp);
    teacherProgress[currentUser.id] = {
      xp: teacherNextXp,
      level: teacherLevel.level,
      history: [
        {
          examId: exam.id,
          percentage,
          xp: xpEarned,
          date: new Date().toISOString(),
          score,
          totalPoints,
          grade,
        },
        ...teacherExisting.history,
      ],
    };
    setJSONForRole("studentProgress", teacherProgress, role);
  });

  const notification: NotificationItem = {
    examId: exam.id,
    message: `📥 ${currentUser.username} ${exam.title} шалгалтыг өглөө (${percentage}%).`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const notifStore = getJSON<NotificationItem[]>("notifications", []);
  setJSON("notifications", [notification, ...notifStore]);
  setNotifications([notification, ...notifStore]);
  teacherRoles.forEach((role) => {
    const roleExams = getJSONForRole<Exam[]>("exams", [], role);
    const match = roleExams.some(
      (item) => item.id === exam.id || item.roomCode === exam.roomCode,
    );
    if (!match) return;
    const teacherNotifications = getJSONForRole<NotificationItem[]>(
      "notifications",
      [],
      role,
    );
    setJSONForRole(
      "notifications",
      [notification, ...teacherNotifications],
      role,
    );
  });

  return { submission, report };
};

export const markExamStartedForRoles = (exam: Exam, startedAt: string) => {
  const targetRoles = getTeacherRoles();
  targetRoles.forEach((role) => {
    const roleExams = getJSONForRole<Exam[]>("exams", [], role);
    const nextExams = roleExams.map((item) =>
      item.id === exam.id || item.roomCode === exam.roomCode
        ? { ...item, examStartedAt: startedAt }
        : item,
    );
    setJSONForRole("exams", nextExams, role);
  });
};
