import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Дүнгийн харагдац</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Graphic chart эсвэл text insight горим сонгоно
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-muted p-1 text-xs">
          <button
            className={`rounded-full px-3 py-1.5 transition ${
              viewMode === "graphic" ? "bg-card font-semibold shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setViewMode("graphic")}
          >
            Graphic
          </button>
          <button
            className={`rounded-full px-3 py-1.5 transition ${
              viewMode === "text" ? "bg-card font-semibold shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setViewMode("text")}
          >
            Text
          </button>
        </div>
      </div>

      {viewMode === "graphic" ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.9fr]">
          <div className={cardClass}>
            <h3 className="text-sm font-semibold">Онооны тархалт</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examStats.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[10, 10, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-sm font-semibold">Зөв ба буруу</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Зөв", value: examStats.correctTotal, fill: "#10b981" },
                      { name: "Буруу", value: examStats.incorrectTotal, fill: "#ef4444" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={4}
                    label
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-sm font-semibold">Score Bands</h3>
            <div className="mt-4 space-y-4">
              {examStats.performanceBands.map((band) => {
                const max = Math.max(examStats.submissionCount, 1);
                const width = Math.round((band.count / max) * 100);

                return (
                  <div key={band.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span>{band.label}</span>
                      <span className="font-semibold">{band.count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: band.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <QuestionInsightList
            items={examStats.mostMissed}
            title="Хамгийн их алдсан 5 асуулт"
            tone="red"
          />
          <QuestionInsightList
            items={examStats.mostCorrect}
            title="Хамгийн их зөв хийсэн 5 асуулт"
            tone="green"
          />
        </div>
      )}
    </section>
  );
}
