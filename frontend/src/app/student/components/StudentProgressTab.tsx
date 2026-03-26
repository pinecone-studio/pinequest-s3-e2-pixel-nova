import { BarChart3, GraduationCap, Sparkles } from "lucide-react";
import StudentResultsTab from "./StudentResultsTab";

type StudentProgressTabProps = {
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  progressSegments: number;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
};

export default function StudentProgressTab({
  levelInfo,
  studentProgress,
  nextLevel,
  progressSegments,
  studentHistory,
}: StudentProgressTabProps) {
  const averageScore = studentHistory.length
    ? Math.round(
        studentHistory.reduce((sum, item) => sum + item.percentage, 0) /
          studentHistory.length,
      )
    : 0;

  return (
    <div className="space-y-5">
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef1ff] text-[#5c6cff]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Current level</div>
              <div className="text-2xl font-semibold text-slate-900">
                Level {levelInfo.level}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4eb] text-[#ff8a3d]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Total XP</div>
              <div className="text-2xl font-semibold text-slate-900">
                {studentProgress.xp.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${
                  index < progressSegments ? "bg-[#5c6cff]" : "bg-[#eceef7]"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {Math.max(nextLevel.minXP - studentProgress.xp, 0)} XP to next level
          </div>
        </div>

        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9fbf3] text-[#31966c]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Average score</div>
              <div className="text-2xl font-semibold text-slate-900">
                {averageScore}%
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Based on {studentHistory.length} graded exam
            {studentHistory.length === 1 ? "" : "s"}.
          </div>
        </div>
      </section>

      <StudentResultsTab studentHistory={studentHistory} />
    </div>
  );
}
