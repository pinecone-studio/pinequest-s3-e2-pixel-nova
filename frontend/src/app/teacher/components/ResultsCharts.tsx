import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cardClass } from "../styles";

type ResultsChartsProps = {
  examStats: {
    scoreDistribution: { name: string; score: number }[];
    correctTotal: number;
    incorrectTotal: number;
  } | null;
};

export default function ResultsCharts({ examStats }: ResultsChartsProps) {
  if (!examStats) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="text-sm font-semibold">Онооны тархалт</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={examStats.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="text-sm font-semibold">Зөв / Буруу</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Зөв", value: examStats.correctTotal },
                  { name: "Буруу", value: examStats.incorrectTotal },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="hsl(var(--primary))"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
