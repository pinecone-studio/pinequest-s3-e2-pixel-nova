import { examTypes } from "./exam-schedule-constants";

type ExamScheduleTypeSelectorProps = {
  scheduleExamType: string;
  setScheduleExamType: (value: string) => void;
};

export default function ExamScheduleTypeSelector({
  scheduleExamType,
  setScheduleExamType,
}: ExamScheduleTypeSelectorProps) {
  return (
    <div className="grid gap-4">
      <div className="text-[16px] font-semibold text-black">Төрөл</div>
      <div className="flex flex-wrap items-center gap-[30px]">
        {examTypes.map((item) => {
          const checked = scheduleExamType === item.value;
          return (
            <button
              key={item.value}
              className="inline-flex items-center gap-[10px]"
              onClick={() => setScheduleExamType(item.value)}
              type="button"
            >
              <span
                className={`grid size-5 place-items-center rounded-full border-[2.5px] ${
                  checked ? "border-[#2563eb]" : "border-[#bbbbbb]"
                }`}
              >
                {checked && (
                  <span className="size-2 rounded-full bg-[#2563eb]" />
                )}
              </span>
              <span className="text-[14px] font-medium text-black">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
