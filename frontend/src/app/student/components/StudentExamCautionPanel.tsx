import { AlertTriangle } from "lucide-react";

type StudentExamCautionPanelProps = {
  message: string;
};

export default function StudentExamCautionPanel({
  message,
}: StudentExamCautionPanelProps) {
  return (
    <>
      <div className="rounded-[26px] border-2 border-[#62a9ff] bg-white p-4 shadow-[0_20px_45px_rgba(98,169,255,0.12)]">
        <div className="rounded-[18px] border border-dashed border-[#9bccff] px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle className="h-4 w-4 text-[#f0a12c]" />
            Анхааруулах зүйлс
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Шалгалт эхэлсэн тохиолдолд зогсоох боломжгүй.</li>
            <li>Бүтэн дэлгэцтэй байх ёстой.</li>
            <li>Дэлгэц солигдвол зөрчил бүртгэгдэнэ.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[20px] bg-[#f7f9ff] px-4 py-3 text-sm text-slate-500">
        {message}
      </div>
    </>
  );
}
