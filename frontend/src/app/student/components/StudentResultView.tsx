import { useEffect } from "react";
import {
  BadgeCheck,
  Clock3,
  Home,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import MathText from "@/components/MathText";
import MongolianText from "@/components/MongolianText";
import { hasTraditionalMongolian } from "@/lib/mongolian-script";
import type { Submission } from "../types";

type AnswerReportItem = {
  question: { id: string; text: string; correctAnswer: string };
  answer: string;
  correct: boolean;
};

type StudentResultViewProps = {
  lastSubmission: Submission | null;
  answerReport: AnswerReportItem[];
  resultPending: boolean;
  resultCountdown: string;
  resultReleaseAt: string | null;
  onBack: () => void;
};

function SummaryMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "success";
}) {
  const toneClassName =
    tone === "primary"
      ? "border-[#cfdcff] bg-[#edf3ff] text-[#355cde]"
      : tone === "success"
        ? "border-[#d8efb8] bg-[#f6ffe8] text-[#79a82f]"
        : "border-[#e5eaf3] bg-[#f8faff] text-slate-900";

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${toneClassName}`}>
      <div className="text-xs font-medium uppercase tracking-[0.18em] opacity-70">
        {label}
      </div>
      <div className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em]">
        {value}
      </div>
    </div>
  );
}

export default function StudentResultView({
  lastSubmission,
  answerReport,
  resultPending,
  resultCountdown,
  resultReleaseAt,
  onBack,
}: StudentResultViewProps) {
  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, []);

  const answeredCount = answerReport.filter((item) => item.answer?.trim()).length;
  const correctCount = answerReport.filter((item) => item.correct).length;
  const incorrectCount = Math.max(answerReport.length - correctCount, 0);
  const attemptedRate =
    answerReport.length > 0 ? Math.round((answeredCount / answerReport.length) * 100) : 0;
  const percentage = lastSubmission?.percentage ?? 0;
  const summaryMessage =
    percentage >= 90
      ? "Маш сайн. Энэ гүйцэтгэлээ тогтвортой хадгалаарай."
      : percentage >= 70
        ? "Сайн байна. Алдсан асуултуудаа давтаад дараагийн удаа ахиулж чадна."
        : "Суурь ойлголтоо дахин бататгаад буруу асуултуудаа давтан ажиллаарай.";

  if (resultPending || !lastSubmission) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef4ff_0%,#f5f7fb_34%,#eef2f8_100%)] px-4 pb-10 pt-6 text-slate-900 sm:px-6">
        <div className="mx-auto w-full max-w-[430px]">
          <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(243,247,255,0.88)_100%)] p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)]">
            <div className="rounded-[30px] border border-[#e5eaf3] bg-white px-5 pb-6 pt-4 text-slate-900">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-semibold tracking-[-0.02em]">
                  shalgalt
                </div>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-[#f5f7fb] hover:text-slate-800"
                  onClick={onBack}
                  aria-label="Дүнгийн дэлгэц хаах"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mt-6 rounded-[28px] border border-[#e5ebf5] bg-[#f8fbff] px-5 py-6 text-center">
                <div className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-[#4b6fe8] shadow-[0_24px_40px_-28px_rgba(75,111,232,0.55)]">
                  <Clock3 className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-[1.85rem] font-semibold tracking-[-0.05em] text-slate-900">
                  {resultPending
                    ? "Шалгалт дуусахыг хүлээж байна..."
                    : "Дүн боловсруулж байна..."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {resultPending
                    ? "Шалгалт дууссаны дараа үр дүн харагдана. Хугацаа дуусах хүртэл хүлээнэ үү."
                    : "Хэсэг хүлээнэ үү. Хэрэв энэ дэлгэц удаан үргэлжилбэл самбар руу буцаад дахин орж үзнэ үү."}
                </p>
              </div>

              {resultPending && (
                <div className="mt-5 rounded-[24px] border border-[#e5eaf3] bg-[#fbfcff] px-4 py-4">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#a3afc6]">
                    Үлдсэн хугацаа
                  </div>
                  <div className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-900">
                    {resultCountdown}
                  </div>
                  {resultReleaseAt && (
                    <div className="mt-2 text-sm text-slate-500">
                      Дуусах цаг: {new Date(resultReleaseAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <button
                className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#4b6fe8] px-4 text-sm font-semibold text-white shadow-[0_20px_34px_-24px_rgba(75,111,232,0.6)] transition hover:brightness-105"
                onClick={onBack}
              >
                <Home className="h-[18px] w-[18px]" />
                Самбар руу буцах
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef4ff_0%,#f5f7fb_34%,#eef2f8_100%)] px-4 pb-10 pt-6 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(243,247,255,0.88)_100%)] p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)]">
          <div className="rounded-[30px] border border-[#e5eaf3] bg-white px-5 pb-6 pt-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">
                shalgalt
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-[#f5f7fb] hover:text-slate-800"
                onClick={onBack}
                aria-label="Дүнгийн дэлгэц хаах"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-[28px] border border-[#e4ebf6] bg-[linear-gradient(180deg,#fcfdff_0%,#f6f9ff_100%)] px-5 py-6 text-center">
              <div className="absolute left-4 top-4 h-16 w-16 rounded-full bg-[#edf3ff]" />
              <div className="absolute bottom-4 right-4 h-20 w-20 rounded-full bg-[#f4ffe8]" />
              <div className="relative mx-auto grid h-[82px] w-[82px] place-items-center rounded-full bg-white text-[#4b6fe8] shadow-[0_26px_42px_-26px_rgba(75,111,232,0.58)]">
                <BadgeCheck className="h-10 w-10" />
              </div>
              <div className="relative mt-5 flex items-center justify-center gap-2 text-[#4b6fe8]">
                <Sparkles className="h-[18px] w-[18px]" />
                <Trophy className="h-[18px] w-[18px]" />
                <Sparkles className="h-[18px] w-[18px]" />
              </div>
              <h2 className="relative mt-4 text-[1.85rem] font-semibold tracking-[-0.05em] text-slate-900">
                Та шалгалтаа амжилттай дуусгалаа!
              </h2>
              <p className="relative mt-3 text-sm leading-6 text-slate-500">
                {summaryMessage}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryMetric
                label="Нийт оноо"
                value={`${lastSubmission.score ?? 0}/${lastSubmission.totalPoints ?? 0}`}
                tone="primary"
              />
              <SummaryMetric label="Дүн" value={`${percentage}%`} tone="success" />
              <SummaryMetric label="Зөв / Буруу" value={`${correctCount}/${incorrectCount}`} />
              <SummaryMetric label="Хариулсан хувь" value={`${attemptedRate}%`} />
            </div>

            <div className="mt-5 rounded-[24px] border border-[#e5eaf3] bg-[#fbfcff] px-4 py-4">
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                <span>Ахицын тойм</span>
                <span>
                  {answeredCount}/{answerReport.length || 0} асуулт
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#ebeff6]">
                <div
                  className="h-full rounded-full bg-[#9fb7f7] transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, attemptedRate))}%` }}
                />
              </div>
            </div>

            <button
              className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#4b6fe8] px-4 text-sm font-semibold text-white shadow-[0_20px_34px_-24px_rgba(75,111,232,0.6)] transition hover:brightness-105"
              onClick={onBack}
            >
              <Home className="h-[18px] w-[18px]" />
              Самбар руу буцах
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[30px] border border-[#e5eaf3] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)]">
          <h3 className="text-sm font-semibold text-slate-900">Асуултын тайлан</h3>
          <div className="mt-4 space-y-3 text-sm">
            {answerReport.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#dbe3ef] bg-[#fbfcff] px-4 py-6 text-center text-slate-400">
                Асуултын тайлан хараахан алга.
              </div>
            ) : (
              answerReport.map((item, idx) => (
                <div
                  key={item.question.id}
                  className="rounded-[22px] border border-[#e5eaf3] bg-[#fbfcff] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-1">
                      <span>{idx + 1}.</span>
                      {hasTraditionalMongolian(item.question.text) ? (
                        <MongolianText
                          text={item.question.text}
                          className="flex-1"
                        />
                      ) : (
                        <MathText text={item.question.text} className="flex-1" />
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.correct
                          ? "bg-[#eefcf3] text-emerald-600"
                          : "bg-[#fff3f3] text-red-600"
                      }`}
                    >
                      {item.correct ? "Зөв" : "Буруу"}
                    </span>
                  </div>

                  {!item.correct && (
                    <div className="mt-2 flex flex-wrap items-start gap-1 text-xs text-slate-500">
                      <span>Зөв хариулт:</span>
                      {hasTraditionalMongolian(item.question.correctAnswer) ? (
                        <MongolianText
                          text={item.question.correctAnswer}
                          className="inline-flex"
                        />
                      ) : (
                        <MathText
                          text={item.question.correctAnswer}
                          className="inline-flex"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
