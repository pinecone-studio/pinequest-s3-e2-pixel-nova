"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import TeacherSelect from "./TeacherSelect";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Copy,
  Grip,
  ImagePlus,
  CloudUpload,
  Trash2,
  X,
} from "lucide-react";
import type { AiExamGeneratorInput } from "../types";

const tabs = ["Гараар үүсгэх", "AI ноорог үүсгэх", "PDF файл-Материал"] as const;

type CreateExamTab = (typeof tabs)[number];

const fieldClass =
  "h-9 rounded-2xl border border-[#d9dde6] bg-white px-4 text-[14px] text-[#111827] shadow-none placeholder:text-[#9aa2af] focus-visible:ring-0";

function ManualTabPanel({
  title,
  onTitleChange,
  onContinue,
  pending,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  onContinue: () => void;
  pending: boolean;
}) {
  return (
    <>
      <section className="mt-10 rounded-[22px] border border-[#d9dde6] bg-white px-5 py-4">
        <label className="block text-[16px] font-medium text-[#111827]">
          Гарчиг оруулна уу
        </label>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Тайлбар оруулна уу (Заавал биш)"
          className="mt-5 h-11 rounded-none border-x-0 border-t-0 border-b-[#d7dde6] px-0 text-[14px] shadow-none focus-visible:ring-0"
        />
      </section>

      <section className="mt-4 rounded-[22px] border border-[#d9dde6] bg-white px-6 py-5">
        <div className="flex justify-center pb-2 text-[#c0c7d4]">
          <Grip className="size-4" />
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#e8f1ff] text-[12px] font-semibold text-[#2563eb]">
              1
            </span>
            <div className="min-w-0 text-[15px] font-medium text-[#111827]">
              Асуултаа оруулна уу.
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-xl border border-[#d1d7e0] bg-[#eef2f6] px-3 text-[13px] font-medium text-[#374151]"
          >
            Задгай даалгавар
            <ChevronDown className="size-4" />
          </button>
        </div>

        <div className="pt-6">
          <Input
            placeholder="Хариулт"
            className="h-10 max-w-[200px] rounded-none border-x-0 border-t-0 border-b-[#d7dde6] px-0 text-[14px] shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-end gap-5 text-[#6b7280]">
          <button
            type="button"
            aria-label="Add image"
            className="transition hover:text-[#111827]"
          >
            <ImagePlus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Duplicate question"
            className="transition hover:text-[#111827]"
          >
            <Copy className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Delete question"
            className="transition hover:text-[#111827]"
          >
            <Trash2 className="size-4" />
          </button>

          <div className="h-5 w-px bg-[#d1d5db]" />

          <label className="flex items-center gap-2 text-[14px] text-[#4b5563]">
            <span>Заавал хариулах</span>
            <span className="relative inline-flex h-6 w-10 items-center rounded-full bg-[#2563eb] px-0.5">
              <span className="ml-auto size-5 rounded-full bg-white shadow-sm" />
            </span>
          </label>

          <Button
            variant="outline"
            className="h-10 rounded-2xl border-[#cfe0ff] px-4 text-[14px] font-medium text-[#31558c]"
          >
            + Асуулт нэмэх
          </Button>
        </div>
      </section>

      <DialogFooter className="mt-4 border-t-0 bg-transparent px-8 pb-8 pt-0 sm:justify-end">
        <Button
          variant="outline"
          className="h-10 rounded-2xl border-[#d6dae1] px-6 text-[14px] text-[#374151]"
          onClick={onContinue}
          disabled={pending}
        >
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner className="size-4" />}
            Хуваарь нэмэх
          </span>
        </Button>
        <Button
          className="h-10 rounded-2xl bg-[#2563eb] px-6 text-[14px] font-medium text-white hover:bg-[#1d4ed8]"
          onClick={onContinue}
          disabled={pending}
        >
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner className="size-4" />}
            {pending ? "Нээж байна..." : "Хадгалах"}
          </span>
        </Button>
      </DialogFooter>
    </>
  );
}

function AiTabPanel({
  input,
  onChange,
  onContinue,
  pending,
}: {
  input: AiExamGeneratorInput;
  onChange: <K extends keyof AiExamGeneratorInput>(
    key: K,
    value: AiExamGeneratorInput[K],
  ) => void;
  onContinue: () => void;
  pending: boolean;
}) {
  return (
    <>
      <section className="mt-4 rounded-[22px] border border-[#d9dde6] bg-white px-5 py-5">
        <h3 className="text-[16px] font-semibold text-[#111827]">
          AI-аар шалгалтын ноорог үүсгэх
        </h3>
        <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">
          Доорх асуултуудыг бөглөснөөр засварлахад бэлэн шалгалтын ноорог
          үүснэ.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Шалгалтын гарчиг
            </span>
            <Input
              value={input.topic}
              onChange={(event) => onChange("topic", event.target.value)}
              placeholder="Жишээ нь: Present simple tense"
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Хичээл
            </span>
            <Input
              value={input.subject ?? ""}
              onChange={(event) => onChange("subject", event.target.value)}
              placeholder="Жишээ нь: Англи хэл"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1.25fr)_214px_214px]">
          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">Анги</span>
            <Input
              value={input.gradeOrClass ?? ""}
              onChange={(event) => onChange("gradeOrClass", event.target.value)}
              placeholder="Хэддүгээр ангийн сурагчдад зориулэх вэ?"
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Түвшин
            </span>
            <TeacherSelect
              compact
              value={input.difficulty}
              onChange={(event) =>
                onChange(
                  "difficulty",
                  event.target.value as AiExamGeneratorInput["difficulty"],
                )
              }
              options={[
                { value: "easy", label: "Анхан шат" },
                { value: "medium", label: "Дунд шат" },
                { value: "hard", label: "Ахисан шат" },
              ]}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Асуултын тоо
            </span>
            <Input
              type="number"
              min={1}
              value={String(input.questionCount)}
              onChange={(event) =>
                onChange(
                  "questionCount",
                  Math.max(1, Number(event.target.value) || 1),
                )
              }
              placeholder="Хэдэн асуулттай байх"
              className={fieldClass}
            />
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-[14px] font-medium text-[#111827]">
            Нэмэлт мэдээлэл
          </span>
          <textarea
            rows={4}
            value={input.instructions ?? ""}
            onChange={(event) => onChange("instructions", event.target.value)}
            placeholder="Жишээ нь: 70 хувь нь задгай даалгавар, 30 хувь нь нэг хариулттай гэж мэт..."
            className="min-h-[82px] w-full rounded-2xl border border-[#d9dde6] bg-white px-4 py-3 text-[14px] text-[#111827] outline-none placeholder:text-[#9aa2af]"
          />
        </label>
      </section>

      <DialogFooter className="mt-4 border-t-0 bg-transparent px-8 pb-8 pt-0 sm:justify-end">
        <Button
          className="h-10 rounded-2xl bg-[#2563eb] px-6 text-[14px] font-medium text-white hover:bg-[#1d4ed8]"
          onClick={onContinue}
          disabled={pending}
        >
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner className="size-4" />}
            {pending ? "Нээж байна..." : "Ноорог үүсгэх"}
          </span>
        </Button>
      </DialogFooter>
    </>
  );
}

function PdfTabPanel({
  examTitle,
  onExamTitleChange,
  counts,
  onCountChange,
  selectedFileName,
  onPickFile,
  onContinue,
  pending,
}: {
  examTitle: string;
  onExamTitleChange: (value: string) => void;
  counts: {
    mcq: number;
    open: number;
  };
  onCountChange: (key: "mcq" | "open", value: number) => void;
  selectedFileName: string | null;
  onPickFile: () => void;
  onContinue: () => void;
  pending: boolean;
}) {
  const total = useMemo(
    () => counts.mcq + counts.open,
    [counts.mcq, counts.open],
  );

  return (
    <>
      <section className="mt-4 rounded-[22px] border border-[#d9dde6] bg-white px-5 py-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[360px]">
            <h3 className="text-[16px] font-semibold text-[#111827]">
              Файлаас асуулт үүсгэх
            </h3>
            <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">
              Эх сурвалж болон асуултын төрлөө оруулан материалаа автоматаар
              бэлдүүлээрэй.
            </p>
            <Input
              value={examTitle}
              onChange={(event) => onExamTitleChange(event.target.value)}
              placeholder="Шалгалтын гарчиг"
              className="mt-4 h-9 rounded-2xl border border-[#d9dde6] bg-white px-4 text-[14px] text-[#111827] shadow-none placeholder:text-[#9aa2af]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "mcq" as const, label: "Сонголттой", value: counts.mcq },
              { key: "open" as const, label: "Задгай даалгавар", value: counts.open },
            ].map((item) => (
              <div
                key={item.label}
                className="w-full min-w-[152px] rounded-[16px] border border-[#d9dde6] bg-white px-5 py-4 text-center"
              >
                <div className="text-[14px] font-semibold text-[#111827]">
                  {item.label}
                </div>
                <div className="mt-5 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    value={item.value}
                    onChange={(event) =>
                      onCountChange(
                        item.key,
                        Math.max(0, Number(event.target.value) || 0),
                      )
                    }
                    className="h-7 w-[76px] rounded-xl border border-[#d9dde6] bg-[#f8fafc] px-3 text-center text-[14px] text-[#111827] outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end text-[14px] font-medium text-[#111827]">
          Нийт асуулт: {total}
        </div>

        <div className="mt-6">
          <div className="text-[14px] font-medium text-[#111827]">
            Файл хавсаргах
          </div>

          <div className="mt-3 rounded-[18px] border border-dashed border-[#d9dde6] px-6 py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <CloudUpload className="size-7 text-[#111827]" strokeWidth={1.8} />
              <div className="mt-5 text-[14px] font-medium text-[#111827]">
                Файл хавсаргах(Заавал)
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">
                PDF, PNG, DOCX, up to 50MB
              </div>
              {selectedFileName && (
                <div className="mt-3 text-[12px] font-medium text-[#2563eb]">
                  {selectedFileName}
                </div>
              )}
              <Button
                variant="outline"
                className="mt-4 h-8 rounded-xl border-[#d9dde6] px-5 text-[13px] text-[#374151]"
                onClick={onPickFile}
                disabled={pending}
              >
                Оруулах
              </Button>
            </div>
          </div>
        </div>
      </section>

      <DialogFooter className="mt-4 border-t-0 bg-transparent px-8 pb-8 pt-0 sm:justify-end">
        <Button
          className="h-10 rounded-2xl bg-[#2563eb] px-6 text-[14px] font-medium text-white hover:bg-[#1d4ed8]"
          onClick={onContinue}
          disabled={pending}
        >
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner className="size-4" />}
            {pending ? "Нээж байна..." : "Асуулт үүсгэх"}
          </span>
        </Button>
      </DialogFooter>
    </>
  );
}

export default function CreateExamDialogContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<CreateExamTab>("AI ноорог үүсгэх");
  const [manualTitle, setManualTitle] = useState("");
  const [aiInput, setAiInput] = useState<AiExamGeneratorInput>({
    topic: "",
    subject: "",
    gradeOrClass: "",
    difficulty: "medium",
    questionCount: 10,
    instructions: "",
  });
  const [pdfExamTitle, setPdfExamTitle] = useState("");
  const [pdfCounts, setPdfCounts] = useState({
    mcq: 0,
    open: 0,
  });
  const [navigating, setNavigating] = useState(false);
  const [selectedPdfFileName, setSelectedPdfFileName] = useState<string | null>(
    null,
  );

  const handleAiInputChange = <K extends keyof AiExamGeneratorInput>(
    key: K,
    value: AiExamGeneratorInput[K],
  ) => {
    setAiInput((current) => ({ ...current, [key]: value }));
  };

  const handlePdfCountChange = (key: "mcq" | "open", value: number) => {
    setPdfCounts((current) => ({ ...current, [key]: value }));
  };

  const navigateToCreateExam = () => {
    if (navigating) {
      return;
    }

    const params = new URLSearchParams();

    if (activeTab === "Гараар үүсгэх") {
      params.set("mode", "manual");
      if (manualTitle.trim()) {
        params.set("examTitle", manualTitle.trim());
      }
    }

    if (activeTab === "AI ноорог үүсгэх") {
      params.set("mode", "ai");
      params.set("topic", aiInput.topic ?? "");
      params.set("subject", aiInput.subject ?? "");
      params.set("gradeOrClass", aiInput.gradeOrClass ?? "");
      params.set("difficulty", aiInput.difficulty ?? "medium");
      params.set("questionCount", String(aiInput.questionCount ?? 10));
      params.set("instructions", aiInput.instructions ?? "");
    }

    if (activeTab === "PDF файл-Материал") {
      params.set("mode", "pdf");
      if (pdfExamTitle.trim()) {
        params.set("examTitle", pdfExamTitle.trim());
      }
      params.set("importMcqCount", String(pdfCounts.mcq));
      params.set("importOpenCount", String(pdfCounts.open));
    }

    setNavigating(true);
    const query = params.toString();
    router.push(query ? `/teacher/createExam?${query}` : "/teacher/createExam");
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
        onChange={(event) =>
          setSelectedPdfFileName(event.target.files?.[0]?.name ?? null)
        }
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
          {tabs.map((tab) => {
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
          <ManualTabPanel
            title={manualTitle}
            onTitleChange={setManualTitle}
            onContinue={navigateToCreateExam}
            pending={navigating}
          />
        )}

        {activeTab === "AI ноорог үүсгэх" && (
          <AiTabPanel
            input={aiInput}
            onChange={handleAiInputChange}
            onContinue={navigateToCreateExam}
            pending={navigating}
          />
        )}

        {activeTab === "PDF файл-Материал" && (
          <PdfTabPanel
            examTitle={pdfExamTitle}
            onExamTitleChange={setPdfExamTitle}
            counts={pdfCounts}
            onCountChange={handlePdfCountChange}
            selectedFileName={selectedPdfFileName}
            onPickFile={() => fileInputRef.current?.click()}
            onContinue={navigateToCreateExam}
            pending={navigating}
          />
        )}
      </div>
    </DialogContent>
  );
}
