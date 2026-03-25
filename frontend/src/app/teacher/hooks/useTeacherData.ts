import { useCallback, useEffect, useState } from "react";
import { User, getSessionUser } from "@/lib/examGuard";
import type { StudentProgress } from "@/lib/examGuard";
import { normalizeSubmission } from "../analytics";
import type { Exam, NotificationItem, Submission } from "../types";
import {
  fetchTeacherExams,
  fetchTeacherSubmissions,
  fetchXpLeaderboard,
} from "./teacher-api";

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
    setUsers([]);
    setExams([]);
    setSubmissions([]);
    setStudentProgress({});
    setNotifications([]);
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
    if (!useRemote) return;
    const loadRemote = async () => {
      try {
        setLoading(true);
        const remoteExams = await fetchTeacherExams();
        setExams(remoteExams);
        const submissionsByExam = await Promise.all(
          remoteExams.map((exam) => fetchTeacherSubmissions(exam.id)),
        );
        const allSubmissions = submissionsByExam
          .flat()
          .map((item) => normalizeSubmission(item as Submission))
          .filter((item): item is Submission => Boolean(item));
        setSubmissions(allSubmissions);
        const leaderboard = await fetchXpLeaderboard();
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
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    void loadRemote();
  }, [overrideUser, syncFromStorage, useRemote]);

  useEffect(() => {
    if (!useRemote) return;
    const interval = setInterval(async () => {
      const remoteExams = await fetchTeacherExams();
      setExams(remoteExams);
      const submissionsByExam = await Promise.all(
        remoteExams.map((exam) => fetchTeacherSubmissions(exam.id)),
      );
      setSubmissions(submissionsByExam.flat());
    }, 30000);
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
  }, []);

  const persistNotifications = useCallback((next: NotificationItem[]) => {
    setNotifications(next);
  }, []);

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
