import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/student-app/ui';
import { useNativeProctoringCamera } from '@/lib/student-app/hooks/use-native-proctoring-camera';
import type { AuthUser, CheatEventType } from '@/types/student-app';

type MobileProctorCameraProps = {
  isEnabled: boolean;
  permissionGranted: boolean;
  sessionId?: string;
  student?: AuthUser | null;
  onViolation?: (eventType: CheatEventType, metadata?: string) => Promise<void> | void;
};

export default function MobileProctorCamera({
  isEnabled,
  permissionGranted,
  sessionId,
  student,
  onViolation,
}: MobileProctorCameraProps) {
  const { error, events, isSupported, status } = useNativeProctoringCamera({
    enabled: isEnabled,
    onViolation,
    permissionGranted,
    sessionId,
    student,
  });

  if (!isEnabled) {
    return null;
  }

  if (!permissionGranted) {
    return (
      <View style={[styles.card, styles.warningCard]} testID="mobile-proctor-camera">
        <View style={styles.header}>
          <Text style={styles.title}>Exam camera</Text>
          <Pill label="Permission required" tone="warning" />
        </View>
        <Text style={styles.message}>
          Camera permission is required before the exam can start.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="mobile-proctor-camera">
      <View style={styles.header}>
        <Text style={styles.title}>Exam camera</Text>
        <Pill
          label={isSupported ? status : 'Native build required'}
          tone={isSupported ? 'success' : 'warning'}
        />
      </View>

      <Text style={styles.status}>
        Snapshot capture is disabled in this build.
      </Text>
      <Text style={styles.message}>
        This app is now prepared for local-only proctoring, but actual face detection
        must run in a native build with frame processors. No snapshots are captured,
        stored, or uploaded here.
      </Text>
      <Text style={styles.message}>
        The planned on-device detector will flag only `NO_FACE`, `MULTIPLE_FACES`,
        `LOOKING_AWAY`, and `CAMERA_BLOCKED`, then send small event logs to the
        backend.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.debug}>
        Status: {status} | events: {events.length} | mode: local-only scaffold
      </Text>
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
