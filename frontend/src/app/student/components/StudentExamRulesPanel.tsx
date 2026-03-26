import { ArrowLeft, Camera, ChevronUp, CircleAlert, ClipboardX, Clock3 } from "lucide-react";

type StudentExamRulesPanelProps = {
  rulesOpen: boolean;
  setRulesOpen: (value: boolean) => void;
};

export default function StudentExamRulesPanel({
  rulesOpen,
  setRulesOpen,
}: StudentExamRulesPanelProps) {
  return (
    <div className="rounded-[28px] border border-[#e8edf9] bg-white p-5 shadow-[0_22px_55px_rgba(68,84,125,0.08)] sm:p-6">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setRulesOpen(!rulesOpen)}
      >
        <span className="flex items-center gap-2 text-[1.05rem] font-semibold text-slate-900">
          <CircleAlert className="h-5 w-5" />
          Шалгалтын дүрэм ба мэдээлэл
        </span>
        <ChevronUp
          className={`h-4 w-4 text-[#7fc5ff] transition ${
            rulesOpen ? "" : "rotate-180"
          }`}
        />
      </button>

      {rulesOpen && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-[#ffe2ae] bg-[#fffaf0] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ArrowLeft className="h-4 w-4 text-[#f0a12c]" />
              Буцах
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Өмнөх хуудас руу буцах боломжгүй
            </div>
          </div>

          <div className="rounded-[18px] border border-[#ffe2ae] bg-[#fffaf0] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock3 className="h-4 w-4 text-[#f0a12c]" />
              Авто илгээх
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Цаг дуусмагц автоматаар илгээнэ
            </div>
          </div>

          <div className="rounded-[18px] border border-[#ffd5d3] bg-[#fff5f5] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ClipboardX className="h-4 w-4 text-[#ef6d63]" />
              Хуулах/Буулгах
            </div>
            <div className="mt-1 text-xs text-slate-400">Хориглосон</div>
          </div>

          <div className="rounded-[18px] border border-[#ffd5d3] bg-[#fff5f5] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Camera className="h-4 w-4 text-[#ef6d63]" />
              Камер
            </div>
            <div className="mt-1 text-xs text-slate-400">Заавал</div>
          </div>
        </div>
      )}
    </div>
  );
}
