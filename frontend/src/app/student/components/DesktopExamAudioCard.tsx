"use client";

import { Mic, RefreshCcw, ShieldAlert, StopCircle } from "lucide-react";
import type { User } from "@/lib/examGuard";
import { useExamAudioRecorder } from "../hooks/useExamAudioRecorder";
import {
  localizeAudioMimeType,
  localizeAudioStatus,
} from "./student-ui-text";

type DesktopExamAudioCardProps = {
  required: boolean;
  sessionId: string | null;
  showWarning: (message: string) => void;
  user: User | null;
  view: "dashboard" | "exam" | "result";
  onTerminateExam: (reason: string) => void;
};

const formatElapsed = (valueMs: number) => {
  const totalSeconds = Math.max(Math.floor(valueMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function DesktopExamAudioCard({
  required,
  sessionId,
  showWarning,
  user,
  view,
  onTerminateExam,
}: DesktopExamAudioCardProps) {
  const { chunkCount, currentChunkElapsedMs, lastError, lastUploadedAt, mimeType, restart, status, stop } =
    useExamAudioRecorder({
      enabled: view === "exam" && required,
      required,
      sessionId,
      user,
      onBlockingIssue: showWarning,
    });

  if (!required) {
    return null;
  }

  const blocked = status === "blocked";

  return (
    <>
      {blocked && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(15,23,42,0.56)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[#f3c7c7] bg-white p-6 shadow-[0_28px_60px_-32px_rgba(15,23,42,0.45)]">
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff1f1] text-[#d14343]">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Микрофоны бичлэг заавал шаардлагатай
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lastError ??
                    "Аудио бичлэг тасарсан тул микрофоны бичлэгийг сэргээх хүртэл шалгалтыг үргэлжлүүлэх боломжгүй."}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5f59]"
                onClick={() => {
                  void restart();
                }}
              >
                Микрофоныг дахин асаах
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#e6c6c6] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#fff7f7]"
                onClick={() =>
                  onTerminateExam("Шалгалтын шаардлагатай аудио бичлэг тасалдсан.")
                }
              >
                Шалгалтыг дуусгах
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[24px] border border-[#d8e1f0] bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-[#e9eef7] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Шалгалтын аудио баримт</p>
            <p className="text-xs text-slate-500">
              30 секундийн хэсгүүдээр микрофоны бичлэг заавал хийгдэнэ
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              status === "recording" || status === "uploading"
                ? "bg-[#eefcf3] text-[#0f9960]"
                : blocked || status === "error" || status === "unsupported"
                  ? "bg-[#fff1eb] text-[#d25b2b]"
                  : "bg-[#edf3ff] text-[#355cde]"
            }`}
          >
            {localizeAudioStatus(status)}
          </span>
        </div>

        <div className="p-4">
          <div className="rounded-[20px] border border-[#d8e1f0] bg-[#f8fbff] p-4">
            <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Одоогийн хэсэг
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {formatElapsed(currentChunkElapsedMs)}
                </div>
              </div>
              <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Илгээсэн хэсэг
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {chunkCount}
                </div>
              </div>
              <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Аудио формат
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {localizeAudioMimeType(mimeType)}
                </div>
              </div>
              <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Сүүлд илгээсэн
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {lastUploadedAt
                    ? new Date(lastUploadedAt).toLocaleTimeString("mn-MN")
                    : "Эхний хэсгийг хүлээж байна"}
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Аудио бичлэг нь багш шалгах баримт байдлаар хадгалагдана. Микрофоны бичлэггүйгээр шалгалтыг үргэлжлүүлэх боломжгүй.
            </p>
            {lastError && (
              <p className="mt-2 text-xs font-medium text-[#d25b2b]">{lastError}</p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-[#d8e1f0] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-[#f8fbff]"
              onClick={() => {
                void restart();
              }}
            >
              <RefreshCcw className="mr-2 inline size-3.5" />
              Микрофоныг дахин асаах
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#d8e1f0] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-[#f8fbff]"
              onClick={stop}
            >
              <StopCircle className="mr-2 inline size-3.5" />
              Зогсоох
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#e9eef7] bg-[#fbfdff] px-3 py-2 text-xs text-slate-600">
            <Mic className="mr-2 inline size-3.5 text-[#355cde]" />
            Шалгалт үргэлжилж байх хугацаанд микрофоны бичлэг идэвхтэй байна.
          </div>
        </div>
      </section>
    </>
  );
}
