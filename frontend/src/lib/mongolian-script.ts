export const TRADITIONAL_MONGOLIAN_REGEX = /[\u1800-\u18AF]/;

export const hasTraditionalMongolian = (text: string) =>
  TRADITIONAL_MONGOLIAN_REGEX.test(text);
