"use client";

import { useEffect, useState } from "react";

import {
  Role,
  STORAGE_KEYS,
  User,
  ensureDemoAccounts,
  getJSON,
  setSessionUser,
} from "@/lib/examGuard";
import { useRouter } from "next/navigation";

const mockHighlights = [
  "Fullscreen Exam Room",
  "AI Cheat Detection",
  "Realtime Analytics",
];

export default function Home() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<Role>("teacher");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    ensureDemoAccounts();
    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = () => {
    if (!loginUsername || !loginPassword) {
      showToast("Бүх талбарыг бөглөнө үү.");
      return;
    }
    const stored = getJSON<User[]>(STORAGE_KEYS.users, []);
    const user = stored.find(
      (u) =>
        u.username === loginUsername &&
        u.password === loginPassword &&
        u.role === loginMode,
    );
    if (!user) {
      showToast("Нэвтрэх нэр эсвэл нууц үг буруу байна.");
      return;
    }
    setSessionUser(user);
    router.push(loginMode === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
            AI-Powered LMS
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">
              ExamGuard LMS
            </h1>
            <p className="text-base text-muted-foreground">
              Modern, premium online exam platform with real-time monitoring, AI
              grading, and analytics.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {mockHighlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-xs font-medium shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Sign in</div>
              <button
                className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                onClick={() => {
                  const next = theme === "dark" ? "light" : "dark";
                  setTheme(next);
                  localStorage.setItem("theme", next);
                }}
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  loginMode === "teacher"
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-muted text-foreground"
                }`}
                onClick={() => setLoginMode("teacher")}
              >
                Teacher
              </button>
              <button
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  loginMode === "student"
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-muted text-foreground"
                }`}
                onClick={() => setLoginMode("student")}
              >
                Student
              </button>
            </div>

            <div className="space-y-3">
              <input
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                placeholder="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:translate-y-[-1px]"
              onClick={handleLogin}
            >
              Sign in
            </button>
            <div className="text-xs text-muted-foreground">
              Demo: teacher/teacher123 · student/student123
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed right-6 top-6 rounded-xl border border-border bg-card px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
