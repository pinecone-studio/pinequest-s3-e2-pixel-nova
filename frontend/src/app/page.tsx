"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
  "Дэлгэцийн шалгалт",
  "AI-ийн хууль бус шалгалтын илрүүлэлт",
  "Бодит цагийн аналитик",
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
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[60%_40%] items-stretch relative">
        {/* Left side - 60% Image */}
        <div
          className="hidden lg:flex items-center justify-center px-6 py-10 animate-slide-in-left"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Product Screenshot */}
          <div className="relative animate-float w-full h-full max-w-2xl flex items-center">
            <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl -z-10 animate-pulse"></div>
            <img
              src="https://play-lh.googleusercontent.com/vR9XKzwSTlnJ37TCOCUgAYK0W920yw2u4n3xk86j5gFQwfBzSyM6bMVQyWkz0eB-9cI5=w3840-h2160-rw"
              alt="EduCore LMS Хяналт"
              width={800}
              height={700}
              className="rounded-3xl shadow-2xl border border-border/50 object-cover hover:shadow-3xl transition-shadow duration-500 h-[700px] w-[800px]"
            />
          </div>
        </div>

        {/* Right side - 40% Forms and Content */}
        <div className="flex flex-col justify-center items-center px-6 py-10 lg:py-0 lg:px-8 space-y-6 lg:space-y-8 bg-linear-to-b lg:bg-linear-to-l from-primary/5 to-transparent">
          {/* Header Section */}
          <div className="w-full max-w-sm space-y-4 animate-fade-in">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-sm hover:shadow-md transition-shadow duration-300 animate-slide-in"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7l9-4 9 4-9 4-9-4Z" />
                  <path d="M7 10v4c0 2.5 4 4 5 4s5-1.5 5-4v-4" />
                  <path d="M4 12v4" />
                </svg>
              </span>
              AI-ээр ажилладаг LMS
            </div>
            <div className="space-y-2">
              <h1
                className="flex items-center gap-3 text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-slide-in"
                style={{ animationDelay: "0.2s" }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 7l9-4 9 4-9 4-9-4Z" />
                    <path d="M7 10v4c0 2.5 4 4 5 4s5-1.5 5-4v-4" />
                    <path d="M4 12v4" />
                  </svg>
                </span>
                EduCore LMS
              </h1>
              <p
                className="text-sm lg:text-base text-muted-foreground animate-slide-in"
                style={{ animationDelay: "0.3s" }}
              >
                Сургалтын орчин бүрэлдэхүүний шийдэл, бодит цагийн хяналт, AI
                оноолгоо.
              </p>
            </div>
            <div
              className="grid gap-2 sm:grid-cols-3 animate-slide-in pt-2"
              style={{ animationDelay: "0.4s" }}
            >
              {mockHighlights.map((item, idx) => (
                <div
                  key={item}
                  className="group rounded-xl border border-border bg-card px-3 py-2 text-center text-xs font-medium shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 cursor-default"
                  style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                >
                  <div className="group-hover:scale-105 transition-transform duration-300">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Image - Shows only on mobile */}
          <div
            className="lg:hidden w-full max-w-sm animate-slide-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl -z-10 animate-pulse"></div>
              <img
                src="https://play-lh.googleusercontent.com/vR9XKzwSTlnJ37TCOCUgAYK0W920yw2u4n3xk86j5gFQwfBzSyM6bMVQyWkz0eB-9cI5=w3840-h2160-rw"
                alt="EduCore LMS Хяналт"
                width={640}
                height={256}
                className="w-full rounded-3xl shadow-2xl border border-border/50 object-cover h-64 hover:shadow-3xl transition-shadow duration-500"
              />
            </div>
          </div>

          {/* Login Tabs */}
          <div
            className="w-full max-w-sm space-y-4 animate-slide-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            {/* Tab Buttons */}
            <div className="flex gap-2 bg-muted rounded-2xl p-1">
              <button
                className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-semibold transition duration-300 ${
                  loginMode === "teacher"
                    ? "border-transparent bg-linear-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                    : "text-foreground hover:bg-card/50"
                }`}
                onClick={() => setLoginMode("teacher")}
              >
                👨‍🏫 Багш
              </button>
              <button
                className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-semibold transition duration-300 ${
                  loginMode === "student"
                    ? "border-transparent bg-linear-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                    : "text-foreground hover:bg-card/50"
                }`}
                onClick={() => setLoginMode("student")}
              >
                👨‍🎓 Оюутан
              </button>
            </div>

            {/* Login Form - Teacher */}
            {loginMode === "teacher" && (
              <div className="space-y-4 rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-6 lg:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.15)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all duration-300 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <span className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-primary">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 7l9-4 9 4-9 4-9-4Z" />
                        <path d="M7 10v4c0 2.5 4 4 5 4s5-1.5 5-4v-4" />
                        <path d="M4 12v4" />
                      </svg>
                    </span>
                    EduCore нэвтрэх
                  </h2>
                  <button
                    className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      const next = theme === "dark" ? "light" : "dark";
                      setTheme(next);
                      localStorage.setItem("theme", next);
                    }}
                  >
                    {theme === "dark" ? "☀️ Цагаан" : "🌙 Харанхуй"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground/80">
                      Нэвтрэх нэр
                    </label>
                    <input
                      className="w-full mt-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none transition duration-300 focus:ring-2 focus:ring-primary focus:bg-muted placeholder:text-muted-foreground"
                      placeholder="Нэвтрэх нэр оруулна уу"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground/80">
                      Нууц үг
                    </label>
                    <input
                      className="w-full mt-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none transition duration-300 focus:ring-2 focus:ring-primary focus:bg-muted placeholder:text-muted-foreground"
                      placeholder="Нууц үг оруулна уу"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>

                <button
                  className="w-full rounded-xl bg-linear-to-r from-primary to-primary/80 px-4 py-3 text-sm font-semibold text-primary-foreground transition duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                  onClick={handleLogin}
                >
                  Нэвтрэх →
                </button>

                <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  <p className="font-semibold mb-1">Туршилтын дансууд:</p>
                  <p>
                    <span className="font-semibold">Нэвтрэх нэр:</span> teacher
                  </p>
                  <p>
                    <span className="font-semibold">Нууц үг:</span> teacher123
                  </p>
                </div>
              </div>
            )}

            {/* Login Form - Student */}
            {loginMode === "student" && (
              <div className="space-y-4 rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-6 lg:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.15)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all duration-300 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Нэвтрэх</h2>
                  <button
                    className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      const next = theme === "dark" ? "light" : "dark";
                      setTheme(next);
                      localStorage.setItem("theme", next);
                    }}
                  >
                    {theme === "dark" ? "☀️ Цагаан" : "🌙 Харанхуй"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground/80">
                      Нэвтрэх нэр
                    </label>
                    <input
                      className="w-full mt-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none transition duration-300 focus:ring-2 focus:ring-primary focus:bg-muted placeholder:text-muted-foreground"
                      placeholder="Нэвтрэх нэр оруулна уу"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground/80">
                      Нууц үг
                    </label>
                    <input
                      className="w-full mt-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none transition duration-300 focus:ring-2 focus:ring-primary focus:bg-muted placeholder:text-muted-foreground"
                      placeholder="Нууц үг оруулна уу"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>

                <button
                  className="w-full rounded-xl bg-linear-to-r from-primary to-primary/80 px-4 py-3 text-sm font-semibold text-primary-foreground transition duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                  onClick={handleLogin}
                >
                  Нэвтрэх →
                </button>

                <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  <p className="font-semibold mb-1">Туршилтын дансууд:</p>
                  <p>
                    <span className="font-semibold">Нэвтрэх нэр:</span> student
                  </p>
                  <p>
                    <span className="font-semibold">Нууц үг:</span> student123
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-6 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg animate-slide-in-down">
          {toast}
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in-down {
          animation: slide-in-down 0.4s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
