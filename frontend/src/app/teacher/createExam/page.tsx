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
import { consumePendingCreateExamDraft } from "../create-exam-dialog-state";

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
  const pendingAppliedRef = useRef(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

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

    const pending = consumePendingCreateExamDraft();
    if (!pending) return;

    if (pending.mode === "manual") {
      management.setExamTitle(pending.examTitle);
      return;
    }

    if (pending.mode === "pdf") {
      management.setExamTitle(pending.examTitle);
      imports.setImportMcqCount(pending.importMcqCount);
      imports.setImportTextCount(pending.importTextCount);
      imports.setImportOpenCount(pending.importOpenCount);
      data.showToast("PDF импортын тохиргоо бэлэн боллоо. Файлаа оруулаад үргэлжлүүлнэ үү.");
      return;
    }

    void (async () => {
      const draft = await generator.generateDraft(pending.input);
      if (!draft) return;
      management.setExamTitle(draft.title);
      management.setQuestions(draft.questions);
    })();
  }, [
    data,
    generator,
    imports,
    management,
    sessionUser?.id,
  ]);

  const handleSaveExam = async () => {
    const success = await management.saveExam();
    if (success) router.push("/teacher");
  };

  return (
    <div className={pageShellClass}>
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm shadow-[0_20px_45px_-32px_rgba(15,23,42,0.28)]">
          {data.toast}
        </div>
      )}
      <header className="flex items-center justify-between gap-3 bg-white/80 px-6 py-4 backdrop-blur">
        <Button
          type="button"
          onClick={() => router.push("/teacher")}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Button>
        <Button className="text-sm py-5">AI ашиглан үүсгэх</Button>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1180px]">
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
            saving={management.saving}
            hasUser={management.hasCurrentUser}
            pdfUseOcr={imports.pdfUseOcr}
            setPdfUseOcr={imports.setPdfUseOcr}
            answerKeyPage={imports.answerKeyPage}
            setAnswerKeyPage={imports.setAnswerKeyPage}
            importMcqCount={imports.importMcqCount}
            setImportMcqCount={imports.setImportMcqCount}
            importTextCount={imports.importTextCount}
            setImportTextCount={imports.setImportTextCount}
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
          />
        </div>
      </main>
    </div>
  );
}
