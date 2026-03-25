import { useEffect, useState } from "react";
import { User, getSessionUser, getJSON, getJSONForRole } from "@/lib/examGuard";
import { getTeacherRoles, getStoredRole } from "@/lib/role-session";
import type { Exam, NotificationItem } from "../types";

export const useStudentData = (overrideUser?: User | null) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const user = overrideUser ?? getSessionUser();
    const teacherRoles = getTeacherRoles();
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
    const mergedExams = teacherRoles.flatMap((role) =>
      getJSONForRole<Exam[]>("exams", [], role),
    );
    const deduped = new Map<string, Exam>();
    mergedExams.forEach((exam) => {
      deduped.set(exam.id, exam);
    });
    setExams(Array.from(deduped.values()));
    const ownNotifications = getJSON<NotificationItem[]>("notifications", []);
    const teacherNotifications = teacherRoles.flatMap((role) =>
      getJSONForRole<NotificationItem[]>("notifications", [], role),
    );
    const merged = [...ownNotifications, ...teacherNotifications].sort(
      (left, right) => right.createdAt.localeCompare(left.createdAt),
    );
    setNotifications(merged);
  }, [overrideUser]);

  useEffect(() => {
    const sync = () => {
      const teacherRoles = getTeacherRoles();
      const mergedExams = teacherRoles.flatMap((role) =>
        getJSONForRole<Exam[]>("exams", [], role),
      );
      const deduped = new Map<string, Exam>();
      mergedExams.forEach((exam) => {
        deduped.set(exam.id, exam);
      });
      setExams(Array.from(deduped.values()));
      const ownNotifications = getJSON<NotificationItem[]>("notifications", []);
      const teacherNotifications = teacherRoles.flatMap((role) =>
        getJSONForRole<NotificationItem[]>("notifications", [], role),
      );
      const merged = [...ownNotifications, ...teacherNotifications].sort(
        (left, right) => right.createdAt.localeCompare(left.createdAt),
      );
      setNotifications(merged);
    };
    sync();
    const interval = setInterval(sync, 10000);
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
