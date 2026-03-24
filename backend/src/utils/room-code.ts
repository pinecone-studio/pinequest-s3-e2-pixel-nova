import { customAlphabet } from "nanoid";

// Exclude ambiguous characters: I, O, 0, 1
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(alphabet, 6);

export function generateRoomCode(): string {
  return generate();
}
