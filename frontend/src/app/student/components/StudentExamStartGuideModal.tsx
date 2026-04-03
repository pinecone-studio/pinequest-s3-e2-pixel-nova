import {
  ArrowLeftRight,
  Check,
  Clipboard,
  ClipboardX,
  X,
} from "lucide-react";

type StudentExamStartGuideModalProps = {
  open: boolean;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onClose: () => void;
  onStart: () => void;
  submitting?: boolean;
};

const guideSteps = [
  {
    title: "Камер нээх",
    description:
      "Камер асаалттай байх бөгөөд нүүр тань тод, бүтэн харагдах шаардлагатай.",
    illustrationTone: "camera" as const,
  },
  {
    title: "Шалгалт илгээгдэх",
    description:
      "Хугацаа дуусах үед таны оруулсан хариулт системд автоматаар илгээгдэнэ.",
    illustrationTone: "submit" as const,
  },
  {
    title: "Дэлгэц солих",
    description:
      "Цонх сольсон тохиолдолд шалгалт хүчингүйд тооцогдож болзошгүй.",
    illustrationTone: "switch" as const,
  },
  {
    title: "Хуулах, буулгах",
    description:
      "Шалгалтын үед текстийг copy эсвэл paste үйлдэл хийх боломжгүй.",
    illustrationTone: "clipboard" as const,
  },
] as const;

export const STUDENT_EXAM_START_GUIDE_STEP_COUNT = guideSteps.length;

function GuideIllustration({
  tone,
}: {
  tone: (typeof guideSteps)[number]["illustrationTone"];
}) {
  if (tone === "camera") {
    return (
      <div className="relative mx-auto h-[206px] w-full max-w-[250px]">
        <div className="absolute left-0 top-0 h-[146px] w-[146px] rounded-[30px] border border-[#dde4f1] bg-white p-3 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.32)]">
          <div className="grid h-full place-items-center rounded-[22px] bg-[#f5f7fb]">
            <div className="relative h-[86px] w-[72px]">
              <div className="absolute left-[16px] top-0 h-[44px] w-[34px] rounded-t-[18px] rounded-b-[14px] bg-[#101124]" />
              <div className="absolute left-[9px] top-[35px] h-[38px] w-[50px] rounded-[18px] bg-[#101124]" />
              <div className="absolute bottom-0 left-[8px] h-[36px] w-[56px] rounded-t-[26px] bg-[#446be8]" />
            </div>
          </div>
          <div className="absolute right-[-10px] top-[44px] grid h-11 w-11 place-items-center rounded-full bg-[#4ed07c] text-white shadow-[0_18px_30px_-18px_rgba(78,208,124,0.8)]">
            <Check className="h-6 w-6" />
          </div>
        </div>

        <div className="absolute bottom-[4px] right-0 h-[124px] w-[124px] rounded-[24px] border border-[#edf0f6] bg-white/75 p-3 opacity-70 blur-[0.2px] shadow-[0_18px_30px_-26px_rgba(15,23,42,0.2)]">
          <div className="grid h-full place-items-center rounded-[18px] bg-[#f3f4f8]">
            <div className="h-[64px] w-[52px] rounded-[18px] bg-[#d8dce6]" />
          </div>
          <div className="absolute right-[12px] top-[42px] grid h-10 w-10 place-items-center rounded-full bg-[#ff5d5d] text-white">
            <X className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  if (tone === "submit") {
    return (
      <div className="relative mx-auto h-[206px] w-full max-w-[250px]">
        <div className="absolute left-[26px] top-[56px] h-[128px] w-[120px] rounded-[28px] bg-[#eef2f8]" />
        <div className="absolute left-[54px] top-[78px] h-[110px] w-[96px] rounded-[20px] bg-[#446be8]" />
        <div className="absolute bottom-[4px] left-[104px] h-[22px] w-[22px] rounded-full bg-[#f6b4aa]" />
        <div className="absolute left-[20px] top-[20px] flex h-[64px] w-[198px] rotate-[-11deg] items-center gap-3 rounded-[18px] border-2 border-[#3d4352] bg-white px-4 shadow-[0_20px_36px_-30px_rgba(15,23,42,0.34)]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#446be8] text-white">
            <Check className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="h-2.5 w-[72px] rounded-full bg-[#446be8]" />
            <div className="mt-2 h-2.5 w-[48px] rounded-full bg-[#6c8cf1]" />
          </div>
        </div>
      </div>
    );
  }

  if (tone === "switch") {
    return (
      <div className="relative mx-auto h-[206px] w-full max-w-[250px]">
        <div className="mx-auto grid h-full place-items-center">
          <div className="grid h-[66px] w-[66px] place-items-center rounded-full bg-[#446be8] text-white shadow-[0_20px_34px_-24px_rgba(68,107,232,0.72)]">
            <X className="h-9 w-9" />
          </div>
          <div className="absolute bottom-[34px] left-[14px] h-[102px] w-[76px] rounded-[12px] border border-[#bcc5d5] bg-white p-3 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.2)]">
            <div className="text-[10px] font-semibold text-slate-600">Chat GPT</div>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 rounded-full bg-[#eceef3]" />
              <div className="h-1.5 rounded-full bg-[#eceef3]" />
              <div className="h-1.5 rounded-full bg-[#eceef3]" />
              <div className="h-1.5 rounded-full bg-[#eceef3]" />
            </div>
          </div>
          <div className="absolute bottom-[34px] right-[14px] h-[102px] w-[102px] rounded-[12px] border border-[#bcc5d5] bg-white p-3 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.2)]">
            <div className="text-[10px] font-semibold text-slate-600">Шалгалт</div>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 rounded-full bg-[#446be8]" />
              <div className="h-1.5 rounded-full bg-[#446be8]" />
              <div className="h-1.5 rounded-full bg-[#446be8]" />
              <div className="h-1.5 rounded-full bg-[#446be8]" />
              <div className="h-1.5 rounded-full bg-[#446be8]" />
            </div>
          </div>
          <ArrowLeftRight className="absolute bottom-[70px] h-9 w-9 text-[#446be8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[206px] w-full max-w-[250px]">
      <div className="absolute left-[14px] top-[22px] h-[146px] w-[114px] rounded-[22px] bg-[#446be8] p-4 text-white shadow-[0_24px_38px_-28px_rgba(68,107,232,0.65)]">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/16">
          <Clipboard className="h-6 w-6" />
        </div>
        <div className="mt-7 space-y-2">
          <div className="h-2 rounded-full bg-white/80" />
          <div className="h-2 w-4/5 rounded-full bg-white/65" />
          <div className="h-2 w-3/5 rounded-full bg-white/50" />
        </div>
      </div>
      <div className="absolute right-[14px] top-[36px] h-[126px] w-[118px] rounded-[20px] border border-[#e0e6f4] bg-white p-4 shadow-[0_20px_34px_-28px_rgba(15,23,42,0.28)]">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef2ff] text-[#446be8]">
          <ClipboardX className="h-5 w-5" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-2 rounded-full bg-[#446be8]" />
          <div className="h-2 w-4/5 rounded-full bg-[#8da7f8]" />
          <div className="h-2 w-3/5 rounded-full bg-[#cdd9ff]" />
        </div>
      </div>
      <div className="absolute bottom-[26px] left-[116px] grid h-12 w-12 place-items-center rounded-full border border-[#d7dff0] bg-white text-[#446be8] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.25)]">
        <ArrowLeftRight className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function StudentExamStartGuideModal({
  open,
  stepIndex,
  totalSteps,
  onNext,
  onClose,
  onStart,
  submitting = false,
}: StudentExamStartGuideModalProps) {
  if (!open) return null;

  const safeTotalSteps = Math.max(1, Math.min(totalSteps, guideSteps.length));
  const safeIndex = Math.min(Math.max(stepIndex, 0), safeTotalSteps - 1);
  const step = guideSteps[safeIndex];
  const isLastStep = safeIndex === safeTotalSteps - 1;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.56)] px-4 py-6 backdrop-blur-[8px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-exam-start-guide-title"
        className="w-full max-w-[390px] rounded-[34px] border border-white/65 bg-white p-5 shadow-[0_34px_90px_-36px_rgba(15,23,42,0.48)]"
      >
        <div className="rounded-[28px] bg-[linear-gradient(180deg,#f7faff_0%,#ffffff_100%)] px-6 py-7 text-center">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-[#97a5c2]">
            <span>Шалгалтын заавар</span>
            <span>
              {safeIndex + 1}/{safeTotalSteps}
            </span>
          </div>

          <div className="mt-4 rounded-[28px] border border-[#e4ebf6] bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
            <GuideIllustration tone={step.illustrationTone} />
          </div>

          <h2
            id="student-exam-start-guide-title"
            className="mt-6 text-[24px] font-semibold tracking-[-0.04em] text-[#446be8]"
          >
            {step.title}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-700">
            {step.description}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2.5">
            {guideSteps.slice(0, safeTotalSteps).map((_, index) => (
              <span
                key={index}
                className={`h-2.5 rounded-full transition-all ${
                  index === safeIndex
                    ? "w-6 bg-[#2f66ef]"
                    : "w-2.5 bg-[#d9dee8]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[96px_1fr] gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-[16px] border border-[#d8e1f0] bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={isLastStep ? onStart : onNext}
            disabled={submitting}
            className="rounded-[16px] bg-[#446be8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#355cde] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLastStep
              ? submitting
                ? "Эхлүүлж байна..."
                : "Эхлүүлэх"
              : "Цааш"}
          </button>
        </div>
      </div>
    </div>
  );
}
