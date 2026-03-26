import { Target } from "lucide-react";

type SummaryStats = {
  total: number;
  average: number;
  best: number;
  latestTitle: string;
  latestDate: string;
};

type StudentSummaryPanelProps = {
  summaryStats: SummaryStats | null;
};

export default function StudentSummaryPanel({
  summaryStats,
}: StudentSummaryPanelProps) {
  return (
    <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[#e8f8ef] text-[#42a873]">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Сүүлийн үзүүлэлт
          </h3>
          <p className="text-sm text-slate-400">
            Таны бодит дүн дээр суурилсан хураангуй
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {!summaryStats ? (
          <div className="rounded-[22px] border border-dashed border-[#eceaf7] bg-[#fbfcff] px-4 py-5 text-sm text-slate-400">
            Одоогоор шалгалтын бодит мэдээлэл алга.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
              <div className="text-xs text-slate-400">Нийт өгсөн</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {summaryStats.total}
              </div>
            </div>
            <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
              <div className="text-xs text-slate-400">Дундаж хувь</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {summaryStats.average}%
              </div>
            </div>
            <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
              <div className="text-xs text-slate-400">Хамгийн өндөр</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {summaryStats.best}%
              </div>
            </div>
            <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
              <div className="text-xs text-slate-400">Сүүлийн шалгалт</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {summaryStats.latestTitle}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {summaryStats.latestDate}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
