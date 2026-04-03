import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionUser, type User } from "@/lib/examGuard";
import { getStudentUpcomingExams } from "@/lib/backend-auth";
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

  const resolvedUser = useMemo(
    () =>
      overrideUserId && overrideUsername && overrideRole
        ? {
            id: overrideUserId,
            username: overrideUsername,
            password: overridePassword,
            role: overrideRole,
            createdAt: overrideCreatedAt,
          }
        : null,
    [
      overrideCreatedAt,
      overridePassword,
      overrideRole,
      overrideUserId,
      overrideUsername,
    ],
  );

  const mapUpcomingExams = useCallback(
    (items: Awaited<ReturnType<typeof getStudentUpcomingExams>>): Exam[] =>
      items.map((item) => ({
        id: item.examId,
        title: item.title,
        subjectName: item.subjectName ?? null,
        teacherName: item.teacherName ?? null,
        description: item.description ?? null,
        examType: item.examType ?? null,
        className: item.className ?? null,
        groupName: item.groupName ?? null,
        status: item.status ?? null,
        scheduledAt: item.scheduledAt ?? null,
        examStartedAt: item.startedAt ?? null,
        finishedAt: item.finishedAt ?? null,
        roomCode: item.roomCode ?? "",
        questions: [],
        duration: item.durationMin ?? undefined,
        createdAt:
          item.scheduledAt ??
          item.startedAt ??
          item.finishedAt ??
          new Date().toISOString(),
      })),
    [],
  );

  useEffect(() => {
    const user = resolvedUser ?? getSessionUser();

    setCurrentUser(user ?? null);

    let cancelled = false;

    const loadRemote = async () => {
      if (!user) {
        setExams([]);
        setLoading(false);
        return;
      }

      try {
        const upcomingExams = await getStudentUpcomingExams(user);
        if (cancelled) return;
        setExams(mapUpcomingExams(upcomingExams));
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
    mapUpcomingExams,
    overrideCreatedAt,
    overridePassword,
    overrideRole,
    overrideUserId,
    overrideUsername,
    resolvedUser,
  ]);

  useEffect(() => {
    const sync = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      const user = resolvedUser ?? getSessionUser();
      if (!user) {
        setExams([]);
        return;
      }

      try {
        const upcomingExams = await getStudentUpcomingExams(user);
        setExams(mapUpcomingExams(upcomingExams));
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
  }, [mapUpcomingExams, resolvedUser]);

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
