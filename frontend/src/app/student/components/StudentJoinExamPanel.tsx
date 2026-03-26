import { Info, Play } from "lucide-react";
import { formatDate, gradeFromPercentage } from "../utils";

type JoinExamPanelProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  onLookup: () => void;
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

export default function StudentJoinExamPanel({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinLoading,
  joinError,
  onLookup,
  studentHistory,
}: JoinExamPanelProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-[30px] border border-[#e8edf9] bg-white p-6 shadow-[0_22px_55px_rgba(68,84,125,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Шалгалтын мэдээлэл
        </div>
        <div className="mt-5">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">
            Дараагийн шалгалтад нэвтрэх
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Өрөөний кодоо оруулаад шалгалтын мэдээллээ шалгана уу.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Өрөөний код
          </label>
          <input
            className="w-full rounded-2xl border border-[#dbe5ff] bg-[#fbfcff] px-4 py-3 text-base font-medium tracking-[0.18em] text-slate-900 uppercase outline-none transition focus:border-[#7aa5ff] focus:bg-white"
            placeholder="AX7K2P"
            value={roomCodeInput}
            onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
          />
          <button
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5c4fe6] to-[#5148df] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(92,79,230,0.25)] transition hover:brightness-105 ${joinLoading ? "opacity-70" : ""}`}
            onClick={onLookup}
            disabled={joinLoading}
          >
            {joinLoading ? "Уншиж байна..." : "Шалгалт шалгах"}
            <Play className="h-4 w-4" />
          </button>
          {joinError && (
            <div className="rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm text-[#e45d5d]">
              {joinError}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[24px] border border-[#e6ecfb] bg-[#f8fbff] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Info className="h-4 w-4 text-[#62a9ff]" />
            Эхлэхийн өмнө
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Шалгалтын дүрэм, хугацааг урьдчилан шалгаарай.</li>
            <li>Бүтэн дэлгэц ба хуулалтын эсрэг хамгаалалт автоматаар асна.</li>
            <li>Шалгалт эхэлмэгц хариултууд автоматаар хадгалагдана.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[30px] border border-[#e8edf9] bg-white p-6 shadow-[0_22px_55px_rgba(68,84,125,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Өмнөх шалгалтууд
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Дүн гарсан шалгалтууд энд харагдана.
            </p>
          </div>
          <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#5c6cff]">
            {studentHistory.length} шалгалт
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[92px] animate-pulse rounded-[24px] border border-[#e8edf9] bg-[#f8faff]"
              />
            ))}

          {!loading && studentHistory.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-[#dbe3f6] bg-[#fbfcff] px-5 py-8 text-center text-sm text-slate-400">
              Дүн гарсан шалгалт хараахан алга.
            </div>
          )}

          {!loading &&
            studentHistory.map((exam) => {
              const grade = exam.grade ?? gradeFromPercentage(exam.percentage);

              return (
                <div
                  key={`${exam.examId}-${exam.date}`}
                  className="rounded-[24px] border border-[#e8edf9] bg-[#fbfcff] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {exam.title}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span>{formatDate(exam.date)}</span>
                        <span>
                          Оноо {exam.score ?? "—"}/{exam.totalPoints ?? "—"}
                        </span>
                        <span>{exam.percentage}%</span>
                      </div>
                    </div>
                    <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {grade}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
