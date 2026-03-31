import { AlertTriangle } from "lucide-react";

type StudentExamCautionPanelProps = {
  requiresAudioRecording?: boolean;
};

export default function StudentExamCautionPanel({
  requiresAudioRecording = false,
}: StudentExamCautionPanelProps) {
  return (
    <div className="rounded-[22px] border border-[#f3d8ac] bg-[#fffdfa] px-5 py-5 shadow-[0_18px_40px_rgba(240,161,44,0.08)]">
      <div className="flex items-center gap-2 text-[1rem] font-semibold text-slate-800">
        <AlertTriangle className="h-4 w-4 text-[#f0a12c]" />
        Анхааруулах зүйлс
      </div>

      <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
        <li>Шалгалт эхэлсэн тохиолдолд зогсоох боломжгүй.</li>
        <li>Интернеттэй байх ёстой.</li>
        <li>Дэлгэц солигдохгүй.</li>
        {requiresAudioRecording && (
          <li>Микрофон идэвхтэй байж, аудио бичлэг тасалдахгүй байх ёстой.</li>
        )}
      </ul>
    </div>
  );
}
