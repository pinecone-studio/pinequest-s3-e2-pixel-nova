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
          className={` h-14 border-b-2 border-[#d3d7d8] text-base px-3 outline-none`}
          placeholder="Шалгалтын нэр"
          value={examTitle ?? ""}
          onChange={(event) => setExamTitle(event.target.value)}
        />
      </label>
    </div>
  );
}
