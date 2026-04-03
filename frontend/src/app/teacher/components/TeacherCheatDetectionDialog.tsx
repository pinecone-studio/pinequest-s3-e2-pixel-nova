"use client";

import {
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

  const selectedSet = new Set<ConfigurableCheatDetection>(
    DEFAULT_ENABLED_CHEAT_DETECTIONS.filter((value) =>
      selectedDetections.includes(value),
    ),
  );

  const designRows: Array<
    | { type: "detection"; key: ConfigurableCheatDetection; label: string }
    | { type: "camera"; key: "camera_requirement"; label: string }
  > = [
    { type: "detection", key: "tab_switch", label: "Дэлгэц солих" },
    { type: "camera", key: "camera_requirement", label: "Камер нээх" },
    { type: "detection", key: "window_blur", label: "Дуу хураагуур" },
    { type: "detection", key: "looking_away", label: "Байршил заагч" },
    { type: "detection", key: "screen_capture", label: "Дэлгэцийн зураг авах" },
    {
      type: "detection",
      key: "devtools_open",
      label: "Хулганы баруун товч дарах",
    },
  ];

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
      className="flex w-full items-center gap-8 px-0 py-0.5 text-left"
    >
      <span
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full border-[2px] transition ${
          checked ? "border-[#2f67ed] bg-white" : "border-[#cfcfcf] bg-white"
        }`}
      >
        <span
          className={`absolute top-1/2 h-[12px] w-[12px] -translate-y-1/2 rounded-full shadow-[0_1px_4px_rgba(15,23,42,0.12)] transition ${
            checked ? "right-[2px] bg-[#2f67ed]" : "left-[2px] bg-[#bdbdbd]"
          }`}
        />
      </span>
      <span className="whitespace-nowrap text-[16px] font-medium tracking-[-0.045em] text-black">
        {label}
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[4px] sm:px-6 "
      onClick={onClose}
    >
      <div className="mx-auto flex h-auto w-full max-w-[500px] items-center justify-center no-scrollbar">
        <div
          className="w-full rounded-[34px] border border-[#e8edf6] bg-white shadow-[0_26px_90px_-38px_rgba(15,23,42,0.38)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 px-8 pb-1 pt-8">
            <div className="min-w-0">
              <h2 className=" whitespace-nowrap text-[22px] font-semibold leading-[1.08] tracking-[-0.06em] text-black">
                Шалгалтын зөрчил сонгоно уу.
              </h2>
              <p className="mt-7 max-w-[404px] text-[16px] leading-[1.24] tracking-[-0.04em] text-[#9ca1aa]">
                Таны идэвхжүүлсэн зөрчил гарах үед мэдэгдэл болон очно.
              </p>
            </div>

            <button
              type="button"
              className="mt-1 inline-flex size-12 items-center justify-center rounded-full text-black transition hover:bg-slate-100"
              onClick={onClose}
              aria-label="Луйвaрийн тохиргоог хаах"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="px-8 pb-4 pt-8">
            <div className="grid gap-6">
              {designRows.map((row) =>
                row.type === "camera" ? (
                  <ToggleRow
                    key={row.key}
                    checked={requiresAudioRecording}
                    label={row.label}
                    onToggle={() =>
                      onAudioRequirementChange(!requiresAudioRecording)
                    }
                  />
                ) : (
                  <ToggleRow
                    key={row.key}
                    checked={selectedSet.has(row.key)}
                    label={row.label}
                    onToggle={() => toggleDetection(row.key)}
                  />
                ),
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 px-8 pb-8 pt-4">
            <button
              type="button"
              className="inline-flex w-24 h-11 items-center justify-center rounded-[16px] border border-[#d8d8d8] bg-white px-8 text-[16px] font-medium tracking-[-0.04em] text-[#2d2d2d] transition hover:bg-slate-50"
              onClick={onClose}
            >
              Болих
            </button>
            <button
              type="button"
              className={`inline-flex w-30 h-11 items-center justify-center gap-2 rounded-[16px] px-8 text-[16px] font-medium tracking-[-0.04em] text-white transition ${
                saving
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-[#2f67ed] shadow-[0_18px_40px_-18px_rgba(47,103,237,0.8)] hover:bg-[#255fe0]"
              }`}
              onClick={onSave}
              disabled={saving}
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
