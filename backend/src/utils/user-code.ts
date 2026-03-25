import { nanoid } from "nanoid";

const CODE_LENGTH = 4;

export const createTeacherCode = () =>
  `T-${nanoid(CODE_LENGTH).toUpperCase()}`;

export const createStudentCode = () =>
  `S-${nanoid(CODE_LENGTH).toUpperCase()}`;
