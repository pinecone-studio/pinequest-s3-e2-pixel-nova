import { useEffect, useState } from "react";
import { User, getSessionUser } from "@/lib/examGuard";
import type { Exam, NotificationItem } from "../types";
import { getStudentResults } from "@/lib/backend-auth";

export const useStudentData = (overrideUser?: User | null) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const user = overrideUser ?? getSessionUser();
    setCurrentUser(
      user ?? {
        id: "demo",
        username: "DemoСурагч",
        password: "",
        role: "student",
        createdAt: "",
      },
    );
    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);
    const load = async () => {
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
        setNotifications([]);
      } catch {
        setExams([]);
        setNotifications([]);
      }
    };
    void load();
  }, [overrideUser]);

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
        setNotifications([]);
      } catch {
        setExams([]);
        setNotifications([]);
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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

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
