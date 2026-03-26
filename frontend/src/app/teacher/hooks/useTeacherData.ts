import { useCallback, useEffect, useState } from "react";
import { getSessionUser, type StudentProgress, type User } from "@/lib/examGuard";
import type { NotificationItem, Exam, Submission } from "../types";
import { normalizeSubmission } from "../analytics";
import {
  fetchTeacherExams,
  fetchTeacherSubmissions,
  fetchXpLeaderboard,
} from "./teacher-api";

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

    setCurrentUser(user ?? null);

    if (!overrideUserId) return;

    let cancelled = false;

    const loadRemote = async () => {
      try {
        const remoteExams = await fetchTeacherExams(overrideUserId);
        if (cancelled) return;

        setExams(remoteExams);

        const submissionsByExam = await Promise.all(
          remoteExams.map((exam) => fetchTeacherSubmissions(exam.id, overrideUserId)),
        );
        if (cancelled) return;

        const remoteSubmissions = submissionsByExam
          .flat()
          .map((item) => normalizeSubmission(item))
          .filter((item): item is Submission => Boolean(item));

        setSubmissions(remoteSubmissions);

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
        setStudentProgress(progress);
        setNotifications([]);
      } catch {
        if (!cancelled) {
          setExams([]);
          setSubmissions([]);
          setUsers([]);
          setStudentProgress({});
          setNotifications([]);
        }
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
  ]);

  useEffect(() => {
    if (!overrideUserId) return;
    const teacherId = overrideUserId;
    const interval = setInterval(async () => {
      try {
        const remoteExams = await fetchTeacherExams(teacherId);
        setExams(remoteExams);

        const submissionsByExam = await Promise.all(
          remoteExams.map((exam) => fetchTeacherSubmissions(exam.id, teacherId)),
        );
        const remoteSubmissions = submissionsByExam
          .flat()
          .map((item) => normalizeSubmission(item))
          .filter((item): item is Submission => Boolean(item));

        setSubmissions(remoteSubmissions);
      } catch {
        return;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [overrideUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const persistExams = useCallback((next: Exam[]) => {
    setExams(next);
  }, []);

  const persistNotifications = useCallback((next: NotificationItem[]) => {
    setNotifications(next);
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
