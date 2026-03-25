import { useEffect, useState } from "react";
import { User, getSessionUser, getJSON } from "@/lib/examGuard";
import type { Exam, NotificationItem } from "../types";

export const useStudentData = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const user = getSessionUser();
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
    setExams(getJSON<Exam[]>("exams", []));
    setNotifications(getJSON<NotificationItem[]>("notifications", []));
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
