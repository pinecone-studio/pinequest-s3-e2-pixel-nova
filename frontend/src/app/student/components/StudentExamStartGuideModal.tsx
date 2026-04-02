import { Camera, ClipboardX, MonitorSmartphone, Send } from "lucide-react";

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
    icon: Camera,
  },
  {
    title: "Шалгалт илгээгдэх",
    description:
      "Хугацаа дуусах үед таны оруулсан хариулт системд автоматаар илгээгдэнэ.",
    icon: Send,
  },
  {
    title: "Дэлгэц солих",
    description:
      "Цонх сольсон тохиолдолд шалгалт хүчингүйд тооцогдож болзошгүй.",
    icon: MonitorSmartphone,
  },
  {
    title: "Copy Paste хийх",
    description:
      "Шалгалтын үед текстийг copy эсвэл paste үйлдэл хийх боломжгүй.",
    icon: ClipboardX,
  },
] as const;

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

  const safeIndex = Math.min(Math.max(stepIndex, 0), guideSteps.length - 1);
  const step = guideSteps[safeIndex];
  const isLastStep = safeIndex === totalSteps - 1;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.58)] px-4 py-6 backdrop-blur-[6px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-exam-start-guide-title"
        className="w-full max-w-[360px] rounded-[30px] bg-white p-5 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.4)]"
      >
        <div className="rounded-[24px] bg-[linear-gradient(180deg,#f7faff_0%,#ffffff_100%)] px-6 py-8 text-center">
          <div className="mx-auto grid size-[132px] place-items-center rounded-[28px] bg-[#f2f6ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="grid size-[84px] place-items-center rounded-[24px] bg-[#2f66ef] text-white shadow-[0_18px_34px_-18px_rgba(47,102,239,0.75)]">
              <Icon className="size-10" />
            </div>
          </div>

          <h2
            id="student-exam-start-guide-title"
            className="mt-7 text-[24px] font-semibold tracking-[-0.03em] text-[#2f66ef]"
          >
            {step.title}
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-slate-800">
            {step.description}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {guideSteps.map((_, index) => (
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
            className="rounded-[16px] border border-[#d8e1f0] bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbff]"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={isLastStep ? onStart : onNext}
            disabled={submitting}
            className="rounded-[16px] bg-[#2f66ef] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2557d0] disabled:cursor-not-allowed disabled:opacity-70"
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
