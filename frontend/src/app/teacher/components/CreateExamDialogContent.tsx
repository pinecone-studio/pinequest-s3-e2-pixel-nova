"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AiExamGeneratorInput } from "../types";
import {
  savePendingCreateExamDraft,
  savePendingCreateExamFile,
} from "../create-exam-dialog-state";
import CreateExamAiTabPanelValidated from "./CreateExamAiTabPanelValidated";
import CreateExamManualTabPanel from "./CreateExamManualTabPanel";
import CreateExamPdfTabPanelValidated from "./CreateExamPdfTabPanelValidated";
import {
  type AiErrors,
  type CreateExamTab,
  type ManualErrors,
  type ManualQuestionDraft,
  type PdfCountKey,
  type PdfErrors,
  createExamTabs,
} from "./CreateExamDialogContent.types";
import {
  buildPendingQuestion,
  createEmptyManualQuestionDraft,
  trim,
  validateManualQuestionDraft,
} from "./CreateExamDialogContent.utils";

const buildAiCreateExamRoute = (input: AiExamGeneratorInput) => {
  const params = new URLSearchParams({
    mode: "ai",
    topic: trim(input.topic),
    difficulty: input.difficulty,
    questionCount: String(input.questionCount),
  });

  if (trim(input.subject ?? "")) {
    params.set("subject", trim(input.subject ?? ""));
  }
  if (trim(input.gradeOrClass ?? "")) {
    params.set("gradeOrClass", trim(input.gradeOrClass ?? ""));
  }
  if (trim(input.instructions ?? "")) {
    params.set("instructions", trim(input.instructions ?? ""));
  }

  return `/teacher/createExam?${params.toString()}`;
};

export default function CreateExamDialogContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<CreateExamTab>(
    "AI ноорогоор үүсгэх",
  );
  const [manualTitle, setManualTitle] = useState("");
  const [manualQuestionDraft, setManualQuestionDraft] =
    useState<ManualQuestionDraft>(createEmptyManualQuestionDraft());
  const [manualErrors, setManualErrors] = useState<ManualErrors>({});
  const [aiInput, setAiInput] = useState<AiExamGeneratorInput>({
    topic: "",
    subject: "",
    gradeOrClass: "",
    difficulty: "medium",
    questionCount: 10,
    instructions: "",
  });
  const [aiErrors, setAiErrors] = useState<AiErrors>({});
  const [pdfExamTitle, setPdfExamTitle] = useState("");
  const [pdfCounts, setPdfCounts] = useState({
    mcq: 0,
    text: 0,
    open: 0,
  });
  const [pdfErrors, setPdfErrors] = useState<PdfErrors>({});
  const [navigating, setNavigating] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedPdfFileName, setSelectedPdfFileName] = useState<string | null>(
    null,
  );

  const handleAiInputChange = <K extends keyof AiExamGeneratorInput>(
    key: K,
    value: AiExamGeneratorInput[K],
  ) => {
    setAiInput((current) => ({ ...current, [key]: value }));
    setAiErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handlePdfCountChange = (key: PdfCountKey, value: number) => {
    setPdfCounts((current) => ({ ...current, [key]: value }));
    setPdfErrors((current) => ({ ...current, counts: undefined }));
  };

  const handleManualQuestionDraftChange = (
    key: keyof ManualQuestionDraft,
    value: string | number,
  ) => {
    setManualQuestionDraft((current) => {
      if (key === "mcqOptions") {
        try {
          return {
            ...current,
            mcqOptions: JSON.parse(String(value)) as string[],
          };
        } catch {
          return current;
        }
      }

      if (key === "type") {
        const nextType = value === "mcq" ? "mcq" : "open";
        return {
          ...current,
          type: nextType,
          correctIndex: nextType === "mcq" ? current.correctIndex : 0,
        };
      }

      return { ...current, [key]: value } as ManualQuestionDraft;
    });
    setManualErrors((current) => ({
      ...current,
      question: undefined,
      questions: undefined,
    }));
  };

  const handleManualTitleChange = (value: string) => {
    setManualTitle(value);
    setManualErrors((current) => ({ ...current, title: undefined }));
  };

  const handleNavigateToCreateExam = async () => {
    if (navigating) {
      return;
    }

    if (activeTab === "Гараар үүсгэх") {
      const nextErrors: ManualErrors = {};
      if (!trim(manualTitle)) {
        nextErrors.title = "Гарчиг оруулна уу.";
      }
      const manualQuestionError =
        validateManualQuestionDraft(manualQuestionDraft);
      if (manualQuestionError) {
        nextErrors.question = manualQuestionError;
      }

      if (nextErrors.title || nextErrors.question) {
        setManualErrors(nextErrors);
        return;
      }

      setNavigating(true);
      savePendingCreateExamDraft({
        mode: "manual",
        examTitle: trim(manualTitle),
        questions: [buildPendingQuestion(manualQuestionDraft)],
      });
      router.push("/teacher/createExam");
      return;
    }

    if (activeTab === "AI ноорогоор үүсгэх") {
      const nextErrors: AiErrors = {};
      if (!trim(aiInput.topic)) {
        nextErrors.topic = "Шалгалтын гарчиг оруулна уу.";
      }
      if (!trim(aiInput.subject ?? "")) {
        nextErrors.subject = "Хичээл оруулна уу.";
      }
      if (!trim(aiInput.gradeOrClass ?? "")) {
        nextErrors.gradeOrClass = "Анги оруулна уу.";
      }
      if (!trim(aiInput.instructions ?? "")) {
        nextErrors.instructions = "Нэмэлт мэдээлэл оруулна уу.";
      }
      if (
        !Number.isFinite(aiInput.questionCount) ||
        aiInput.questionCount < 1
      ) {
        nextErrors.questionCount = "Асуултын тоо 1-ээс их байх ёстой.";
      }

      if (Object.keys(nextErrors).length > 0) {
        setAiErrors(nextErrors);
        return;
      }

      setNavigating(true);
      savePendingCreateExamDraft({
        mode: "ai",
        input: {
          topic: trim(aiInput.topic),
          subject: trim(aiInput.subject ?? "") || undefined,
          gradeOrClass: trim(aiInput.gradeOrClass ?? "") || undefined,
          difficulty: aiInput.difficulty,
          questionCount: aiInput.questionCount,
          instructions: trim(aiInput.instructions ?? "") || undefined,
        },
      });
      router.push(buildAiCreateExamRoute(aiInput));
      return;
    }

    const nextErrors: PdfErrors = {};
    if (!selectedPdfFile) {
      nextErrors.file = "Файл хавсаргана уу.";
    }
    if (pdfCounts.mcq + pdfCounts.text + pdfCounts.open <= 0) {
      nextErrors.counts = "Нийт асуулт дор хаяж 1 байх ёстой.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setPdfErrors(nextErrors);
      return;
    }

    if (!selectedPdfFile) {
      setPdfErrors({ file: "Файл хавсаргана уу." });
      return;
    }

    const fileId = await savePendingCreateExamFile(selectedPdfFile).catch(
      () => null,
    );
    if (!fileId) {
      setPdfErrors({
        file: "Файлыг түр хадгалж чадсангүй. Дахин оролдоно уу.",
      });
      return;
    }

    setNavigating(true);
    savePendingCreateExamDraft({
      mode: "pdf",
      examTitle: trim(pdfExamTitle),
      importMcqCount: pdfCounts.mcq,
      importTextCount: pdfCounts.text,
      importOpenCount: pdfCounts.open,
      fileId,
    });
    router.push("/teacher/createExam");
  };

  const handlePdfFilePick = () => {
    fileInputRef.current?.click();
    setPdfErrors((current) => ({ ...current, file: undefined }));
  };

  return (
    <DialogContent
      showCloseButton={false}
      className="w-[min(1046px,calc(100%-2rem))] max-w-[1046px] gap-0 overflow-hidden rounded-[28px] border border-[#e6e8ee] bg-white p-0 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.28)]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setSelectedPdfFile(file);
          setSelectedPdfFileName(file?.name ?? null);
          setPdfErrors((current) => ({ ...current, file: undefined }));
        }}
      />

      <div className="px-8 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle className="pt-3 text-[20px] font-semibold tracking-[-0.02em] text-[#101828]">
              Шалгалт үүсгэх
            </DialogTitle>
            <DialogDescription className="sr-only">
              Гар аргаар, AI ноорог, эсвэл PDF материалаас шалгалт үүсгэх цонх.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close create exam modal"
              className="inline-flex size-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
              disabled={navigating}
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>

        <div className="mt-8 flex gap-14 border-b border-[#e5e7eb]">
          {createExamTabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                disabled={navigating}
                className={`relative pb-3 text-[14px] font-medium transition ${
                  active ? "text-[#111827]" : "text-[#374151]"
                }`}
              >
                {tab}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#2563eb]" />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "Гараар үүсгэх" && (
          <CreateExamManualTabPanel
          title={manualTitle}
          titleError={manualErrors.title}
          questionDraft={manualQuestionDraft}
          questionError={manualErrors.question}
          questionsError={manualErrors.questions}
          addedQuestions={[]}
          onTitleChange={handleManualTitleChange}
          onQuestionDraftChange={handleManualQuestionDraftChange}
          onContinue={handleNavigateToCreateExam}
          pending={navigating}
        />
        )}

        {activeTab === "AI ноорогоор үүсгэх" && (
          <CreateExamAiTabPanelValidated
            input={aiInput}
            errors={aiErrors}
            onChange={handleAiInputChange}
            onContinue={handleNavigateToCreateExam}
            pending={navigating}
          />
        )}

        {activeTab === "PDF файл-Материал" && (
          <CreateExamPdfTabPanelValidated
            examTitle={pdfExamTitle}
            onExamTitleChange={(value) => {
              setPdfExamTitle(value);
              setPdfErrors((current) => ({ ...current, file: undefined }));
            }}
            counts={pdfCounts}
            onCountChange={handlePdfCountChange}
            selectedFileName={selectedPdfFileName}
            onPickFile={handlePdfFilePick}
            errors={pdfErrors}
            onContinue={handleNavigateToCreateExam}
            pending={navigating}
          />
        )}
      </div>
    </DialogContent>
  );
}
