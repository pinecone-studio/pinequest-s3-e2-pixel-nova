import { badgeClass, cardClass } from "../styles";
import type { ExamStatsSummary, ScoreBand } from "../types";

type ResultsChartsProps = {
  examStats: ExamStatsSummary | null;
};

const BAND_TONE: Record<string, { bar: string; bg: string; text: string }> = {
  high: { bar: "bg-[#4f7cff]", bg: "bg-[#eef4ff]", text: "text-[#3f63dd]" },
  mid: { bar: "bg-[#4f7cff]", bg: "bg-[#eef4ff]", text: "text-[#3f63dd]" },
  low: { bar: "bg-[#4f7cff]", bg: "bg-[#eef4ff]", text: "text-[#3f63dd]" },
};

const getBandTone = (label: string) => {
  if (label.startsWith("90") || label.startsWith("75")) return BAND_TONE.high;
  if (label.startsWith("60")) return BAND_TONE.mid;
  return BAND_TONE.low;
};

const getBandStart = (label: string) => {
  const match = label.match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
};

const BandRow = ({ band, total }: { band: ScoreBand; total: number }) => {
  const pct = total > 0 ? Math.round((band.count / total) * 100) : 0;
  const tone = getBandTone(band.label);
  const bandStart = getBandStart(band.label);
  const bandMessage =
    pct >= 40 ? "Ихэнх нь энд байна" : bandStart < 60 && band.count > 0 ? "Анхаарах бүлэг" : "Хэвийн";

  return (
    <div className="rounded-[18px] border border-[#e7edf5] bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span
          className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text}`}
        >
          {band.label}
        </span>
        <div className="min-w-[120px] text-left sm:text-right">
          <div className="text-sm font-semibold text-slate-900">{band.count} сурагч</div>
          <div className="text-[11px] text-slate-400">{pct}% · {bandMessage}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf1f6]">
        <div
          className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
          style={{ width: `${pct}%`, backgroundColor: band.color }}
        />
      </div>
    </div>
  );
};

const ScoreRow = ({ name, score }: { name: string; score: number }) => (
  <div className="rounded-[18px] border border-[#e7edf5] bg-white px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <div className="truncate text-sm font-medium text-slate-700">{name}</div>
      <div className="text-sm font-semibold text-slate-900">{score}%</div>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf1f6]">
      <div className="h-full rounded-full bg-[#4f7cff]" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </div>
  </div>
);

export default function ResultsCharts({ examStats }: ResultsChartsProps) {
  if (!examStats) {
    return (
      <section className={cardClass}>
        <span className={badgeClass}>2. Ангийн ерөнхий зураг</span>
        <div className="mt-6 rounded-[20px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-10 text-center text-sm text-slate-400">
          Шалгалт сонгоход энд онооны тархалт болон хариултын ерөнхий байдал харагдана.
        </div>
      </section>
    );
  }

  const totalAnswers = examStats.correctTotal + examStats.incorrectTotal;
  const correctRate = totalAnswers > 0 ? Math.round((examStats.correctTotal / totalAnswers) * 100) : 0;
  const incorrectRate = totalAnswers > 0 ? 100 - correctRate : 0;
  const dominantBand = examStats.performanceBands.reduce<ScoreBand | null>(
    (current, band) => (!current || band.count > current.count ? band : current),
    null,
  );
  const supportBandCount = examStats.performanceBands
    .filter((band) => getBandStart(band.label) < 60)
    .reduce((sum, band) => sum + band.count, 0);
  const answerInsight =
    correctRate >= 75
      ? "Анги нийтээрээ гол ойлголтыг тогтвортой эзэмшиж байна."
      : correctRate >= 60
        ? "Суурь ойлголт байгаа ч зарим асуулт дээр нэмэлт тайлбар хэрэгтэй."
        : "Зөв хариултын хувь сул байгаа тул асуулт, тайлбараа дахин нягтлах хэрэгтэй.";

  const maxScore = Math.max(...examStats.scoreDistribution.map((item) => item.score), 0);
  const minScore = examStats.scoreDistribution.length > 0
    ? Math.min(...examStats.scoreDistribution.map((item) => item.score))
    : 0;

  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={badgeClass}>2. Ангийн ерөнхий зураг</span>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">Оноо болон хариултын төлөв</h3>
          <p className="mt-1 text-sm text-slate-400">
            Аль онооны бүсэд төвлөрч байгааг болон зөв, буруу хариултын ерөнхий балансыг харуулна.
          </p>
        </div>
        {dominantBand && (
          <div className="rounded-full border border-[#e3e8ef] bg-[#fbfcfe] px-3 py-1.5 text-xs font-semibold text-slate-600">
            Ихэнх нь {dominantBand.label} бүсэд байна
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-[20px] border border-[#d9e6fb] bg-white px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ангийн дундаж</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-3xl font-semibold text-slate-900">{examStats.average}%</div>
            <div className="text-xs text-slate-500">Нийт дундаж</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eefb]">
            <div className="h-full rounded-full bg-[#4f7cff]" style={{ width: `${examStats.average}%` }} />
          </div>
        </div>
        <div className="rounded-[20px] border border-[#d9e6fb] bg-white px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ирц</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-3xl font-semibold text-slate-900">{examStats.cohortSize > 0 ? Math.round((examStats.submissionCount / examStats.cohortSize) * 100) : 0}%</div>
            <div className="text-xs text-slate-500">{examStats.submissionCount}/{examStats.cohortSize}</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eefb]">
            <div className="h-full rounded-full bg-[#4f7cff]" style={{ width: `${examStats.cohortSize > 0 ? Math.round((examStats.submissionCount / examStats.cohortSize) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="rounded-[20px] border border-[#d9e6fb] bg-white px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Онооны тархалт</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-3xl font-semibold text-slate-900">{dominantBand?.label ?? "—"}</div>
            <div className="text-xs text-slate-500">Их төвлөрсөн бүс</div>
          </div>
          <div className="mt-3 flex gap-1">
            {examStats.performanceBands.map((band) => {
              const width = examStats.submissionCount > 0 ? Math.max((band.count / examStats.submissionCount) * 100, 8) : 8;
              return (
                <div
                  key={band.label}
                  className="h-2 rounded-full bg-[#4f7cff] opacity-70"
                  style={{ width: `${width}%`, opacity: dominantBand?.label === band.label ? 1 : 0.35 }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[22px] border border-[#d9e6fb] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-5 py-5">
          <h3 className="text-sm font-semibold text-slate-900">Сурагчдын онооны тархалт</h3>
          <p className="mt-1 text-xs text-slate-500">Шалгалт өгсөн сурагч бүрийн хувийн онооны хувийг харуулна.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[#e4ebfb] bg-white px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Хамгийн өндөр</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{maxScore}%</div>
            </div>
            <div className="rounded-[18px] border border-[#e4ebfb] bg-white px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Хамгийн бага</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{minScore}%</div>
            </div>
            <div className="rounded-[18px] border border-[#e4ebfb] bg-white px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Илгээсэн сурагч</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{examStats.scoreDistribution.length}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {examStats.scoreDistribution.length > 0 ? (
              examStats.scoreDistribution.map((item) => (
                <ScoreRow key={`${item.name}-${item.score}`} name={item.name} score={item.score} />
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-[#d5dfeb] px-4 py-6 text-center text-sm text-slate-400">
                Онооны тархалтын өгөгдөл байхгүй.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[22px] border border-[#e3e8ef] bg-[#fcfdff] px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">Онооны тархалт</div>
                <div className="mt-0.5 text-xs text-slate-400">Сурагчид аль онооны бүсэд байгааг бүлгээр нь харууллаа</div>
              </div>
              <span className="rounded-full border border-[#e3e8ef] bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                {examStats.submissionCount} илгээлт
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {examStats.performanceBands.length > 0 ? (
                examStats.performanceBands.map((band) => (
                  <BandRow key={band.label} band={band} total={examStats.submissionCount} />
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-[#d5dfeb] px-4 py-6 text-center text-sm text-slate-400">
                  Онооны тархалтын өгөгдөл байхгүй.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e3e8ef] bg-[#fcfdff] px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Хариултын баланс</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{answerInsight}</div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8eef6]">
              <div className="flex h-full w-full">
                <div className="h-full bg-[#4f7cff]" style={{ width: `${correctRate}%` }} />
                <div className="h-full bg-[#dbe5ff]" style={{ width: `${incorrectRate}%` }} />
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[18px] border border-[#e7edf5] bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Гол зураг</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {dominantBand ? `${dominantBand.label} бүсэд ихэнх нь байна` : "Тархалт хараахан бүрдээгүй"}
                </div>
                <div className="mt-1 text-xs leading-6 text-slate-500">
                  {dominantBand
                    ? `${dominantBand.count} сурагч энэ бүсэд байна. Доод бүсэд ${supportBandCount} сурагч байна.`
                    : "Илгээлт цугларсны дараа илүү тодорхой болно."}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-[#d9e6fb] bg-[#eef4ff] px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3f63dd]">Зөв</div>
                  <div className="mt-2 text-xl font-bold text-slate-900">{correctRate}%</div>
                </div>
                <div className="rounded-[18px] border border-[#d9e6fb] bg-white px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Буруу</div>
                  <div className="mt-2 text-xl font-bold text-slate-900">{incorrectRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
