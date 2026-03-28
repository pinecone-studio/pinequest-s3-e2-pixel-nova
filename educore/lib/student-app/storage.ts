import * as FileSystem from 'expo-file-system/legacy';

import type { PersistedStudentAppState } from './types';

const STORAGE_URI = `${FileSystem.documentDirectory ?? ''}student-app-state.json`;

const emptyState: PersistedStudentAppState = {
  authMode: 'dev_switcher',
  student: null,
  profile: null,
  activeSession: null,
  submittedResult: null,
};

export const loadPersistedState = async (): Promise<PersistedStudentAppState> => {
  if (!FileSystem.documentDirectory) {
    return emptyState;
  }

  try {
    const raw = await FileSystem.readAsStringAsync(STORAGE_URI);
    const parsed = JSON.parse(raw) as PersistedStudentAppState;
    return {
      authMode: parsed.authMode ?? 'dev_switcher',
      student: parsed.student ?? null,
      profile: parsed.profile ?? null,
      activeSession: parsed.activeSession ?? null,
      submittedResult: parsed.submittedResult ?? null,
    };
  } catch {
    return emptyState;
  }
};

export const persistState = async (state: PersistedStudentAppState) => {
  if (!FileSystem.documentDirectory) {
    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_URI, JSON.stringify(state));
};

export const clearPersistedState = async () => {
  if (!FileSystem.documentDirectory) {
    return;
  }

  try {
    await FileSystem.deleteAsync(STORAGE_URI, { idempotent: true });
  } catch {
    return;
  }
};
