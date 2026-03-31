import { useEffect, useMemo, useState } from 'react';

import type { AuthUser, CheatEventType } from '@/types/student-app';

type NativeProctoringStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopped'
  | 'unsupported'
  | 'error';

type NativeProctoringEvent = {
  eventType: CheatEventType;
  metadata?: string;
  timestamp: string;
};

type UseNativeProctoringCameraOptions = {
  enabled: boolean;
  permissionGranted: boolean;
  sessionId?: string;
  student?: AuthUser | null;
  onViolation?: (eventType: CheatEventType, metadata?: string) => Promise<void> | void;
};

type UseNativeProctoringCameraResult = {
  error: string | null;
  events: NativeProctoringEvent[];
  isSupported: boolean;
  status: NativeProctoringStatus;
  start: () => Promise<void>;
  stop: () => void;
};

const buildUnsupportedMessage = () =>
  'Local-only mobile proctoring is prepared for a native build, but this Expo build does not include frame processors yet.';

export const useNativeProctoringCamera = ({
  enabled,
  permissionGranted,
}: UseNativeProctoringCameraOptions): UseNativeProctoringCameraResult => {
  const [status, setStatus] = useState<NativeProctoringStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const isSupported = useMemo(() => false, []);

  const stop = () => {
    setStatus((current) =>
      current === 'idle' || current === 'unsupported' ? current : 'stopped',
    );
  };

  const start = async () => {
    if (!permissionGranted) {
      setStatus('error');
      setError('Camera permission is required before proctoring can start.');
      return;
    }

    if (!isSupported) {
      setStatus('unsupported');
      setError(buildUnsupportedMessage());
      return;
    }

    setStatus('running');
    setError(null);
  };

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    void start();
  }, [enabled, permissionGranted]);

  return {
    error,
    events: [],
    isSupported,
    status,
    start,
    stop,
  };
};
