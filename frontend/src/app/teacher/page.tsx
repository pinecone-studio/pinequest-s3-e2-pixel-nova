"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/examGuard";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherHeader from "./components/TeacherHeader";
import ExamTab from "./components/ExamTab";
import ResultsTab from "./components/ResultsTab";
import SettingsTab from "./components/SettingsTab";
import { mockStudents } from "./types";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamImport } from "./hooks/useExamImport";
import { useExamStats } from "./hooks/useExamStats";

export default function TeacherPage() {
  const router = useRouter();
  const cardClass =
    "rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  const mutedCardClass =
    "rounded-2xl border border-border bg-muted p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  const inputClass =
    "w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const selectClass =
    "w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const buttonPrimary =
    "rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110";
  const buttonGhost =
    "rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-muted";
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"text" | "open" | "mcq">(
    "text",
  );
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUseOcr, setPdfUseOcr] = useState(true);
  const [answerKeyPage, setAnswerKeyPage] = useState<number | "last">("last");
  const [importError, setImportError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const sidebarTimerRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<"Exam" | "Results" | "Settings">(
    "Exam",
  );
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [isPreviewEditing, setIsPreviewEditing] = useState(false);

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

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const persistExams = (next: Exam[]) => {
    setExams(next);
    setJSON("exams", next);
  };

  const persistМэдэгдэл = (next: NotificationItem[]) => {
    setNotifications(next);
    setJSON("notifications", next);
  };

  useEffect(() => {
    const checkМэдэгдэл = () => {
      const stored = getJSON<Exam[]>("exams", []);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      let changed = false;
      stored.forEach((exam) => {
        if (!exam.scheduledAt || exam.notified) return;
        const scheduled = new Date(exam.scheduledAt);
        const isTomorrow =
          scheduled.getFullYear() === tomorrow.getFullYear() &&
          scheduled.getMonth() === tomorrow.getMonth() &&
          scheduled.getDate() === tomorrow.getDate();
        if (isTomorrow) {
          exam.notified = true;
          changed = true;
          showToast(`📢 Маргааш "${exam.title}" шалгалт эхэлнэ!`);
        }
      });
      if (changed) persistExams(stored);
    };
    checkМэдэгдэл();
    const interval = setInterval(checkМэдэгдэл, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSchedule = () => {
    if (!scheduleTitle || !scheduleDate) {
      showToast("Шалгалтын нэр болон огноо оруулна уу.");
      return;
    }
    const newExam: Exam = {
      id: generateId(),
      title: scheduleTitle,
      scheduledAt: scheduleDate,
      roomCode: generateRoomCode(),
      questions: [],
      duration: durationMinutes,
      createdAt: new Date().toISOString(),
    };
    persistExams([...exams, newExam]);
    setScheduleTitle("");
    setScheduleDate("");
    setRoomCode(newExam.roomCode);
    showToast("Шалгалт товлогдлоо.");
  };

  const addQuestion = () => {
    if (!questionText || !questionAnswer) {
      showToast("Асуулт болон зөв хариулт оруулна уу.");
      return;
    }
    const options =
      questionType === "mcq"
        ? mcqOptions.map((opt) => opt.trim()).filter(Boolean)
        : undefined;
    if (questionType === "mcq" && (!options || options.length < 4)) {
      showToast("A, B, C, D сонголтыг бүрэн бөглөнө үү.");
      return;
    }
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        text: questionText,
        type: questionType,
        options,
        correctAnswer: questionAnswer,
      },
    ]);
    setQuestionText("");
    setQuestionAnswer("");
    if (questionType === "mcq") setMcqOptions(["", "", "", ""]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuestionField = (
    index: number,
    field: "text" | "correctAnswer",
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    );
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;
        const nextOptions = [...(question.options ?? [])];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      }),
    );
  };

  const saveExam = () => {
    if (!examTitle || questions.length === 0) {
      showToast("Шалгалтын нэр болон асуултууд оруулна уу.");
      return;
    }
    const newExam: Exam = {
      id: generateId(),
      title: examTitle,
      scheduledAt: null,
      roomCode: generateRoomCode(),
      questions,
      duration: durationMinutes,
      createdAt: new Date().toISOString(),
    };
    persistExams([...exams, newExam]);
    setExamTitle("");
    setQuestions([]);
    setDurationMinutes(45);
    setRoomCode(newExam.roomCode);
    showToast("Шалгалт амжилттай хадгалагдлаа.");
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Room code хууллаа.");
    } catch {
      showToast("Room code хуулж чадсангүй.");
    }
  };

  const parseAnswerKey = (text: string) => {
    const map = new Map<number, string>();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    lines.forEach((line) => {
      const match = line.match(/(\d+)\s*[:.)-]?\s*([A-E])/i);
      if (match) {
        map.set(Number(match[1]), match[2].toUpperCase());
      }
    });
    return map;
  };

  const parseOptionsInline = (block: string) => {
    const normalized = block.replace(/\s+/g, " ").trim();
    const regex = /([A-E])[.)]\s*([^A-E]+?)(?=\s+[A-E][.)]\s*|$)/gi;
    const options: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(normalized)) !== null) {
      options.push(match[2].trim());
    }
    return options;
  };

  const normalizeImportedText = (text: string) =>
    text
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const normalizeMathText = (text: string) =>
    text
      .replace(/(\d)\s*\.\s*(\d)/g, "$1.$2")
      .replace(/([A-Za-z0-9)])\s+2\b/g, "$1²")
      .replace(/([A-Za-z0-9)])\s+3\b/g, "$1³")
      .replace(/√\s+([A-Za-z0-9]+)/g, "√$1")
      .replace(/([+\-=;:(]\s*)(\d{1,2})\s+(\d{1,2})(?=\s|$)/g, "$1$2/$3")
      .replace(/^(\d{1,2})\s+(\d{1,2})(?=\s|$)/g, "$1/$2")
      .replace(/\s+([,.;:)])/g, "$1")
      .replace(/([(])\s+/g, "$1")
      .replace(/\{\s+/g, "{ ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const parseQuestionsFromText = (
    rawText: string,
    answerKey: Map<number, string>,
  ) => {
    const cleaned = normalizeImportedText(rawText);
    const parsed: Question[] = [];
    const questionRegex = /(\d+)\.\s*(.*?)(?=\s+\d+\.\s+|$)/g;
    let match: RegExpExecArray | null;

    while ((match = questionRegex.exec(cleaned)) !== null) {
      const number = Number(match[1]);
      const block = match[2]?.trim() ?? "";
      if (!block) continue;

      const firstOptionIndex = block.search(/\bA[.)]\s*/i);
      if (firstOptionIndex <= 0) continue;

      const textLine = normalizeMathText(
        block.slice(0, firstOptionIndex).trim(),
      );
      const finalOptions = parseOptionsInline(block)
        .map((option) => normalizeMathText(option))
        .slice(0, 5);
      if (!textLine || finalOptions.length < 4) continue;

      const correctLetter = answerKey.get(number) ?? "A";
      const correctIndex = ["A", "B", "C", "D", "E"].indexOf(correctLetter);
      const correctAnswer = normalizeMathText(
        finalOptions[correctIndex] ?? finalOptions[0] ?? correctLetter,
      );
      parsed.push({
        id: generateId(),
        text: textLine,
        type: "mcq",
        options: finalOptions,
        correctAnswer,
      });
    }

    return parsed;
  };

  const finalizeImportedQuestions = (
    parsedQuestions: Question[],
    fileName: string,
    extensionPattern: RegExp,
    sourceLabel: string,
    setError: (message: string | null) => void,
  ) => {
    if (parsedQuestions.length === 0) {
      setError(`${sourceLabel}-ээс асуулт олдсонгүй. Форматаа шалгана уу.`);
      return;
    }
    setError(null);
    setQuestions(parsedQuestions);
    if (!examTitle) setExamTitle(fileName.replace(extensionPattern, ""));
    showToast(`${parsedQuestions.length} асуулт ${sourceLabel}-ээс бөглөгдлөө.`);
  };

  const parseCsv = (text: string) => {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];
    const pushCell = () => {
      row.push(current.trim());
      current = "";
    };
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === "\"" && next === "\"") {
        current += "\"";
        i += 1;
        continue;
      }
      if (char === "\"") {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        pushCell();
        continue;
      }
      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        pushCell();
        if (row.length > 1) rows.push(row);
        row = [];
        continue;
      }
      current += char;
    }
    if (current.length > 0 || row.length > 0) {
      pushCell();
      if (row.length > 1) rows.push(row);
    }
    return rows;
  };

  const handleCsvUpload = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setImportError("CSV файл хоосон байна.");
        return;
      }
      const header = rows[0].map((h) => h.toLowerCase());
      const questionIndex = header.findIndex((h) => h.includes("question"));
      const aIndex = header.findIndex((h) => h === "a");
      const bIndex = header.findIndex((h) => h === "b");
      const cIndex = header.findIndex((h) => h === "c");
      const dIndex = header.findIndex((h) => h === "d");
      const eIndex = header.findIndex((h) => h === "e");
      const answerIndex = header.findIndex((h) => h.includes("answer"));
      const dataRows = rows.slice(1);
      const parsed = dataRows
        .map((cols) => {
          const qText = cols[questionIndex] ?? "";
          const options = [
            cols[aIndex] ?? "",
            cols[bIndex] ?? "",
            cols[cIndex] ?? "",
            cols[dIndex] ?? "",
            cols[eIndex] ?? "",
          ].map((item) => item.trim());
          const correct = cols[answerIndex] ?? "A";
          const filteredOptions = options.filter(Boolean);
          if (!qText || filteredOptions.length < 4) return null;
          const correctIndex = ["A", "B", "C", "D", "E"].indexOf(
            correct.trim().toUpperCase(),
          );
          return {
            id: generateId(),
            text: qText,
            type: "mcq" as const,
            options: filteredOptions,
            correctAnswer:
              filteredOptions[correctIndex] ?? filteredOptions[0],
          };
        })
        .filter(Boolean) as Question[];
      if (parsed.length === 0) {
        setImportError("CSV формат тохирохгүй байна.");
        return;
      }
      setQuestions(parsed);
      if (!examTitle) setExamTitle(file.name.replace(/\.csv$/i, ""));
      showToast(`${parsed.length} асуулт CSV‑ээс бөглөгдлөө.`);
    } catch {
      setImportError("CSV боловсруулах үед алдаа гарлаа.");
    }
  };

  const handleDocxUpload = async (file: File) => {
    setImportError(null);
    try {
      type Mammoth = {
        extractRawText: (args: { arrayBuffer: ArrayBuffer }) => Promise<{
          value: string;
        }>;
      };
      const mammoth = (await import("mammoth")).default as Mammoth;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value || "";
      const answerKey = parseAnswerKey(rawText);
      const parsedQuestions = parseQuestionsFromText(rawText, answerKey);
      finalizeImportedQuestions(
        parsedQuestions,
        file.name,
        /\.docx$/i,
        "DOCX",
        setImportError,
      );
    } catch {
      setImportError("DOCX import failed.");
    }
  };
  const handleTxtUpload = async (file: File) => {
    setImportError(null);
    setPdfError(null);
    try {
      const text = await file.text();
      const answerKey = parseAnswerKey(text);
      const parsedQuestions = parseQuestionsFromText(text, answerKey);
      finalizeImportedQuestions(
        parsedQuestions,
        file.name,
        /\.(txt|text)$/i,
        "TXT",
        setImportError,
      );
    } catch {
      setImportError("TXT import failed.");
    }
  };
  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    setImportError(null);
    setPdfError(null);
    try {
      type PdfPage = {
        getTextContent: () => Promise<{ items: { str?: string }[] }>;
        render: (args: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
        getViewport: (args: { scale: number }) => { width: number; height: number };
      };
      type PdfDoc = {
        numPages: number;
        getPage: (pageNum: number) => Promise<PdfPage>;
      };
      type PdfJs = {
        GlobalWorkerOptions: { workerSrc: string };
        getDocument: (args: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> };
      };
      const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdfjsLib =
        ("default" in pdfjsModule ? pdfjsModule.default : pdfjsModule) as PdfJs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let combinedText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (typeof item.str === "string" ? item.str : ""))
          .join(" ");
        combinedText += `${pageText}\n`;
      }
      let answerKey = new Map<number, string>();
      if (pdfUseOcr) {
        type Tesseract = {
          recognize: (
            image: HTMLCanvasElement,
            lang: string
          ) => Promise<{ data: { text: string } }>;
        };
        const tesseract = (await import("tesseract.js")) as Tesseract;
        const pageToRead =
          answerKeyPage === "last"
            ? pdf.numPages
            : Math.min(Math.max(answerKeyPage, 1), pdf.numPages);
        const keyPage = await pdf.getPage(pageToRead);
        const viewport = keyPage.getViewport({ scale: 1.8 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await keyPage.render({ canvasContext: context, viewport }).promise;
          const result = await tesseract.recognize(canvas, "eng");
          answerKey = parseAnswerKey(result.data.text);
        }
      }
      const parsedQuestions = parseQuestionsFromText(combinedText, answerKey);
      finalizeImportedQuestions(
        parsedQuestions,
        file.name,
        /\.pdf$/i,
        "PDF",
        setPdfError,
      );
    } catch {
      setPdfError("PDF import failed.");
    } finally {
      setPdfLoading(false);
    }
  };
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

  const markNotificationRead = (index: number) => {
    const next = notifications.map((item, idx) =>
      idx === index ? { ...item, read: true } : item,
    );
    persistМэдэгдэл(next);
  };

  const stats = useMemo(() => {
    const scheduledCount = exams.filter((exam) => exam.scheduledAt).length;
    const totalQuestions = exams.reduce(
      (sum, exam) => sum + exam.questions.length,
      0,
    );
    return [
      {
        label: "Нийт шалгалт",
        value: exams.length.toString(),
        trend: `${scheduledCount} нь товлогдсон`,
      },
      {
        label: "Нийт асуулт",
        value: totalQuestions.toString(),
        trend: "Шинэчилж байна",
      },
      {
        label: "Идэвхтэй өрөө",
        value: exams.length ? "1" : "0",
        trend: "Room code бэлэн",
      },
    ];
  }, [exams]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return submissions.find((item) => item.id === selectedSubmissionId) ?? null;
  }, [selectedSubmissionId, submissions]);

  const selectedExam = useMemo(() => {
    if (!selectedSubmission) return null;
    return exams.find((exam) => exam.id === selectedSubmission.examId) ?? null;
  }, [selectedSubmission, exams]);

  const examOptions = useMemo(() => {
    const finishedIds = new Set(submissions.map((s) => s.examId));
    return exams.filter((exam) => finishedIds.has(exam.id));
  }, [exams, submissions]);

  const activeExamId = selectedExamId ?? examOptions[0]?.id ?? null;
  const activeExam = useMemo(
    () => exams.find((exam) => exam.id === activeExamId) ?? null,
    [exams, activeExamId]
  );
  const activeSubmissions = useMemo(
    () => submissions.filter((s) => s.examId === activeExamId),
    [submissions, activeExamId]
  );

  const data = useTeacherData();
  const management = useExamManagement({
    exams: data.exams,
    setExams: data.setExams,
    showToast: data.showToast,
  });
  const imports = useExamImport({
    setQuestions: management.setQuestions,
    examTitle: management.examTitle,
    setExamTitle: management.setExamTitle,
    showToast: data.showToast,
  });
  const stats = useExamStats({
    exams: data.exams,
    submissions: data.submissions,
  });

  if (!data.currentUser) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
          {data.toast}
        </div>
      )}
      <div
        className={`grid min-h-screen transition-[grid-template-columns] duration-300 ease-out ${
          sidebarCollapsed
            ? "lg:grid-cols-[72px_1fr]"
            : "lg:grid-cols-[260px_1fr]"
        }`}
      >
        <TeacherSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarTimerRef={management.sidebarTimerRef}
          currentUserName={data.currentUser.username}
        />
        <main className="px-6 py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Багш Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Шалгалт товлох, үүсгэх, өрөөг удирдах
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted"
                  onClick={() =>
                    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                  }
                >
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3a1 1 0 0 0 0 2" />
                    <path d="M12 19a1 1 0 0 0 0 2" />
                    <path d="M4.93 4.93a1 1 0 0 0 1.41 1.41" />
                    <path d="M17.66 17.66a1 1 0 0 0 1.41 1.41" />
                    <path d="M3 12a1 1 0 0 0 2 0" />
                    <path d="M19 12a1 1 0 0 0 2 0" />
                    <path d="M4.93 19.07a1 1 0 0 0 1.41-1.41" />
                    <path d="M17.66 6.34a1 1 0 0 0 1.41-1.41" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {theme === "dark" ? "Гэрэлтэй горим" : "Харанхуй горим"}
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted">
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Мэдэгдэл
                </button>
                <button
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                  onClick={() => {
                    clearSession();
                    router.push("/");
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  Гарах
                </button>
              </div>
            </header>

            {activeTab === "Exam" && (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  {loading
                    ? Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-24 animate-pulse rounded-2xl border border-border bg-muted"
                        />
                      ))
                    : stats.map((stat) => (
                        <div key={stat.label} className={mutedCardClass}>
                          <div className="text-xs text-muted-foreground">
                            {stat.label}
                          </div>
                          <div className="mt-2 text-2xl font-semibold">
                            {stat.value}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stat.trend}
                          </div>
                        </div>
                      ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                  <div className={cardClass}>
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <svg
                          className="h-4 w-4 text-muted-foreground"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4" />
                          <path d="M8 2v4" />
                          <path d="M3 10h18" />
                        </svg>
                        Шалгалт товлох
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        Маргаашийн сануулга
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input
                        className={inputClass}
                        placeholder="Шалгалтын нэр"
                        value={scheduleTitle}
                        onChange={(event) =>
                          setScheduleTitle(event.target.value)
                        }
                      />
                      <input
                        type="number"
                        min={10}
                        className={inputClass}
                        value={durationMinutes}
                        onChange={(event) =>
                          setDurationMinutes(Number(event.target.value))
                        }
                        placeholder="Хугацаа (минут)"
                      />
                      <input
                        type="datetime-local"
                        className={inputClass}
                        value={scheduleDate}
                        onChange={(event) =>
                          setScheduleDate(event.target.value)
                        }
                      />
                      <button
                        className={`w-full ${buttonPrimary}`}
                        onClick={handleSchedule}
                      >
                        Товлох
                      </button>
                      {roomCode && (
                        <div className="rounded-xl border border-border bg-muted px-3 py-2 text-sm">
                          Room code:{" "}
                          <span className="font-semibold">{roomCode}</span>
                          <button
                            className="ml-3 rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted"
                            onClick={() => copyCode(roomCode)}
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <svg
                          className="h-4 w-4 text-muted-foreground"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                        Шалгалт үүсгэх
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        Text / Задгай
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>Файл импорт (PDF / CSV / DOCX)</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 5v14" />
                                <path d="M5 12h14" />
                              </svg>
                              PDF
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) handlePdfUpload(file);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                                <path d="M14 2v6h6" />
                                <path d="M8 13h8" />
                                <path d="M8 17h6" />
                              </svg>
                              TXT
                              <input
                                type="file"
                                accept=".txt,text/plain"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) handleTxtUpload(file);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 4h16v16H4z" />
                                <path d="M8 8h8" />
                                <path d="M8 12h8" />
                                <path d="M8 16h6" />
                              </svg>
                              CSV
                              <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) handleCsvUpload(file);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                                <path d="M14 2v6h6" />
                                <path d="M8 13h8" />
                                <path d="M8 17h6" />
                              </svg>
                              DOCX
                              <input
                                type="file"
                                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) handleDocxUpload(file);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            id="ocr-toggle"
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            checked={pdfUseOcr}
                            onChange={(event) =>
                              setPdfUseOcr(event.target.checked)
                            }
                          />
                          <label htmlFor="ocr-toggle" className="text-xs">
                            Зөв хариултын зураг OCR ашиглах
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="ml-auto w-24 rounded-lg border border-border bg-card px-2 py-1 text-[11px]"
                            placeholder="Page"
                            value={answerKeyPage === "last" ? "" : answerKeyPage}
                            onChange={(event) => {
                              const value = event.target.value;
                              setAnswerKeyPage(value ? Number(value) : "last");
                            }}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            (blank = last)
                          </span>
                        </div>
                        {pdfLoading && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            PDF уншиж байна...
                          </div>
                        )}
                        {pdfError && (
                          <div className="mt-2 text-xs text-red-500">
                            {pdfError}
                          </div>
                        )}
                        {importError && (
                          <div className="mt-2 text-xs text-red-500">
                            {importError}
                          </div>
                        )}
                      </div>
                      <input
                        className={inputClass}
                        placeholder="Шалгалтын нэр"
                        value={examTitle}
                        onChange={(event) => setExamTitle(event.target.value)}
                      />
                      <input
                        type="number"
                        min={10}
                        className={inputClass}
                        value={durationMinutes}
                        onChange={(event) =>
                          setDurationMinutes(Number(event.target.value))
                        }
                        placeholder="Хугацаа (минут)"
                      />
                      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                        <input
                          className={inputClass}
                          placeholder="Асуултын текст"
                          value={questionText}
                          onChange={(event) =>
                            setQuestionText(event.target.value)
                          }
                        />
                        <select
                          className={selectClass}
                          value={questionType}
                          onChange={(event) =>
                            setQuestionType(
                              event.target.value as "text" | "open" | "mcq",
                            )
                          }
                        >
                          <option value="text">Text</option>
                          <option value="open">Задгай</option>
                          <option value="mcq">Test (A,B,C,D)</option>
                        </select>
                      </div>
                      {questionType === "mcq" && (
                        <div className="grid gap-2 md:grid-cols-2">
                          {["A", "B", "C", "D"].map((label, index) => (
                            <input
                              key={label}
                              className={inputClass}
                              placeholder={`${label} сонголт`}
                              value={mcqOptions[index] ?? ""}
                              onChange={(event) => {
                                const next = [...mcqOptions];
                                next[index] = event.target.value;
                                setMcqOptions(next);
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <input
                        className={inputClass}
                        placeholder={
                          questionType === "mcq"
                            ? "Зөв хариулт (A/B/C/D эсвэл сонголтын текст)"
                            : "Зөв хариулт"
                        }
                        value={questionAnswer}
                        onChange={(event) =>
                          setQuestionAnswer(event.target.value)
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <button className={buttonGhost} onClick={addQuestion}>
                          + Асуулт нэмэх
                        </button>
                        <button className={buttonPrimary} onClick={saveExam}>
                          Шалгалт хадгалах
                        </button>
                      </div>
                      {questions.length > 0 && (
                        <div className="space-y-3">
                          <div
                            className={`grid gap-4 ${
                              isPreviewEditing
                                ? "lg:grid-cols-[1.1fr_0.9fr]"
                                : "lg:grid-cols-1"
                            }`}
                          >
                            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold">
                                    Student Preview
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Preview the parsed exam as a student sees it.
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                                    {previewQuestionIndex + 1}/{questions.length}
                                  </div>
                                  <button
                                    className={buttonGhost}
                                    onClick={() =>
                                      setIsPreviewEditing((prev) => !prev)
                                    }
                                  >
                                    {isPreviewEditing ? "Close Edit" : "Edit"}
                                  </button>
                                </div>
                              </div>
                              <div className="mt-4 rounded-2xl border border-border bg-muted/60 p-5">
                                <div className="text-xs text-muted-foreground">
                                  Question {previewQuestionIndex + 1}
                                </div>
                                <div className="mt-2 text-base font-medium leading-7 text-foreground">
                                  {questions[previewQuestionIndex]?.text}
                                </div>
                                {questions[previewQuestionIndex]?.type === "mcq" &&
                                  questions[previewQuestionIndex]?.options && (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                      {questions[previewQuestionIndex].options.map(
                                        (option, index) => {
                                          const label = String.fromCharCode(
                                            65 + index,
                                          );
                                          return (
                                            <div
                                              key={`${label}-${option}`}
                                              className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm"
                                            >
                                              <span className="font-semibold">
                                                {label}.
                                              </span>{" "}
                                              {option}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                                {questions[previewQuestionIndex]?.type !== "mcq" && (
                                  <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                                    {questions[previewQuestionIndex]?.type === "open"
                                      ? "Students will type a long answer here."
                                      : "Students will enter a short answer here."}
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-2">
                                  {questions.map((question, index) => (
                                    <button
                                      key={question.id}
                                      className={`grid h-9 w-9 place-items-center rounded-lg border text-xs transition ${
                                        index === previewQuestionIndex
                                          ? "border-primary bg-primary/10 text-foreground"
                                          : "border-border bg-muted hover:bg-muted/70"
                                      }`}
                                      onClick={() => setPreviewQuestionIndex(index)}
                                    >
                                      {index + 1}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className={buttonGhost}
                                    onClick={() =>
                                      setPreviewQuestionIndex((prev) =>
                                        Math.max(prev - 1, 0),
                                      )
                                    }
                                    disabled={previewQuestionIndex === 0}
                                  >
                                    Prev
                                  </button>
                                  <button
                                    className={buttonGhost}
                                    onClick={() =>
                                      setPreviewQuestionIndex((prev) =>
                                        Math.min(prev + 1, questions.length - 1),
                                      )
                                    }
                                    disabled={
                                      previewQuestionIndex === questions.length - 1
                                    }
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isPreviewEditing && (
                              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                              <div className="text-sm font-semibold">Edit Panel</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Fix broken math/text here and check the preview beside it.
                              </div>
                              <div className="mt-4 space-y-3">
                                <textarea
                                  className="min-h-32 w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                  value={questions[previewQuestionIndex]?.text ?? ""}
                                  onChange={(event) =>
                                    updateQuestionField(
                                      previewQuestionIndex,
                                      "text",
                                      event.target.value,
                                    )
                                  }
                                />
                                {questions[previewQuestionIndex]?.type === "mcq" &&
                                  questions[previewQuestionIndex]?.options && (
                                    <div className="grid gap-2">
                                      {questions[
                                        previewQuestionIndex
                                      ].options.map((option, index) => {
                                        const label = String.fromCharCode(
                                          65 + index,
                                        );
                                        return (
                                          <input
                                            key={`${label}-edit-${index}`}
                                            className={inputClass}
                                            value={option}
                                            placeholder={`${label} option`}
                                            onChange={(event) =>
                                              updateQuestionOption(
                                                previewQuestionIndex,
                                                index,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                <input
                                  className={inputClass}
                                  value={
                                    questions[previewQuestionIndex]
                                      ?.correctAnswer ?? ""
                                  }
                                  placeholder="Correct answer"
                                  onChange={(event) =>
                                    updateQuestionField(
                                      previewQuestionIndex,
                                      "correctAnswer",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              </div>
                            )}
                          </div>
                          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">
                              Parsed Questions
                            </div>
                            <div className="mt-2 space-y-2">
                              {questions.map((question, index) => (
                                <div
                                  key={question.id}
                                  className="flex items-center justify-between rounded-lg border border-border bg-card px-2 py-1"
                                >
                                  <button
                                    className="text-left text-xs transition hover:opacity-80"
                                    onClick={() => setPreviewQuestionIndex(index)}
                                  >
                                    {index + 1}. {question.text} ({question.type})
                                  </button>
                                  <button
                                    className="text-xs text-red-500 transition hover:opacity-80"
                                    onClick={() => removeQuestion(question.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div className={cardClass}>
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <svg
                        className="h-4 w-4 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 6h13" />
                        <path d="M8 12h13" />
                        <path d="M8 18h13" />
                        <path d="M3 6h.01" />
                        <path d="M3 12h.01" />
                        <path d="M3 18h.01" />
                      </svg>
                      Шалгалтын жагсаалт
                    </h2>
                    <div className="mt-4 space-y-3 text-sm">
                      {exams.length === 0 && (
                        <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                          Одоогоор шалгалт байхгүй байна.
                        </div>
                      )}
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-2"
                        >
                          <div>
                            <div className="font-medium">{exam.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Код: {exam.roomCode} · {exam.questions.length}{" "}
                              асуулт
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Хугацаа: {exam.duration ?? 45} мин · Товлосон:{" "}
                              {formatDateTime(exam.scheduledAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-border px-2 py-1 text-xs">
                              {exam.scheduledAt ? "Товлосон" : "Бэлэн"}
                            </span>
                            <button
                              className="rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted"
                              onClick={() => copyCode(exam.roomCode)}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={cardClass}>
                      <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <svg
                          className="h-4 w-4 text-muted-foreground"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        Мэдэгдэл
                      </h2>
                      <div className="mt-4 space-y-3 text-sm">
                        {notifications.length === 0 && (
                          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                            Одоогоор мэдэгдэл алга.
                          </div>
                        )}
                        {notifications.map((item, index) => (
                          <button
                            key={`${item.examId}-${item.createdAt}`}
                            className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                              item.read
                                ? "border-border bg-muted text-muted-foreground"
                                : "border-primary/40 bg-primary/5"
                            }`}
                            onClick={() => markNotificationRead(index)}
                          >
                            <div className="text-xs">{item.message}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {formatDateTime(item.createdAt)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={cardClass}>
                      <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <svg
                          className="h-4 w-4 text-muted-foreground"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                        Cheat Monitoring
                      </h2>
                      <div className="mt-4 space-y-3 text-sm">
                        {mockСурагчs.map((student) => (
                          <div
                            key={student.name}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                          >
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Оноо: {student.score}%
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                student.cheat === "High"
                                  ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                                  : student.cheat === "Medium"
                                    ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                              }`}
                            >
                              {student.cheat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === "Дүн" && (
              <ResultsTab
                examOptions={stats.examOptions}
                activeExamId={stats.activeExamId}
                onSelectExam={stats.setSelectedExamId}
                examStats={stats.examStats}
                submissions={data.submissions}
                onSelectSubmission={stats.setSelectedSubmissionId}
                selectedSubmission={stats.selectedSubmission}
                selectedExam={stats.selectedExam}
              />
            )}

            {activeTab === "Тохиргоо" && <SettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

