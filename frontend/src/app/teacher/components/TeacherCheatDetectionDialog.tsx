"use client";

import {
  CHEAT_DETECTION_LABELS,
  DEFAULT_ENABLED_CHEAT_DETECTIONS,
  type ConfigurableCheatDetection,
} from "@/lib/exam-cheat-detections";
import type { Exam } from "../types";

type TeacherCheatDetectionDialogProps = {
  exam: Exam | null;
  open: boolean;
  saving?: boolean;
  requiresAudioRecording: boolean;
  selectedDetections: string[];
  onAudioRequirementChange: (next: boolean) => void;
  onChange: (next: string[]) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function TeacherCheatDetectionDialog({
  exam,
  open,
  saving = false,
  requiresAudioRecording,
  selectedDetections,
  onAudioRequirementChange,
  onChange,
  onClose,
  onSave,
}: TeacherCheatDetectionDialogProps) {
  if (!open || !exam) return null;

  const selectedSet = new Set<ConfigurableCheatDetection>(
    DEFAULT_ENABLED_CHEAT_DETECTIONS.filter((value) =>
      selectedDetections.includes(value),
    ),
  );

  const toggleDetection = (detection: ConfigurableCheatDetection) => {
    if (selectedSet.has(detection)) {
      onChange(selectedDetections.filter((value) => value !== detection));
      return;
    }

    onChange([...selectedDetections, detection]);
  };

  return (
    <div
      className="fixed inset-0 z-[130] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.18),transparent_30%),rgba(8,15,32,0.52)] px-4 py-6 backdrop-blur-[10px] sm:px-6 sm:py-10"
      onClick={onClose}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center py-4 sm:py-8">
        <div
          className="w-full overflow-hidden rounded-[32px] border border-[#d7e2ec] bg-white shadow-[0_32px_80px_-44px_rgba(15,23,42,0.35)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[#e8eef5] px-6 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Луйврын илрүүлэлтийн тохиргоо
                </h2>
                <p className="mt-1 text-sm text-slate-600">{exam.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Хуваарь аль хэдийн хадгалагдсан. Энэ шалгалтад ямар автомат
                  илрүүлэлтүүд идэвхтэй байхыг эндээс тохируулна.
                </p>
              </div>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={onClose}
                aria-label="Луйврын тохиргоог хаах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[#d6e0ea] bg-[#f7fafc] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                onClick={() => onChange([...DEFAULT_ENABLED_CHEAT_DETECTIONS])}
              >
                Бүгдийг сонгох
              </button>
              <button
                type="button"
                className="rounded-full border border-[#d6e0ea] bg-[#f7fafc] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                onClick={() => onChange([...DEFAULT_ENABLED_CHEAT_DETECTIONS])}
              >
                Анхдагчаар сэргээх
              </button>
              <span className="text-xs text-slate-500">
                {selectedSet.size}/{DEFAULT_ENABLED_CHEAT_DETECTIONS.length} идэвхтэй
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  requiresAudioRecording
                    ? "border-[#8bc5be] bg-[#f1fbf8]"
                    : "border-[#dbe4ec] bg-white hover:border-[#b9cad8]"
                } sm:col-span-2`}
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  checked={requiresAudioRecording}
                  onChange={(event) => onAudioRequirementChange(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Микрофоны аудио бичлэг шаардах
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Сурагч шалгалтын турш аудио баримт хэлбэрээр тасралтгүй
                    бичигдэнэ.
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-slate-400">
                    requires_audio_recording
                  </span>
                </span>
              </label>

              {DEFAULT_ENABLED_CHEAT_DETECTIONS.map((detection) => {
                const checked = selectedSet.has(detection);

                return (
                  <label
                    key={detection}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      checked
                        ? "border-[#8bc5be] bg-[#f1fbf8]"
                        : "border-[#dbe4ec] bg-white hover:border-[#b9cad8]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={checked}
                      onChange={() => toggleDetection(detection)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {CHEAT_DETECTION_LABELS[detection]}
                      </span>
                      <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-slate-400">
                        {detection}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedSet.size === 0 && (
              <p className="rounded-2xl border border-[#f5d3bf] bg-[#fff7f2] px-4 py-3 text-sm text-[#9a4a20]">
                Хадгалахаас өмнө дор хаяж нэг илрүүлэлт идэвхтэй байх ёстой.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#e8eef5] px-6 py-5 sm:px-7">
            <button
              type="button"
              className="rounded-[14px] border border-[#d6dee8] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
            >
              Дараа
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-semibold text-white transition ${
                selectedSet.size === 0 || saving
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-[#0f766e] hover:bg-[#0b5f59]"
              }`}
              onClick={onSave}
              disabled={selectedSet.size === 0 || saving}
            >
              {saving ? (
                <>
                  <svg
                    className="size-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeOpacity="0.28"
                      strokeWidth="2"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Хадгалж байна...
                </>
              ) : (
                "Тохиргоо хадгалах"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
