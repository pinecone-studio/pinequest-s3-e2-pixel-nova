import { useCallback, useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  User,
  getSessionUser,
  getJSON,
  setJSON,
} from "@/lib/examGuard";
import {
  getAuthUsers,
  getTeacherExams,
  getTeacherExamSubmissions,
  getXpLeaderboard,
  type TeacherExamSummary,
  type TeacherSubmissionSummary,
} from "@/api";
import type { StudentProgress } from "@/lib/examGuard";
import { normalizeSubmission } from "../analytics";
import type { Exam, NotificationItem, Submission } from "../types";

const mapExam = (exam: TeacherExamSummary): Exam => ({
  id: exam.id,
  title: exam.title,
  scheduledAt: exam.scheduledAt,
  examStartedAt: exam.startedAt ?? null,
  roomCode: exam.roomCode ?? "",
  questions: [],
  duration: exam.durationMin,
  createdAt: exam.createdAt,
});

const mapSubmission = (submission: TeacherSubmissionSummary): Submission => ({
  id: submission.id,
  examId: submission.examId,
  studentId: submission.studentId,
  studentName: submission.studentName,
  score: submission.score ?? 0,
  totalPoints: submission.totalPoints ?? 0,
  percentage: submission.percentage ?? submission.score ?? 0,
  submittedAt: submission.submittedAt ?? new Date(0).toISOString(),
  violations: submission.flagCount
    ? {
        tabSwitch: 0,
        windowBlur: 0,
        copyAttempt: 0,
        pasteAttempt: 0,
        fullscreenExit: 0,
        keyboardShortcut: 0,
      }
    : undefined,
});

export const useTeacherData = (overrideUser?: User | null) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const syncFromStorage = useCallback(() => {
    setUsers(getJSON<User[]>(STORAGE_KEYS.users, []));
    setExams(getJSON<Exam[]>("exams", []));
    setSubmissions(
      getJSON<unknown[]>("submissions", [])
        .map((item) => normalizeSubmission(item as Submission))
        .filter((item): item is Submission => Boolean(item)),
    );
    setStudentProgress(getJSON<StudentProgress>("studentProgress", {}));
    setNotifications(getJSON<NotificationItem[]>("notifications", []));
  }, []);

  useEffect(() => {
    const user = overrideUser ?? getSessionUser();
    setCurrentUser(
      user ?? {
        id: "demo",
        username: "DemoTeacher",
        password: "",
        role: "teacher",
        createdAt: "",
      },
    );

    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);

    if (!user) {
      syncFromStorage();
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadRemote = async () => {
      setLoading(true);
      try {
        const [authUsers, teacherExams, leaderboard] = await Promise.all([
          getAuthUsers(),
          getTeacherExams(user),
          getXpLeaderboard(user),
        ]);

        if (cancelled) return;

        const mappedUsers = authUsers.map((item) => ({
          id: item.id,
          username: item.fullName,
          password: "",
          role: item.role,
          createdAt: "",
        }));
        const mappedExams = teacherExams.map(mapExam);

        setUsers(mappedUsers);
        setExams(mappedExams);
        setJSON(STORAGE_KEYS.users, mappedUsers);
        setJSON("exams", mappedExams);

        const submissionsByExam = await Promise.all(
          teacherExams.map((exam) => getTeacherExamSubmissions(exam.id, user)),
        );

        if (cancelled) return;

        const mappedSubmissions = submissionsByExam
          .flat()
          .map(mapSubmission)
          .map((item) => normalizeSubmission(item as Submission))
          .filter((item): item is Submission => Boolean(item));

        const nextProgress = leaderboard.reduce<StudentProgress>(
          (acc, entry) => {
            acc[entry.id] = {
              xp: entry.xp,
              level: entry.level,
              history: [],
            };
            return acc;
          },
          {},
        );

        setSubmissions(mappedSubmissions);
        setStudentProgress(nextProgress);
        setNotifications(getJSON<NotificationItem[]>("notifications", []));
        setJSON("submissions", mappedSubmissions);
        setJSON("studentProgress", nextProgress);
      } catch {
        if (cancelled) return;
        syncFromStorage();
        setToast("Failed to load teacher data from backend.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRemote();

    return () => {
      cancelled = true;
    };
  }, [overrideUser, overrideUser?.id, syncFromStorage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const persistExams = useCallback((next: Exam[]) => {
    setExams(next);
    setJSON("exams", next);
  }, []);

  const persistNotifications = useCallback((next: NotificationItem[]) => {
    setNotifications(next);
    setJSON("notifications", next);
  }, []);

  const markNotificationRead = useCallback(
    (index: number) => {
      const next = notifications.map((item, idx) =>
        idx === index ? { ...item, read: true } : item,
      );
      persistNotifications(next);
    },
    [notifications, persistNotifications],
  );

  return {
    currentUser,
    users,
    theme,
    setTheme,
    loading,
    toast,
    showToast,
    exams,
    setExams,
    persistExams,
    submissions,
    setSubmissions,
    studentProgress,
    notifications,
    setNotifications,
    persistNotifications,
    markNotificationRead,
  };
};
