import {
  Camera,
  CircleAlert,
  ClipboardX,
  Clock3,
  Info,
  Play,
  RefreshCcw,
} from "lucide-react";
import type { Exam } from "../types";
import { formatDate, gradeFromPercentage } from "../utils";

type JoinExamPanelProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  onLookup: () => void;
  selectedExam?: Exam | null;
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

const infoItems = [
  {
    title: "Буцах",
    description: "Өмнөх рүү буцах боломжгүй",
    icon: RefreshCcw,
    className:
      "border-[#ccd7ff] bg-white text-[#6170dc] shadow-[0_10px_18px_-18px_rgba(97,112,220,0.45)]",
    iconClassName: "text-[#6170dc]",
  },
  {
    title: "Автоматаар илгээх",
    description: "Хугацаа дуусахад автоматаар илгээнэ",
    icon: Clock3,
    className:
      "border-[#ccd7ff] bg-white text-[#6170dc] shadow-[0_10px_18px_-18px_rgba(97,112,220,0.45)]",
    iconClassName: "text-[#6170dc]",
  },
  {
    title: "Хуулах",
    description: "Идэвхгүй",
    icon: ClipboardX,
    className:
      "border-[#f3c8cd] bg-[#fff7f8] text-[#ef6a70] shadow-[0_10px_18px_-18px_rgba(239,106,112,0.45)]",
    iconClassName: "text-[#ef6a70]",
  },
  {
    title: "Камер",
    description: "Шаардлагатай",
    icon: Camera,
    className:
      "border-[#f3c8cd] bg-[#fff7f8] text-[#ef6a70] shadow-[0_10px_18px_-18px_rgba(239,106,112,0.45)]",
    iconClassName: "text-[#ef6a70]",
  },
] as const;

const heroPanelClassName =
  "rounded-[34px] border border-[#dbe3fb] bg-white px-5 py-5 shadow-[0_20px_60px_rgba(80,94,133,0.08)] sm:px-7 sm:py-6 xl:h-[285px] xl:px-4 xl:py-4";

const heroGridClassName =
  "grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_662px] xl:items-center xl:gap-6";

const leftColumnClassName =
  "flex h-full min-h-[220px] w-full max-w-none flex-col justify-center rounded-[28px] bg-white px-1 py-2 sm:px-2 xl:px-0";

const rulesPanelClassName =
  "flex w-full max-w-[662px] flex-col self-center rounded-[24px] border border-[#dfe6fb] bg-[#fbfcff] px-[18px] py-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]";

export default function StudentJoinExamPanel({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinLoading,
  joinError,
  onLookup,
  selectedExam,
  studentHistory,
}: JoinExamPanelProps) {
  if (loading) {
    return (
      <section
        aria-label="student-exams-loading"
        className="mx-auto w-full max-w-[1272px] space-y-8"
      >
        <div className={heroPanelClassName}>
          <div className={heroGridClassName}>
            <div className={leftColumnClassName}>
              <div>
                <div className="h-4 w-28 animate-pulse rounded-full bg-[#eef2fb]" />
                <div className="mt-3 h-10 w-[270px] max-w-full animate-pulse rounded-full bg-[#e4e7f0]" />
              </div>

              <div className="mt-6 w-full max-w-[418px] space-y-4">
                <div className="h-[50px] w-full animate-pulse rounded-[18px] bg-[#eef2fb]" />
                <div className="flex justify-end">
                  <div className="h-[36px] min-w-[182px] animate-pulse rounded-full bg-[#dfe5fb]" />
                </div>
              </div>
            </div>

            <div className={rulesPanelClassName}>
              <div className="h-7 w-[255px] max-w-full animate-pulse rounded-full bg-[#e4e7f0]" />

              <div className="mt-5 border-t border-[#dfe6fb] pt-5">
                <div className="grid gap-x-[18px] gap-y-[16px] sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[64px] rounded-[14px] border border-[#dbe3fb] bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-[18px] w-[18px] animate-pulse rounded-full bg-[#eef2fb]" />
                        <div className="h-4 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                      </div>
                      <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-[#eef2fb]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#e6ecfb] bg-[#f8fbff] p-4">
          <div className="h-5 w-28 animate-pulse rounded-full bg-[#e4e7f0]" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-4 w-full animate-pulse rounded-full bg-[#eef2fb]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1272px] space-y-8">
      <div className={heroPanelClassName}>
        <div className={heroGridClassName}>
          <div className={leftColumnClassName}>
            <div>
              <div className="text-[15px] font-medium text-[#aeb9d6]">
                Шалгалтын мэдээлэл
              </div>
              <h2 className="mt-2 text-[2.15rem] font-semibold tracking-[-0.055em] text-[#5564d9] sm:text-[2.5rem]">
                Шалгалтад нэвтрэх
              </h2>
            </div>

            <div className="mt-6 w-full max-w-[418px] space-y-4">
              <input
                className="h-[46px] w-full rounded-[18px] border border-[#dfe5fb] bg-[#fbfcff] px-5 text-[15px] font-medium text-slate-800 outline-none transition placeholder:text-[#adb7cf] focus:border-[#aab7ff] focus:bg-white"
                placeholder="Өрөөний код"
                value={roomCodeInput}
                onChange={(event) =>
                  setRoomCodeInput(event.target.value.toUpperCase())
                }
              />

              <div className="flex justify-end">
                <button
                  className={`inline-flex h-[36px] min-w-[182px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6354ee] to-[#4f4be4] px-5 text-[13px] font-semibold text-white shadow-[0_20px_42px_rgba(96,84,228,0.28)] transition hover:brightness-105 ${
                    joinLoading ? "opacity-70" : ""
                  }`}
                  onClick={onLookup}
                  disabled={joinLoading}
                >
                  <Play className="h-[18px] w-[18px]" />
                  {joinLoading ? "Нэвтэрч байна..." : "Шалгалтад нэвтрэх"}
                </button>
              </div>

              {joinError && (
                <div className="rounded-[18px] border border-[#ffd4d4] bg-[#fff7f7] px-4 py-3 text-sm text-[#e45d5d]">
                  {joinError}
                </div>
              )}
            </div>
          </div>

          <div className={rulesPanelClassName}>
            <div className="flex items-center gap-2.5 text-[1rem] font-semibold text-[#4f5fc7]">
              <CircleAlert className="h-[18px] w-[18px]" />
              Шалгалтын дүрэм ба мэдээлэл
            </div>

            <div className="mt-5 border-t border-[#dfe6fb] pt-5">
              <div className="grid gap-x-[18px] gap-y-[16px] sm:grid-cols-2">
                {infoItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className={`flex min-h-[66px] flex-col justify-center rounded-[12px] border px-4 py-3 ${item.className}`}
                    >
                      <div className="flex items-center gap-2 text-[14px] font-semibold leading-none">
                        <Icon className={`h-[16px] w-[16px] ${item.iconClassName}`} />
                        {item.title}
                      </div>
                      <div className="mt-1 text-[11px] leading-[1.2] text-slate-400">
                        {item.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#e6ecfb] bg-[#f8fbff] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Info className="h-4 w-4 text-[#62a9ff]" />
          Эхлэхийн өмнө
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-500">
          <li>Шалгалтын дүрэм, хугацаагаа урьдчилан шалгаарай.</li>
          <li>Бүтэн дэлгэц ба хуулалтын эсрэг хамгаалалт автоматаар асна.</li>
          <li>Шалгалт эхэлмэгц хариултууд автоматаар хадгалагдана.</li>
          {selectedExam?.requiresAudioRecording && (
            <li>Микрофоны хяналтын аудио бичлэг шаардлагатай.</li>
          )}
        </ul>
      </div>

      <div className="rounded-[30px] border border-[#e8edf9] bg-white p-6 shadow-[0_22px_55px_rgba(68,84,125,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Өмнөх шалгалтууд
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {studentHistory.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d7def4] bg-[#fafbff] px-5 py-8 text-sm text-slate-400">
              Одоогоор өмнөх шалгалтын түүх алга байна.
            </div>
          ) : (
            studentHistory.map((item) => {
              const score = item.score ?? Math.round(item.percentage);
              const totalPoints = item.totalPoints ?? 100;
              const grade = item.grade ?? gradeFromPercentage(item.percentage);

              return (
                <div
                  key={`${item.examId}-${item.date}`}
                  className="rounded-[22px] border border-[#e7ecfb] bg-[#fafcff] px-5 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#5c63ce]">
                        {grade}
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {score}/{totalPoints}
                      </div>
                      <div className="text-sm text-slate-400">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
