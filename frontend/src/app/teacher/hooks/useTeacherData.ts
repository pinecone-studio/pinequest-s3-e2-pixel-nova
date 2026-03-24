import { useEffect, useState } from "react";
import {
  User,
  getSessionUser,
  getJSON,
  setJSON,
} from "@/lib/examGuard";
import type { Exam, NotificationItem, Submission } from "../types";

export const useTeacherData = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(
      user ?? {
        id: "demo",
        username: "DemoБагш",
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
    setExams(getJSON<Exam[]>("exams", []));
    setSubmissions(getJSON<Submission[]>("submissions", []));
    setNotifications(getJSON<NotificationItem[]>("notifications", []));
  }, []);

  useEffect(() => {
    const sync = () => {
      setSubmissions(getJSON<Submission[]>("submissions", []));
      setNotifications(getJSON<NotificationItem[]>("notifications", []));
    };
    const interval = setInterval(sync, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const persistExams = (next: Exam[]) => {
    setExams(next);
    setJSON("exams", next);
  };

  const persistNotifications = (next: NotificationItem[]) => {
    setNotifications(next);
    setJSON("notifications", next);
  };

  const markNotificationRead = (index: number) => {
    const next = notifications.map((item, idx) =>
      idx === index ? { ...item, read: true } : item,
    );
    persistNotifications(next);
  };

  return {
    currentUser,
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
    notifications,
    setNotifications,
    persistNotifications,
    markNotificationRead,
  };
};
