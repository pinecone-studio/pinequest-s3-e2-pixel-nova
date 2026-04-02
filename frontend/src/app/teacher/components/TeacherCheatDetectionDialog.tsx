"use client";

import {
  CHEAT_DETECTION_LABELS,
  DEFAULT_ENABLED_CHEAT_DETECTIONS,
  type ConfigurableCheatDetection,
} from "@/lib/exam-cheat-detections";
import type { Exam } from "../types";

type TeacherCheatDetectionDialogProps = {
  exam: Exam | null;
  examTitle?: string | null;
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
  examTitle,
  open,
  saving = false,
  requiresAudioRecording,
  selectedDetections,
  onAudioRequirementChange,
  onChange,
  onClose,
  onSave,
}: TeacherCheatDetectionDialogProps) {
  if (!open) return null;

  const title = exam?.title ?? examTitle ?? "Шалгалт";
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

  const ToggleRow = ({
    checked,
    label,
    onToggle,
  }: {
    checked: boolean;
    label: string;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-4 rounded-[20px] px-1 py-1 text-left transition hover:bg-slate-50"
    >
      <span
        className={`relative h-7 w-14 shrink-0 rounded-full border transition ${
          checked ? "border-[#2f6df6] bg-[#2f6df6]" : "border-[#c9c9c9] bg-white"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition ${
            checked ? "right-0.5" : "left-0.5 bg-[#d1d5db]"
          }`}
        />
      </span>
      <span className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">
        {label}
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[130] overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-[8px] sm:px-6 sm:py-10"
      onClick={onClose}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[920px] items-center justify-center py-4 sm:py-8">
        <div
          className="w-full overflow-hidden rounded-[32px] border border-[#eceff3] bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.45)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8 sm:pt-7">
            <div className="min-w-0">
              <h2 className="text-[34px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[40px]">
                Шалгалтын зөрчил сонгоно уу.
              </h2>
              <p className="mt-3 max-w-2xl text-[18px] leading-7 text-slate-400">
                Таны идэвхжүүлсэн зөрчил гарах үед мэдэгдэл болон очно.
              </p>
              <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
            </div>

            <button
              type="button"
              className="mt-1 inline-flex size-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={onClose}
              aria-label="Луйврийн тохиргоог хаах"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-7 pt-4 sm:px-8">
            <div className="grid gap-4">
              <ToggleRow
                checked={requiresAudioRecording}
                label="Камер нээх"
                onToggle={() =>
                  onAudioRequirementChange(!requiresAudioRecording)
                }
              />

              {DEFAULT_ENABLED_CHEAT_DETECTIONS.map((detection) => (
                <ToggleRow
                  key={detection}
                  checked={selectedSet.has(detection)}
                  label={CHEAT_DETECTION_LABELS[detection]}
                  onToggle={() => toggleDetection(detection)}
                />
              ))}
            </div>

            {selectedSet.size === 0 && (
              <p className="mt-5 rounded-2xl border border-[#f5d3bf] bg-[#fff7f2] px-4 py-3 text-sm text-[#9a4a20]">
                Хадгалахаасаа өмнө дор хаяж нэг илрүүлэлт идэвхтэй байх ёстой.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 pb-7 sm:px-8">
            <button
              type="button"
              className="rounded-[18px] border border-[#d6dee8] bg-white px-7 py-3 text-[18px] font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
            >
              Болих
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-[18px] px-8 py-3 text-[18px] font-medium text-white transition ${
                selectedSet.size === 0 || saving
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-[#2f6df6] hover:bg-[#255fe0]"
              }`}
              onClick={onSave}
              disabled={selectedSet.size === 0 || saving}
            >
              {saving ? (
                <>
                  <svg
                    className="size-5 animate-spin"
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
                "Хадгалах"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
