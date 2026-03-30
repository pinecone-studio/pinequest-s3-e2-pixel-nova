import { useCallback, useEffect, useState } from "react";
import { getSessionUser, type User } from "@/lib/examGuard";
import { getStudentResults } from "@/lib/backend-auth";
import type { Exam } from "../types";
import { useNotifications } from "@/hooks/useNotifications";

export const useStudentData = (overrideUser?: User | null) => {
  const overrideUserId = overrideUser?.id ?? null;
  const overrideUsername = overrideUser?.username ?? null;
  const overridePassword = overrideUser?.password ?? "";
  const overrideRole = overrideUser?.role ?? null;
  const overrideCreatedAt = overrideUser?.createdAt ?? "";

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [toast, setToast] = useState<string | null>(null);

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

    let cancelled = false;

    const loadRemote = async () => {
      if (!user) {
        setExams([]);
        setLoading(false);
        return;
      }

      try {
        const results = await getStudentResults(user);
        if (cancelled) return;

        const mappedExams: Exam[] = results.map((item) => ({
          id: item.examId,
          title: item.title,
          scheduledAt: null,
          roomCode: "",
          questions: [],
          duration: undefined,
          createdAt: item.submittedAt ?? new Date().toISOString(),
        }));

        setExams(mappedExams);
      } catch {
        if (cancelled) return;
        setExams([]);
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
    const sync = async () => {
      const user = getSessionUser();
      if (!user) {
        setExams([]);
        return;
      }

      try {
        const results = await getStudentResults(user);
        const mappedExams: Exam[] = results.map((item) => ({
          id: item.examId,
          title: item.title,
          scheduledAt: null,
          roomCode: "",
          questions: [],
          duration: undefined,
          createdAt: item.submittedAt ?? new Date().toISOString(),
        }));
        setExams(mappedExams);
      } catch {
        setExams([]);
      }
    };

    void sync();
    const interval = setInterval(sync, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const notificationsState = useNotifications({
    role: "student",
    userId: overrideUserId,
    onToast: showToast,
  });

  return {
    currentUser,
    theme,
    setTheme,
    loading,
    toast,
    exams,
    setExams,
    notifications: notificationsState.notifications,
    unreadNotificationCount: notificationsState.unreadCount,
    markNotificationRead: notificationsState.markNotificationRead,
    markAllNotificationsRead: notificationsState.markAllNotificationsRead,
  };
};
