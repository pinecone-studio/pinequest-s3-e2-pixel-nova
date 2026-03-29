import React, { createContext, useContext } from 'react';

import type { StudentAppContextValue } from './core/context-value';
import { normalizeApiError } from './core/utils';
import { useStudentAppState } from './hooks/use-student-app-state';

const StudentAppContext = createContext<StudentAppContextValue | null>(null);

export function StudentAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useStudentAppState();

  return (
    <StudentAppContext.Provider value={value}>
      {children}
    </StudentAppContext.Provider>
  );
}

export const useStudentApp = () => {
  const context = useContext(StudentAppContext);

  if (!context) {
    throw new Error('StudentAppProvider is missing.');
  }

  return context;
};

export const useStudentAppError = (error: unknown, fallback: string) =>
  normalizeApiError(error, fallback);
