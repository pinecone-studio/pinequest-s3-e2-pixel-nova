import { useEffect, useState } from "react";
import { User, getSessionUser, getJSON, getJSONForRole } from "@/lib/examGuard";
import { getTeacherRoles } from "@/lib/role-session";
import { getStudentExams, getStudentResults, getXpProfile } from "@/api";
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
        username: "DemoStudent",
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
    const fallbackExams = Array.from(deduped.values());
    setExams(fallbackExams);

    const ownNotifications = getJSON<NotificationItem[]>("notifications", []);
    const teacherNotifications = teacherRoles.flatMap((role) =>
      getJSONForRole<NotificationItem[]>("notifications", [], role),
    );
    const mergedNotifications = [
      ...ownNotifications,
      ...teacherNotifications,
    ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    setNotifications(mergedNotifications);

    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadRemote = async () => {
      setLoading(true);
      try {
        const [studentExams, studentResults, xpProfile] = await Promise.all([
          getStudentExams(user),
          getStudentResults(user),
          getXpProfile(user),
        ]);

        if (cancelled) return;

        const remoteExams: Exam[] = studentExams.map((exam) => ({
          id: exam.examId,
          title: exam.title,
          scheduledAt: null,
          examStartedAt: null,
          roomCode: "",
          questions: [],
          duration: 45,
          createdAt:
            exam.submittedAt ?? exam.startedAt ?? new Date(0).toISOString(),
        }));

        setExams(remoteExams);

        localStorage.setItem(
          "studentProgress",
          JSON.stringify({
            [user.id]: {
              xp: xpProfile.xp,
              level: xpProfile.level,
              history: studentResults.map((item) => ({
                examId: item.examId,
                percentage: item.score ?? 0,
                xp: 0,
                date: item.submittedAt ?? new Date(0).toISOString(),
                score: item.score ?? 0,
                totalPoints: item.totalPoints ?? 0,
              })),
            },
          }),
        );
      } catch {
        if (!cancelled) setExams(fallbackExams);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRemote();

    return () => {
      cancelled = true;
    };
  }, [overrideUser]);

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
