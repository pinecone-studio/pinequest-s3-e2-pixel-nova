import { useCallback, useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  User,
  getSessionUser,
  getJSON,
  setJSON,
} from "@/lib/examGuard";
import type { StudentProgress } from "@/lib/examGuard";
import { normalizeSubmission } from "../analytics";
import type { Exam, NotificationItem, Submission } from "../types";

export const useTeacherData = (
  overrideUser?: User | null,
  useRemote: boolean = false,
) => {
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
        username: "DemoБагш",
        password: "",
        role: "teacher",
        createdAt: "",
      },
    );
    syncFromStorage();
    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);
    if (!useRemote) {
      setExams(getJSON<Exam[]>("exams", []));
      setSubmissions(getJSON<Submission[]>("submissions", []));
      setNotifications(getJSON<NotificationItem[]>("notifications", []));
    }
  }, [overrideUser?.id, useRemote]);

  useEffect(() => {
    if (useRemote) return;
    const sync = () => {
      setSubmissions(getJSON<Submission[]>("submissions", []));
      setNotifications(getJSON<NotificationItem[]>("notifications", []));
    };
    const interval = setInterval(sync, 15000);
    return () => clearInterval(interval);
  }, [useRemote]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

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
    if (!useRemote) setJSON("exams", next);
  };

  const persistNotifications = useCallback((next: NotificationItem[]) => {
    setNotifications(next);
    if (!useRemote) setJSON("notifications", next);
  };

  const markNotificationRead = useCallback((index: number) => {
    const next = notifications.map((item, idx) =>
      idx === index ? { ...item, read: true } : item,
    );
    persistNotifications(next);
  }, [notifications, persistNotifications]);

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
