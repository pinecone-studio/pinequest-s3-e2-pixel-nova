import { inputClass } from "../../styles";

type ExamMetaFieldsProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
};

export default function ExamMetaFields({
  examTitle,
  setExamTitle,
}: ExamMetaFieldsProps) {
  return (
    <div className="rounded-[24px] border border-[#e8edf5] bg-white px-5 py-5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.18)]">
      <label className="grid gap-3">
        <span className="text-sm font-semibold text-slate-800">
          Гарчиг оруулна уу
        </span>
        <input
          className={`${inputClass} h-14 rounded-[20px] border-[#e2e8f0] bg-[#fcfdff] text-base`}
          placeholder="Шалгалтын нэр"
          value={examTitle ?? ""}
          onChange={(event) => setExamTitle(event.target.value)}
        />
        <span className="text-xs text-slate-400">
          Тайлбар оруулна уу (заавал биш)
        </span>
      </label>
    </div>
  );
}
