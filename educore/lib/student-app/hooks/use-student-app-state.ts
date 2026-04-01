import { useEffect, useMemo, useState } from 'react';

import type { StudentAppContextValue } from '../core/context-value';
import { initialStudentAppState } from '../core/state';
import { useStudentAuth } from './use-student-auth';
import { useStudentDashboard } from './use-student-dashboard';
import { useStudentSession } from './use-student-session';
import {
  initializeExamNotifications,
  syncExamNotifications,
} from '../services/notifications';

export const useStudentAppState = (): StudentAppContextValue => {
  const [state, setState] = useState(initialStudentAppState);

  const dashboard = useStudentDashboard(state.student, setState);
  const auth = useStudentAuth({
    state,
    setState,
    refreshDashboard: dashboard.refreshDashboard,
  });
  const session = useStudentSession({
    state,
    setState,
    refreshDashboard: dashboard.refreshDashboard,
  });

  useEffect(() => {
    void initializeExamNotifications();
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    void syncExamNotifications(state.student, state.upcomingExams);
  }, [state.hydrated, state.student, state.upcomingExams]);

  return useMemo(
    () => ({
      ...state,
      ...dashboard,
      ...auth,
      ...session,
    }),
    [auth, dashboard, session, state],
  );
};
