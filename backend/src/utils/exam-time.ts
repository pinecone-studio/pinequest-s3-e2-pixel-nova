const LEGACY_LOCAL_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

const MONGOLIA_UTC_OFFSET = "+08:00";

export const parseExamDate = (value: string | null | undefined) => {
  if (!value) return null;

  const normalizedValue =
    LEGACY_LOCAL_DATE_TIME.test(value) && !HAS_TIMEZONE_SUFFIX.test(value)
      ? `${value.replace(" ", "T")}${MONGOLIA_UTC_OFFSET}`
      : value;

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeExamDate = (value: string | null | undefined) => {
  const parsed = parseExamDate(value);
  return parsed ? parsed.toISOString() : null;
};
