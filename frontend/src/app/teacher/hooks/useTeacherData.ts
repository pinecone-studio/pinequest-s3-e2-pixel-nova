import { useCallback, useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  getJSON,
  getSessionUser,
  setJSON,
  type StudentProgress,
  type User,
} from "@/lib/examGuard";
import type { NotificationItem, Exam, Submission } from "../types";
import { normalizeSubmission } from "../analytics";
import {
  fetchTeacherExams,
  fetchTeacherSubmissions,
  fetchXpLeaderboard,
} from "./teacher-api";

const DEMO_TEACHER: User = {
  id: "demo",
  username: "DemoTeacher",
  password: "",
  role: "teacher",
  createdAt: "",
};

export const useTeacherData = (overrideUser?: User | null) => {
  const overrideUserId = overrideUser?.id ?? null;
  const overrideUsername = overrideUser?.username ?? null;
  const overridePassword = overrideUser?.password ?? "";
  const overrideRole = overrideUser?.role ?? null;
  const overrideCreatedAt = overrideUser?.createdAt ?? "";

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
    setExams(getJSON<Exam[]>(STORAGE_KEYS.exams, []));
    setSubmissions(
      getJSON<Submission[]>(STORAGE_KEYS.submissions, []).map((item) =>
        normalizeSubmission(item),
      ).filter((item): item is Submission => Boolean(item)),
    );
    setStudentProgress(getJSON<StudentProgress>(STORAGE_KEYS.progress, {}));
    setNotifications(
      getJSON<NotificationItem[]>(STORAGE_KEYS.notifications, []),
    );
  }, []);

  useEffect(() => {
    const user =
      overrideUserId && overrideUsername && overrideRole
        ? {
            id: overrideUserId,
            username: overrideUsername,
            password: overridePassword,
            role: overrideRole,
            createdAt: overrideCreatedAt,
          }
        : getSessionUser();

    setCurrentUser(user ?? DEMO_TEACHER);

    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);

    syncFromStorage();

    let cancelled = false;

    const loadRemote = async () => {
      try {
        const remoteExams = await fetchTeacherExams();
        if (cancelled) return;

        setExams(remoteExams);
        setJSON(STORAGE_KEYS.exams, remoteExams);

        const submissionsByExam = await Promise.all(
          remoteExams.map((exam) => fetchTeacherSubmissions(exam.id)),
        );
        if (cancelled) return;

        const remoteSubmissions = submissionsByExam
          .flat()
          .map((item) => normalizeSubmission(item))
          .filter((item): item is Submission => Boolean(item));

        setSubmissions(remoteSubmissions);
        setJSON(STORAGE_KEYS.submissions, remoteSubmissions);

        const leaderboard = await fetchXpLeaderboard();
        if (cancelled) return;

        const progress: StudentProgress = {};
        const mappedUsers: User[] = leaderboard.map((student) => {
          progress[student.studentId] = {
            xp: student.xp,
            level: student.level,
            history: [],
          };
          return {
            id: student.studentId,
            username: student.name,
            password: "",
            role: "student",
            createdAt: new Date().toISOString(),
          };
        });

        setUsers(mappedUsers);
        setJSON(STORAGE_KEYS.users, mappedUsers);
        setStudentProgress(progress);
        setJSON(STORAGE_KEYS.progress, progress);
        setNotifications([]);
      } catch {
        if (!cancelled) syncFromStorage();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRemote();

    return () => {
      cancelled = true;
    };
  }, [
    overrideCreatedAt,
    overridePassword,
    overrideRole,
    overrideUserId,
    overrideUsername,
    syncFromStorage,
  ]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const remoteExams = await fetchTeacherExams();
        setExams(remoteExams);
        setJSON(STORAGE_KEYS.exams, remoteExams);

        const submissionsByExam = await Promise.all(
          remoteExams.map((exam) => fetchTeacherSubmissions(exam.id)),
        );
        const remoteSubmissions = submissionsByExam
          .flat()
          .map((item) => normalizeSubmission(item))
          .filter((item): item is Submission => Boolean(item));

        setSubmissions(remoteSubmissions);
        setJSON(STORAGE_KEYS.submissions, remoteSubmissions);
      } catch {
        syncFromStorage();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [syncFromStorage]);

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
    setJSON(STORAGE_KEYS.exams, next);
  }, []);

  const persistNotifications = useCallback((next: NotificationItem[]) => {
    setNotifications(next);
    setJSON(STORAGE_KEYS.notifications, next);
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
    setExams: persistExams,
    persistExams,
    submissions,
    setSubmissions,
    studentProgress,
    notifications,
    setNotifications: persistNotifications,
    persistNotifications,
    markNotificationRead,
  };
};
