import { figmaFieldClass, figmaTextareaClass } from "../styles";
import {
  classOptions,
  groupOptions,
  subjectOptions,
} from "./exam-schedule-constants";

type ExamScheduleMetaFieldsProps = {
  scheduleClassName: string;
  setScheduleClassName: (value: string) => void;
  scheduleGroupName: string;
  setScheduleGroupName: (value: string) => void;
  scheduleSubjectName: string;
  setScheduleSubjectName: (value: string) => void;
  scheduleDescription: string;
  setScheduleDescription: (value: string) => void;
};

export default function ExamScheduleMetaFields({
  scheduleClassName,
  setScheduleClassName,
  scheduleGroupName,
  setScheduleGroupName,
  scheduleSubjectName,
  setScheduleSubjectName,
  scheduleDescription,
  setScheduleDescription,
}: ExamScheduleMetaFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-3">
          <span className="text-[16px] font-semibold text-black">Анги</span>
          <select
            className={figmaFieldClass}
            value={scheduleClassName}
            onChange={(event) => setScheduleClassName(event.target.value)}
          >
            <option value="">Анги сонгоно уу.</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-3">
          <span className="text-[16px] font-semibold text-black">Бүлэг</span>
          <select
            className={figmaFieldClass}
            value={scheduleGroupName}
            onChange={(event) => setScheduleGroupName(event.target.value)}
          >
            <option value="">Бүлэг сонгоно уу.</option>
            {groupOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-3">
        <span className="text-[16px] font-semibold text-black">Хичээл</span>
        <select
          className={figmaFieldClass}
          value={scheduleSubjectName}
          onChange={(event) => setScheduleSubjectName(event.target.value)}
        >
          <option value="">Хичээл сонгоно уу.</option>
          {subjectOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-3">
        <span className="text-[16px] font-semibold text-black">Тайлбар</span>
        <textarea
          className={figmaTextareaClass}
          placeholder="Жишээ нь: Шалгалтын сэдэв"
          value={scheduleDescription}
          onChange={(event) => setScheduleDescription(event.target.value)}
        />
      </label>
    </>
  );
}
