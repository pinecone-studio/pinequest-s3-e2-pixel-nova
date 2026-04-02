"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  STORAGE_KEYS,
  ensureDemoAccounts,
  getJSON,
  setJSON,
  setSessionUser,
  type User,
} from "@/lib/examGuard";
import type { AuthUser } from "@/lib/backend-auth";
import { getAuthUsers } from "@/lib/backend-auth";
import {
  buildSessionUser,
  getStoredSelectedUserId,
  type RoleKey,
} from "@/lib/role-session";
import { useTeacherData } from "../hooks/useTeacherData";
import { useExamManagement } from "../hooks/useExamManagement";
import { useExamImport } from "../hooks/useExamImport";
import { useAiExamGenerator } from "../hooks/useAiExamGenerator";
import ExamCreateCard from "../components/ExamCreateCard";
import { pageShellClass } from "../styles";
import { Button } from "@/components/ui/button";
import {
  consumePendingCreateExamDraft,
  consumePendingCreateExamFile,
  type PendingQuestionDraft,
} from "../create-exam-dialog-state";

type PendingRouteDraft =
  | {
      mode: "manual";
      examTitle: string;
      questions: PendingQuestionDraft[];
    }
  | {
      mode: "ai";
      input: {
        topic: string;
        subject?: string;
        gradeOrClass?: string;
        difficulty: "easy" | "medium" | "hard";
        questionCount: number;
        instructions?: string;
      };
    }
  | {
      mode: "pdf";
      examTitle: string;
      importMcqCount: number;
      importTextCount?: number;
      importOpenCount: number;
      fileId?: string;
    };

const parsePendingRouteDraft = (searchParams: {
  get: (key: string) => string | null;
}): PendingRouteDraft | null => {
  const mode = searchParams.get("mode");
  if (mode === "manual") {
    return {
      mode,
      examTitle: searchParams.get("examTitle") ?? "",
      questions: [],
    };
  }

  if (mode === "ai") {
    const difficulty = searchParams.get("difficulty");
    return {
      mode,
      input: {
        topic: searchParams.get("topic") ?? "",
        subject: searchParams.get("subject") ?? "",
        gradeOrClass: searchParams.get("gradeOrClass") ?? "",
        difficulty:
          difficulty === "easy" || difficulty === "hard"
            ? difficulty
            : "medium",
        questionCount: Math.max(
          1,
          Number(searchParams.get("questionCount") ?? "10") || 10,
        ),
        instructions: searchParams.get("instructions") ?? "",
      },
    };
  }

  if (mode === "pdf") {
    return {
      mode,
      examTitle: searchParams.get("examTitle") ?? "",
      importMcqCount: Math.max(
        0,
        Number(searchParams.get("importMcqCount") ?? "0") || 0,
      ),
      importTextCount: Math.max(
        0,
        Number(searchParams.get("importTextCount") ?? "0") || 0,
      ),
      importOpenCount: Math.max(
        0,
        Number(searchParams.get("importOpenCount") ?? "0") || 0,
      ),
    };
  }

  return null;
};

const role: RoleKey = "teacher";

const getLocalAuthUsers = (r: RoleKey): AuthUser[] => {
  ensureDemoAccounts();
  return getJSON<User[]>(STORAGE_KEYS.users, [])
    .filter((u) => u.role === r)
    .map((u) => ({
      id: u.id,
      fullName: u.username,
      role: u.role,
      email: null,
      avatarUrl: null,
    }));
};

export default function CreateExamPage() {
  const router = useRouter();
  const [redirectingAfterSave, setRedirectingAfterSave] = useState(false);
  const pendingAppliedRef = useRef(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [aiFlowTopic, setAiFlowTopic] = useState("");
  const [aiFlowStatus, setAiFlowStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const authUsers = await getAuthUsers().catch(() =>
          getLocalAuthUsers(role),
        );
        if (cancelled) return;
        const users = authUsers.filter((u) => u.role === role);
        const storedId = getStoredSelectedUserId(role);
        const user = users.find((u) => u.id === storedId) ?? users[0] ?? null;
        setSelectedUser(user);
        setJSON(
          STORAGE_KEYS.users,
          users.map((u) => buildSessionUser(u)),
        );
        if (user) setSessionUser(buildSessionUser(user));
      } catch {
        if (cancelled) return;
        const fallback = getLocalAuthUsers(role);
        const user = fallback[0] ?? null;
        setSelectedUser(user);
        if (user) setSessionUser(buildSessionUser(user));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionUser = useMemo(
    () => (selectedUser ? buildSessionUser(selectedUser) : null),
    [selectedUser],
  );

  const data = useTeacherData(sessionUser);
  const management = useExamManagement({
    exams: data.exams,
    setExams: data.setExams,
    showToast: data.showToast,
    currentUser: data.currentUser,
  });
  const generator = useAiExamGenerator({
    teacherId: sessionUser?.id ?? null,
    showToast: data.showToast,
  });
  const imports = useExamImport({
    setQuestions: management.setQuestions,
    examTitle: management.examTitle,
    setExamTitle: management.setExamTitle,
    showToast: data.showToast,
    currentUser: data.currentUser,
  });

  useEffect(() => {
    if (pendingAppliedRef.current || !sessionUser?.id) return;
    pendingAppliedRef.current = true;

    const routePending =
      typeof window !== "undefined"
        ? parsePendingRouteDraft(new URLSearchParams(window.location.search))
        : null;
    const pending = routePending ?? consumePendingCreateExamDraft();
    if (pending) {
      router.replace?.("/teacher/createExam");
    }
    if (!pending) return;

    if (pending.mode === "manual") {
      management.setExamTitle(pending.examTitle);
      if (pending.questions.length > 0) {
        management.setQuestions(
          pending.questions.map((question, index) => ({
            ...question,
            id: `pending-question-${index + 1}`,
          })),
        );
      }
      return;
    }

    if (pending.mode === "pdf") {
      void (async () => {
        const file = pending.fileId
          ? await consumePendingCreateExamFile(pending.fileId)
          : null;
        if (!file) {
          data.showToast(
            "PDF файлыг түр хадгалж чадсангүй. Дахин оролдоно уу.",
          );
          return;
        }

        management.setExamTitle(pending.examTitle);
        imports.setImportMcqCount(pending.importMcqCount);
        imports.setImportTextCount(pending.importTextCount ?? 0);
        imports.setImportOpenCount(pending.importOpenCount);

        if (file.type.startsWith("image/")) {
          await imports.handleImageUpload(file, { preserveTitle: true });
        } else if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          /\.docx$/i.test(file.name)
        ) {
          await imports.handleDocxUpload(file, { preserveTitle: true });
        } else {
          await imports.handlePdfUpload(file, { preserveTitle: true });
        }
      })();
      return;
    }

    void (async () => {
      setAiFlowTopic(pending.input.topic);
      setAiFlowStatus("loading");
      const draft = await generator.generateDraft(pending.input);
      if (!draft) {
        setAiFlowStatus("error");
        return;
      }
      management.setExamTitle(draft.title);
      management.setQuestions(draft.questions);
      setAiFlowStatus("ready");
    })();
  }, [data, generator, imports, management, router, sessionUser?.id]);

  const handleSaveExam = async () => {
    const success = await management.saveExam();
    if (success) {
      setRedirectingAfterSave(true);
      router.push("/teacher");
    }
  };

  return (
    <div className={pageShellClass}>
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm shadow-[0_20px_45px_-32px_rgba(15,23,42,0.28)]">
          {data.toast}
        </div>
      )}
      <header className="flex items-center justify-between gap-3 bg-white/80 px-6 py-2 backdrop-blur">
        <Button
          type="button"
          onClick={() => router.push("/teacher")}
          variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Button>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1180px]">
          {aiFlowStatus !== "idle" && (
            <div
              className={`mb-4 rounded-[22px] border px-4 py-3 text-sm shadow-[0_16px_30px_-26px_rgba(15,23,42,0.16)] ${
                aiFlowStatus === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : aiFlowStatus === "ready"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[#dbe7fb] bg-[#eff6ff] text-[#1d4ed8]"
              }`}
            >
              {aiFlowStatus === "loading" && (
                <span>AI асуултууд үүсэж байна: {aiFlowTopic}...</span>
              )}
              {aiFlowStatus === "ready" && (
                <span>AI асуултууд бэлэн боллоо: {aiFlowTopic}</span>
              )}
              {aiFlowStatus === "error" && (
                <span>AI асуултууд үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.</span>
              )}
            </div>
          )}
          <ExamCreateCard
            examTitle={management.examTitle}
            setExamTitle={management.setExamTitle}
            questionText={management.questionText}
            setQuestionText={management.setQuestionText}
            questionType={management.questionType}
            setQuestionType={management.setQuestionType}
            mcqOptions={management.mcqOptions}
            setMcqOptions={management.setMcqOptions}
            questionAnswer={management.questionAnswer}
            setQuestionAnswer={management.setQuestionAnswer}
            questionImageUrl={management.questionImageUrl}
            setQuestionImageUrl={management.setQuestionImageUrl}
            questionPoints={management.questionPoints}
            setQuestionPoints={management.setQuestionPoints}
            questionCorrectIndex={management.questionCorrectIndex}
            setQuestionCorrectIndex={management.setQuestionCorrectIndex}
            questions={management.questions}
            addQuestion={management.addQuestion}
            removeQuestion={management.removeQuestion}
            updateQuestion={management.updateQuestion}
            updateQuestionOption={management.updateQuestionOption}
            addQuestionOption={management.addQuestionOption}
            removeQuestionOption={management.removeQuestionOption}
            saveExam={handleSaveExam}
            saving={management.saving || redirectingAfterSave}
            hasUser={management.hasCurrentUser}
            pdfUseOcr={imports.pdfUseOcr}
            setPdfUseOcr={imports.setPdfUseOcr}
            answerKeyPage={imports.answerKeyPage}
            setAnswerKeyPage={imports.setAnswerKeyPage}
            importMcqCount={imports.importMcqCount}
            setImportMcqCount={imports.setImportMcqCount}
            importOpenCount={imports.importOpenCount}
            setImportOpenCount={imports.setImportOpenCount}
            shuffleImportedQuestions={imports.shuffleImportedQuestions}
            setShuffleImportedQuestions={imports.setShuffleImportedQuestions}
            plannedQuestionCount={imports.plannedQuestionCount}
            pdfLoading={imports.pdfLoading}
            pdfError={imports.pdfError}
            importError={imports.importError}
            importLoading={imports.importLoading}
            importLoadingLabel={imports.importLoadingLabel}
            onPdfUpload={imports.handlePdfUpload}
            onImageUpload={imports.handleImageUpload}
            onDocxUpload={imports.handleDocxUpload}
            importTextCount={imports.importTextCount}
            setImportTextCount={imports.setImportTextCount}
            aiFlowStatus={aiFlowStatus}
            aiFlowTopic={aiFlowTopic}
          />
        </div>
      </main>
    </div>
  );
}
