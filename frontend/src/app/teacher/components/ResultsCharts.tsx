import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cardClass } from "../styles";
import type { ExamStatsSummary, QuestionInsight } from "../types";

type ResultsChartsProps = {
  examStats: ExamStatsSummary | null;
};

type ViewMode = "graphic" | "text";

function QuestionInsightList({
  items,
  title,
  tone,
}: {
  items: QuestionInsight[];
  title: string;
  tone: "red" | "green";
}) {
  const toneClasses =
    tone === "red"
      ? {
          wrapper: "border-red-500/10 bg-red-500/5",
          text: "text-red-600 dark:text-red-300",
          bar: "bg-linear-to-r from-red-500 to-orange-400",
        }
      : {
          wrapper: "border-emerald-500/10 bg-emerald-500/5",
          text: "text-emerald-600 dark:text-emerald-300",
          bar: "bg-linear-to-r from-emerald-500 to-teal-400",
        };

  return (
    <div className={`${cardClass} ${toneClasses.wrapper}`}>
      <h3 className={`text-sm font-semibold ${toneClasses.text}`}>{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-6 text-sm text-muted-foreground">
            Өгөгдөл алга.
          </div>
        )}
        {items.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-border bg-background/80 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">#{index + 1}</div>
                <div className="mt-1 text-sm font-medium">{item.text}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{item.correctRate}%</div>
                <div className="text-[11px] text-muted-foreground">
                  {item.correctCount}/{item.total}
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${toneClasses.bar}`}
                style={{ width: `${item.correctRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsCharts({ examStats }: ResultsChartsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("graphic");

  if (!examStats) return null;

  const mostMissedQuestions = examStats.mostMissed
    .filter((question) => Number(question.missCount ?? 0) > 0)
    .slice(0, 2);
  const mostCorrectQuestions = examStats.mostCorrect
    .filter((question) => Number(question.correctCount ?? 0) > 0)
    .slice(0, 2);
  const questionRateCards = examStats.questionStats.map((question, index) => ({
    ...question,
    label: `А${index + 1}`,
  }));

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Дүнгийн харагдац</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            График эсвэл текстэн задлан харах горимоо сонгоно
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-muted p-1 text-xs">
          <button
            className={`rounded-full px-3 py-1.5 transition ${
              viewMode === "graphic" ? "bg-card font-semibold shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setViewMode("graphic")}
          >
            График
          </button>
          <button
            className={`rounded-full px-3 py-1.5 transition ${
              viewMode === "text" ? "bg-card font-semibold shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setViewMode("text")}
          >
            Текст
          </button>
        </div>
      </div>

      {viewMode === "graphic" ? (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className={`${cardClass} border border-[#d9e6fb] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]`}>
            <h3 className="text-sm font-semibold text-slate-900">Сурагчдын онооны тархалт</h3>
            <p className="mt-1 text-xs text-slate-500">
              Шалгалт өгсөн сурагч бүрийн хувийн онооны хувийг харуулна.
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examStats.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8e4f5" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    domain={[0, 100]}
                    tickCount={6}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="score" radius={[10, 10, 0, 0]} fill="#4f7cff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${cardClass} border border-[#d9e6fb] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]`}>
            <h3 className="text-sm font-semibold text-slate-900">Асуулт тус бүрийн зөв хариулсан хувь</h3>
            <p className="mt-1 text-xs text-slate-500">
              Сурагчдын хэдэн хувь нь тухайн асуултыг зөв хийснийг харуулна.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {questionRateCards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dce8f8] bg-white/85 px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2">
                  Асуултын гүйцэтгэлийн өгөгдөл алга.
                </div>
              )}
              {questionRateCards.map((question) => (
                <div
                  key={question.id}
                  className="rounded-[22px] border border-[#dce8f8] bg-white/90 px-4 py-4 shadow-[0_14px_30px_-26px_rgba(20,184,166,0.35)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {question.label}
                      </div>
                      <div
                        className="mt-1 break-words text-sm font-semibold leading-7 text-slate-900 line-clamp-3"
                        title={question.text}
                      >
                        {question.text}
                      </div>
                    </div>
                    <div
                      className="grid h-20 w-20 shrink-0 place-items-center rounded-full sm:h-24 sm:w-24"
                      style={{
                        background: `conic-gradient(#14b8a6 ${question.correctRate * 3.6}deg, #d9f3ef 0deg)`,
                      }}
                    >
                      <div className="grid h-14 w-14 place-items-center rounded-full border border-[#dce8f8] bg-white text-sm font-semibold text-slate-900 sm:h-16 sm:w-16">
                        {question.correctRate}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{question.correctCount}/{question.total} сурагч зөв хийсэн</span>
                    <span>{question.missCount} алдсан</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <QuestionInsightList
            items={mostMissedQuestions}
            title="Хамгийн их алдсан асуултууд"
            tone="red"
          />
          <QuestionInsightList
            items={mostCorrectQuestions}
            title="Хамгийн их зөв хийсэн асуултууд"
            tone="green"
          />
        </div>
      )}
    </section>
  );
}
