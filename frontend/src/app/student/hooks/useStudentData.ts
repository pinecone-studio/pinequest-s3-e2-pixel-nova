import { useCallback, useEffect, useState } from "react";
import { getSessionUser, type User } from "@/lib/examGuard";
import { getStudentResults } from "@/lib/backend-auth";
import { useNotifications } from "@/hooks/useNotifications";
import type { Exam } from "../types";

const DASHBOARD_POLL_MS = 30000;

export const useStudentData = (overrideUser?: User | null) => {
  const overrideUserId = overrideUser?.id ?? null;
  const overrideUsername = overrideUser?.username ?? null;
  const overridePassword = overrideUser?.password ?? "";
  const overrideRole = overrideUser?.role ?? null;
  const overrideCreatedAt = overrideUser?.createdAt ?? "";

  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

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
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const notificationsState = useNotifications({
    role: "student",
    userId: overrideUserId,
    enableLive: false,
    onToast: showToast,
  });

  return {
    currentUser,
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
