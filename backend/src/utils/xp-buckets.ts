import { getLevel } from "./level-calc";

export type XpBucket = "term" | "progress" | "general";

type BucketedStudent = {
  xp?: number | null;
  termXp?: number | null;
  progressXp?: number | null;
};

export const resolveXpBucket = (examType?: string | null): XpBucket => {
  if (examType === "term") {
    return "term";
  }

  if (examType === "progress") {
    return "progress";
  }

  return "general";
};

export const getBucketXp = (
  student: BucketedStudent,
  bucket: Exclude<XpBucket, "general">,
) => {
  if (bucket === "term") {
    return Math.max(student.termXp ?? 0, 0);
  }

  return Math.max(student.progressXp ?? 0, 0);
};

export const getBucketLevel = (
  student: BucketedStudent,
  bucket: Exclude<XpBucket, "general">,
) => getLevel(getBucketXp(student, bucket));

export const buildBucketXpUpdate = (
  student: BucketedStudent,
  bucket: XpBucket,
  amount: number,
) => {
  const nextXp = Math.max((student.xp ?? 0) + amount, 0);
  const nextTermXp =
    bucket === "term"
      ? Math.max((student.termXp ?? 0) + amount, 0)
      : Math.max(student.termXp ?? 0, 0);
  const nextProgressXp =
    bucket === "progress"
      ? Math.max((student.progressXp ?? 0) + amount, 0)
      : Math.max(student.progressXp ?? 0, 0);

  return {
    xp: nextXp,
    level: getLevel(nextXp),
    termXp: nextTermXp,
    progressXp: nextProgressXp,
  };
};
