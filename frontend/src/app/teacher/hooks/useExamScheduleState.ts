import { useEffect, useState } from "react";

export const useExamScheduleState = () => {
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleExamType, setScheduleExamType] = useState("progress");
  const [scheduleClassName, setScheduleClassName] = useState("");
  const [scheduleGroupName, setScheduleGroupName] = useState("");
  const [scheduleSubjectName, setScheduleSubjectName] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [selectedScheduleExamId, setSelectedScheduleExamId] = useState("");
  const [scheduleExpectedStudentsCount, setScheduleExpectedStudentsCount] =
    useState(0);
  const [scheduleLocationPolicy, setScheduleLocationPolicy] = useState<"anywhere" | "school_only">("anywhere");
  const [scheduleLocationLabel, setScheduleLocationLabel] = useState("Сургууль");
  const [scheduleLocationLatitude, setScheduleLocationLatitude] = useState("");
  const [scheduleLocationLongitude, setScheduleLocationLongitude] = useState("");
  const [scheduleAllowedRadiusMeters, setScheduleAllowedRadiusMeters] = useState(3000);

  useEffect(() => {
    const examTypeLabel =
      scheduleExamType === "term" ? "Улирлын шалгалт" : "Явцын шалгалт";
    const nextTitle = [
      scheduleClassName,
      scheduleGroupName,
      scheduleSubjectName,
      examTypeLabel,
    ]
      .filter(Boolean)
      .join(" ");

    if (nextTitle !== scheduleTitle) {
      setScheduleTitle(nextTitle);
    }
  }, [
    scheduleClassName,
    scheduleExamType,
    scheduleGroupName,
    scheduleSubjectName,
    scheduleTitle,
  ]);

  return {
    scheduleTitle,
    setScheduleTitle,
    scheduleDate,
    setScheduleDate,
    scheduleExamType,
    setScheduleExamType,
    scheduleClassName,
    setScheduleClassName,
    scheduleGroupName,
    setScheduleGroupName,
    scheduleSubjectName,
    setScheduleSubjectName,
    scheduleDescription,
    setScheduleDescription,
    selectedScheduleExamId,
    setSelectedScheduleExamId,
    scheduleExpectedStudentsCount,
    setScheduleExpectedStudentsCount,
    scheduleLocationPolicy,
    setScheduleLocationPolicy,
    scheduleLocationLabel,
    setScheduleLocationLabel,
    scheduleLocationLatitude,
    setScheduleLocationLatitude,
    scheduleLocationLongitude,
    setScheduleLocationLongitude,
    scheduleAllowedRadiusMeters,
    setScheduleAllowedRadiusMeters,
  };
};
