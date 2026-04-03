import { customAlphabet } from "nanoid";

// Exclude ambiguous characters: I, O, 0, 1
const letterAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const digitAlphabet = "23456789";
const generateLetters = customAlphabet(letterAlphabet, 4);
const generateDigits = customAlphabet(digitAlphabet, 2);

export function generateRoomCode(): string {
  return `${generateLetters()}${generateDigits()}`;
}
