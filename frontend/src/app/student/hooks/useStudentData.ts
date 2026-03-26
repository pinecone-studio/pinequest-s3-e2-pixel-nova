import { useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  getJSON,
  getSessionUser,
  type User,
} from "@/lib/examGuard";
import { getStudentResults } from "@/lib/backend-auth";
import type { Exam, NotificationItem } from "../types";

const DEMO_STUDENT: User = {
  id: "demo",
  username: "DemoStudent",
  password: "",
  role: "student",
  createdAt: "",
};

const buildNotifications = (
  results: Awaited<ReturnType<typeof getStudentResults>>,
): NotificationItem[] =>
  results.slice(0, 4).map((item, index) => ({
    examId: item.examId,
    message:
      index === 0
        ? `${item.title} шалгалтын дүн шинэчлэгдлээ.`
        : `${item.title} шалгалтын тайланг дахин хараарай.`,
    read: index > 1,
    createdAt: item.submittedAt ?? new Date().toISOString(),
  }));

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

    setCurrentUser(user ?? DEMO_STUDENT);

    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);

    let cancelled = false;

    const loadRemote = async () => {
      try {
        const results = await getStudentResults();
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
        setNotifications(buildNotifications(results));
      } catch {
        if (cancelled) return;
        setExams(getJSON<Exam[]>(STORAGE_KEYS.exams, []));
        setNotifications(
          getJSON<NotificationItem[]>(STORAGE_KEYS.notifications, []),
        );
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
      try {
        const results = await getStudentResults();
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
        setNotifications(buildNotifications(results));
      } catch {
        setExams(getJSON<Exam[]>(STORAGE_KEYS.exams, []));
        setNotifications(
          getJSON<NotificationItem[]>(STORAGE_KEYS.notifications, []),
        );
      }
    };

    void sync();
    const interval = setInterval(sync, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return {
    currentUser,
    theme,
    setTheme,
    loading,
    exams,
    setExams,
    notifications,
    setNotifications,
  };
};
