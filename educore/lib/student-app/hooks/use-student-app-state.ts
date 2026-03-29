import { useMemo, useState } from 'react';

import type { StudentAppContextValue } from '../core/context-value';
import { initialStudentAppState } from '../core/state';
import { useStudentAuth } from './use-student-auth';
import { useStudentDashboard } from './use-student-dashboard';
import { useStudentSession } from './use-student-session';

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
