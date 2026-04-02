import { useCallback, useEffect, useState } from "react";
import { getSessionUser, type StudentProgress, type User } from "@/lib/examGuard";
import { useNotifications } from "@/hooks/useNotifications";
import type { Exam } from "../types";
import {
  fetchTeacherExams,
  fetchXpLeaderboard,
} from "./teacher-api";

const DASHBOARD_POLL_MS = 30_000;

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
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});

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

    if (!overrideUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadRemote = async () => {
      try {
        const remoteExams = await fetchTeacherExams(overrideUserId);
        if (cancelled) return;

        setExams(remoteExams);

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
      } catch {
        if (!cancelled) {
          setExams([]);
          setUsers([]);
          setStudentProgress({});
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
    const sync = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      try {
        const remoteExams = await fetchTeacherExams(teacherId);
        setExams(remoteExams);
      } catch {
        return;
      }
    };

    const interval = setInterval(() => {
      void sync();
    }, DASHBOARD_POLL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sync();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
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
  const notificationsState = useNotifications({
    role: "teacher",
    userId: overrideUserId,
    onToast: showToast,
  });

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
    submissions: [],
    setSubmissions: () => {},
    studentProgress,
    notifications: notificationsState.notifications,
    unreadNotificationCount: notificationsState.unreadCount,
    markNotificationRead: notificationsState.markNotificationRead,
    markAllNotificationsRead: notificationsState.markAllNotificationsRead,
    refreshNotifications: notificationsState.refreshNotifications,
  };
};
