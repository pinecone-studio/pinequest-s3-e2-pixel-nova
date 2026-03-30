import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import {
  CameraView,
  type CameraMountError,
} from 'expo-camera';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/student-app/ui';
import { normalizeApiError } from '@/lib/student-app/core/utils';
import {
  buildAiSnapshotMetadata,
  CAMERA_SNAPSHOT_INTERVAL_MS,
  getProctorLocalMessage,
  SNAPSHOT_EVENT_COOLDOWN_MS,
  type ProctorEventType,
  type SnapshotAnalysisResult,
} from '@/lib/student-app/proctoring';
import { analyzeCheatSnapshot } from '@/lib/student-app/services/api';
import type { AuthUser, CheatEventType } from '@/types/student-app';

type MobileProctorCameraProps = {
  isEnabled: boolean;
  permissionGranted: boolean;
  sessionId?: string;
  student?: AuthUser | null;
  onViolation?: (eventType: CheatEventType, metadata?: string) => Promise<void> | void;
};

const isExpoGoEnvironment = () =>
  Constants.appOwnership === 'expo' || Constants.expoVersion != null;

const getPlatformLabel = () => {
  if (Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return 'unknown';
};

export default function MobileProctorCamera({
  isEnabled,
  permissionGranted,
  sessionId,
  student,
  onViolation,
}: MobileProctorCameraProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const isMountedRef = useRef(true);
  const analysisInFlightRef = useRef(false);
  const lastTriggeredAtRef = useRef<Partial<Record<ProctorEventType, number>>>({});
  const [previewState, setPreviewState] = useState<'starting' | 'ready' | 'error'>(
    'starting',
  );
  const [mountError, setMountError] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<
    'idle' | 'capturing' | 'analyzing' | 'ready' | 'error'
  >('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysisAt, setLastAnalysisAt] = useState<string | null>(null);
  const [lastAnalysisSummary, setLastAnalysisSummary] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isEnabled && permissionGranted) {
      return;
    }

    lastTriggeredAtRef.current = {};
    setPreviewState('starting');
    setMountError(null);
    setAnalysisState('idle');
    setAnalysisError(null);
    setLastAnalysisAt(null);
    setLastAnalysisSummary(null);
  }, [isEnabled, permissionGranted]);

  useEffect(() => {
    lastTriggeredAtRef.current = {};
  }, [sessionId]);

  const statusLabel = useMemo(() => {
    if (previewState === 'error') {
      return 'Preview алдаа';
    }

    if (previewState !== 'ready') {
      return 'Preview ачаалж байна';
    }

    if (analysisState === 'capturing') {
      return 'Snapshot авч байна';
    }

    if (analysisState === 'analyzing') {
      return 'AI шалгаж байна';
    }

    if (analysisState === 'error') {
      return 'AI түр саатсан';
    }

    if (previewState === 'ready') {
      return isExpoGoEnvironment() ? 'Expo Go AI active' : 'Preview + AI';
    }

    return 'Preview ачаалж байна';
  }, [analysisState, previewState]);

  const handleCameraReady = useCallback(() => {
    setPreviewState('ready');
    setMountError(null);
    setAnalysisError(null);
    setAnalysisState('ready');
  }, []);

  const handleMountError = useCallback((event: CameraMountError) => {
    setPreviewState('error');
    setMountError(event.message || 'unknown');
  }, []);

  const runSnapshotAnalysis = useCallback(async () => {
    if (
      !cameraRef.current ||
      !isEnabled ||
      !permissionGranted ||
      previewState !== 'ready' ||
      !student ||
      !sessionId
    ) {
      return;
    }

    if (analysisInFlightRef.current) {
      return;
    }

    analysisInFlightRef.current = true;
    setAnalysisState('capturing');
    setAnalysisError(null);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.35,
        shutterSound: false,
      });

      if (!picture.base64) {
        throw new Error('Camera snapshot did not include base64 data.');
      }

      const mimeType = picture.format === 'png' ? 'image/png' : 'image/jpeg';
      const capturedAt = new Date().toISOString();
      const imageDataUrl = `data:${mimeType};base64,${picture.base64}`;

      setAnalysisState('analyzing');

      const analysis = await analyzeCheatSnapshot(
        student,
        sessionId,
        imageDataUrl,
        capturedAt,
      );

      if (!isMountedRef.current) {
        return;
      }

      setAnalysisState('ready');
      setLastAnalysisAt(capturedAt);
      setLastAnalysisSummary(analysis.summary);

      if (!analysis.suspiciousEvents.length || !onViolation) {
        return;
      }

      const now = Date.now();
      const platform = getPlatformLabel();

      for (const suspiciousEvent of analysis.suspiciousEvents) {
        const previousTrigger = lastTriggeredAtRef.current[suspiciousEvent.eventType];
        if (
          previousTrigger !== undefined &&
          now - previousTrigger < SNAPSHOT_EVENT_COOLDOWN_MS
        ) {
          continue;
        }

        lastTriggeredAtRef.current[suspiciousEvent.eventType] = now;

        const metadata = buildAiSnapshotMetadata({
          analysis: analysis as SnapshotAnalysisResult,
          capturedAt,
          event: suspiciousEvent,
          intervalMs: CAMERA_SNAPSHOT_INTERVAL_MS,
          platform,
        });

        setLastAnalysisSummary(
          `${getProctorLocalMessage(suspiciousEvent.eventType)} ${analysis.summary}`,
        );

        await onViolation(suspiciousEvent.eventType, metadata);
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setAnalysisState('error');
      setAnalysisError(
        normalizeApiError(error, 'AI snapshot analysis түр саатлаа.'),
      );
    } finally {
      analysisInFlightRef.current = false;
    }
  }, [
    isEnabled,
    onViolation,
    permissionGranted,
    previewState,
    sessionId,
    student,
  ]);

  useEffect(() => {
    if (
      !isEnabled ||
      !permissionGranted ||
      previewState !== 'ready' ||
      !student ||
      !sessionId
    ) {
      return;
    }

    void runSnapshotAnalysis();

    const intervalId = setInterval(() => {
      void runSnapshotAnalysis();
    }, CAMERA_SNAPSHOT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    isEnabled,
    permissionGranted,
    previewState,
    runSnapshotAnalysis,
    sessionId,
    student,
  ]);

  if (!isEnabled) {
    return null;
  }

  if (!permissionGranted) {
    return (
      <View style={[styles.card, styles.warningCard]} testID="mobile-proctor-camera">
        <View style={styles.header}>
          <Text style={styles.title}>Шалгалтын камер</Text>
          <Pill label="Зөвшөөрөл" tone="warning" />
        </View>
        <Text style={styles.message}>
          Камерын зөвшөөрөлгүй тул шалгалтыг энэ build дээр эхлүүлэх боломжгүй.
        </Text>
      </View>
    );
  }

  if (mountError) {
    return (
      <View style={[styles.card, styles.warningCard]} testID="mobile-proctor-camera">
        <View style={styles.header}>
          <Text style={styles.title}>Шалгалтын камер</Text>
          <Pill label="Алдаа" tone="warning" />
        </View>
        <Text style={styles.message}>
          Camera preview ачаалахад алдаа гарлаа. App-аа дахин нээгээд шалгалтын
          screen рүү буцаж орно уу.
        </Text>
        <Text style={styles.debug}>Status: preview failed | reason: {mountError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="mobile-proctor-camera">
      <View style={styles.header}>
        <Text style={styles.title}>Шалгалтын камер</Text>
        <Pill
          label={statusLabel}
          tone={analysisState === 'error' ? 'warning' : isExpoGoEnvironment() ? 'warning' : 'success'}
        />
      </View>
      <View style={styles.previewShell}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          active={isEnabled}
          facing="front"
          mirror
          onCameraReady={handleCameraReady}
          onMountError={handleMountError}
        />
      </View>
      <Text style={styles.status}>
        {previewState === 'ready'
          ? analysisState === 'analyzing'
            ? 'Camera snapshot-ийг AI-аар шалгаж байна.'
            : `Camera preview бэлэн. ${Math.round(
                CAMERA_SNAPSHOT_INTERVAL_MS / 1000,
              )} сек тутам snapshot шинжилж байна.`
          : 'Camera preview ачаалж байна...'}
      </Text>
      <Text style={styles.message}>
        {isExpoGoEnvironment()
          ? 'Expo Go дээр front camera preview нээгдэж, snapshot-уудыг backend AI-аар шинжилнэ. App background, tab blur зэрэг зөрчлүүд мөн хэвийн log хийгдэнэ.'
          : 'Front camera preview болон periodic AI snapshot analysis шалгалтын үеэр идэвхтэй байна.'}
      </Text>
      {analysisError ? <Text style={styles.error}>{analysisError}</Text> : null}
      {lastAnalysisSummary ? (
        <Text style={styles.analysis}>Сүүлийн AI тэмдэглэл: {lastAnalysisSummary}</Text>
      ) : null}
      <Text style={styles.debug}>
        Status: {previewState === 'ready' ? 'preview ready' : 'warming up'} | ai:{' '}
        {analysisState} | every: {Math.round(CAMERA_SNAPSHOT_INTERVAL_MS / 1000)}s |
        mode: {isExpoGoEnvironment() ? 'expo-go' : 'native'}
      </Text>
      {lastAnalysisAt ? (
        <Text style={styles.debug}>Last snapshot: {lastAnalysisAt}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFCF5',
    borderRadius: 24,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E7DDCB',
  },
  warningCard: {
    borderColor: '#D8AA6B',
    backgroundColor: '#FFF7E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2A24',
  },
  previewShell: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#18211E',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5E655D',
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
    color: '#45604E',
  },
  analysis: {
    fontSize: 13,
    lineHeight: 19,
    color: '#375746',
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#A14A39',
  },
  debug: {
    fontSize: 12,
    color: '#7A7A72',
  },
});
