import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  Camera as VisionCamera,
  useCameraDevice,
} from 'react-native-vision-camera';
import {
  Camera as FaceDetectorCamera,
  type Face,
  type FrameFaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';

import type { ProctorEventType } from '@/lib/student-app/proctoring';
import {
  createInitialProctorState,
  evaluateProctorObservation,
  getProctorDebugLabel,
  resetProctorActiveTimers,
} from '@/lib/student-app/proctoring';

type MobileProctorCameraProps = {
  isEnabled: boolean;
  onViolation: (
    eventType: ProctorEventType,
    metadata: string
  ) => Promise<void> | void;
};

const FACE_DETECTION_OPTIONS: FrameFaceDetectionOptions = {
  performanceMode: 'fast',
  landmarkMode: 'none',
  contourMode: 'none',
  classificationMode: 'none',
  minFaceSize: 0.15,
  trackingEnabled: true,
  cameraFacing: 'front',
  autoMode: false,
};

const formatPlatform = () => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return Platform.OS;
  }

  return 'ios';
};

export default function MobileProctorCamera({
  isEnabled,
  onViolation,
}: MobileProctorCameraProps) {
  const device = useCameraDevice('front');
  const cameraRef = useRef<VisionCamera | null>(null);
  const stateRef = useRef(createInitialProctorState());
  const [permissionStatus, setPermissionStatus] = useState<
    Awaited<ReturnType<typeof VisionCamera.getCameraPermissionStatus>>
  >('not-determined');
  const [debugLabel, setDebugLabel] = useState('Faces: 0 | yaw: n/a | pitch: n/a');
  const [statusLabel, setStatusLabel] = useState('Камер шалгаж байна...');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const syncPermission = async () => {
      const status = await VisionCamera.getCameraPermissionStatus();
      if (!cancelled) {
        setPermissionStatus(status);
      }
    };

    void syncPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEnabled) {
      return;
    }

    stateRef.current = resetProctorActiveTimers(stateRef.current);
    setWarningMessage(null);
    setStatusLabel('Камер standby төлөвт байна.');
  }, [isEnabled]);

  const handleFaceDetection = useMemo(
    () => async (faces: Face[]) => {
      if (!isEnabled) {
        return;
      }

      const primaryFace = faces[0];
      const faceCount = faces.length;
      const yaw = faceCount === 1 ? primaryFace?.yawAngle ?? null : null;
      const pitch = faceCount === 1 ? primaryFace?.pitchAngle ?? null : null;

      setDebugLabel(
        getProctorDebugLabel({
          faceCount,
          yaw,
          pitch,
        })
      );

      if (faceCount === 1) {
        setStatusLabel('Камер идэвхтэй хянаж байна.');
      } else if (faceCount === 0) {
        setStatusLabel('Нүүр илрээгүй байна.');
      } else {
        setStatusLabel('Олон нүүр илэрлээ.');
      }

      const result = evaluateProctorObservation(stateRef.current, {
        timestamp: Date.now(),
        platform: formatPlatform(),
        faceCount,
        yaw,
        pitch,
        cameraPosition: 'front',
      });

      stateRef.current = result.state;

      if (result.events.length === 0) {
        return;
      }

      const latestEvent = result.events[result.events.length - 1];
      setWarningMessage(latestEvent.localMessage);

      for (const event of result.events) {
        await onViolation(event.eventType, event.metadata);
      }
    },
    [isEnabled, onViolation]
  );

  if (!isEnabled) {
    return null;
  }

  if (permissionStatus !== 'granted') {
    return (
      <View style={[styles.card, styles.warningCard]} testID="mobile-proctor-camera">
        <Text style={styles.title}>Камерын хандалт шаардлагатай</Text>
        <Text style={styles.message}>
          Шалгалтын турш front camera ажиллах ёстой. Settings-ээс camera access
          зөвшөөрөөд дахин оролдоно уу.
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.card, styles.warningCard]} testID="mobile-proctor-camera">
        <Text style={styles.title}>Front camera олдсонгүй</Text>
        <Text style={styles.message}>
          Энэ төхөөрөмж дээр front camera илрээгүй тул monitoring prototype
          ажиллахгүй байна.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="mobile-proctor-camera">
      <View style={styles.header}>
        <Text style={styles.title}>Camera Proctoring</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ACTIVE</Text>
        </View>
      </View>
      <View style={styles.previewShell}>
        <FaceDetectorCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isEnabled}
          photo={false}
          video={false}
          audio={false}
          faceDetectionOptions={FACE_DETECTION_OPTIONS}
          faceDetectionCallback={handleFaceDetection}
          pixelFormat="yuv"
        />
      </View>
      <Text style={styles.status}>{statusLabel}</Text>
      <Text style={styles.debug}>{debugLabel}</Text>
      {warningMessage ? <Text style={styles.warning}>{warningMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#D9CCB4',
    borderRadius: 20,
    backgroundColor: '#FFF8ED',
    padding: 14,
    gap: 8,
  },
  warningCard: {
    borderColor: '#D0874D',
    backgroundColor: '#FFF3E6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2A1F',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E2F0E7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E5E42',
  },
  previewShell: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#19271E',
  },
  status: {
    fontSize: 13,
    color: '#45604E',
    fontWeight: '700',
  },
  debug: {
    fontSize: 12,
    color: '#6A655B',
  },
  warning: {
    fontSize: 13,
    lineHeight: 20,
    color: '#9B4D1A',
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5E655D',
  },
});
