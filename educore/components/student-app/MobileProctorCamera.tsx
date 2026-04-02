import { CameraView } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Pill } from "@/components/student-app/ui";
import { uploadSnapshotFromBase64 } from "@/lib/student-app/services/proctoring-media";
import type { AuthUser, CheatEventType } from "@/types/student-app";

type MobileProctorCameraProps = {
  captureEnabled: boolean;
  headless?: boolean;
  isEnabled: boolean;
  hidePreview?: boolean;
  permissionGranted: boolean;
  sessionId?: string;
  student?: AuthUser | null;
  onCameraReadyChange?: (ready: boolean) => void;
  onViolation?: (eventType: CheatEventType, metadata?: string) => Promise<void> | void;
};

const SNAPSHOT_INTERVAL_MS = 30_000;

export default function MobileProctorCamera({
  captureEnabled,
  headless = false,
  isEnabled,
  hidePreview = false,
  permissionGranted,
  sessionId,
  student,
  onCameraReadyChange,
  onViolation,
}: MobileProctorCameraProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");

  const captureSnapshot = useCallback(async () => {
    if (!cameraRef.current || !student || !sessionId) {
      return;
    }

    const picture = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.45,
      skipProcessing: true,
    });

    if (!picture.base64) {
      throw new Error("Snapshot capture did not return base64 data.");
    }

    setUploadStatus("uploading");
    await uploadSnapshotFromBase64(
      student,
      {
        sessionId,
        mimeType: picture.format === "png" ? "image/png" : "image/jpeg",
        capturedAt: new Date().toISOString(),
      },
      picture.base64,
    );
    setLastSnapshotAt(new Date().toISOString());
    setUploadStatus("idle");
  }, [sessionId, student]);

  useEffect(() => {
    onCameraReadyChange?.(cameraReady);
  }, [cameraReady, onCameraReadyChange]);

  useEffect(() => {
    if (!captureEnabled || !cameraReady || !permissionGranted) {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
      return;
    }

    snapshotTimerRef.current = setInterval(() => {
      void captureSnapshot().catch((captureError) => {
        setUploadStatus("error");
        setError(
          captureError instanceof Error
            ? captureError.message
            : "Could not capture the exam snapshot.",
        );
      });
    }, SNAPSHOT_INTERVAL_MS);

    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
    };
  }, [cameraReady, captureEnabled, captureSnapshot, permissionGranted]);

  if (!isEnabled) {
    return null;
  }

  if (!permissionGranted) {
    if (headless) {
      return null;
    }

    return (
      <View
        style={[
          styles.card,
          styles.warningCard,
          hidePreview && styles.compactCard,
        ]}
        testID="mobile-proctor-camera"
      >
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
    headless ? (
      <CameraView
        ref={cameraRef}
        facing="front"
        style={styles.hiddenPreview}
        onCameraReady={() => {
          setCameraReady(true);
          setError(null);
        }}
        onMountError={(event) => {
          setCameraReady(false);
          setError(event.message);
          void onViolation?.("camera_blocked", `camera-mount:${event.message}`);
        }}
      />
    ) : (
    <View
      style={[styles.card, hidePreview && styles.compactCard]}
      testID="mobile-proctor-camera"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Exam camera</Text>
        <Pill
          label={cameraReady ? "Ready" : "Starting"}
          tone={cameraReady ? "success" : "warning"}
        />
      </View>

      <CameraView
        ref={cameraRef}
        facing="front"
        style={hidePreview ? styles.hiddenPreview : styles.preview}
        onCameraReady={() => {
          setCameraReady(true);
          setError(null);
        }}
        onMountError={(event) => {
          setCameraReady(false);
          setError(event.message);
          void onViolation?.("camera_blocked", `camera-mount:${event.message}`);
        }}
      />

      <Text style={styles.status}>
        {captureEnabled ? "Periodic evidence snapshots are active." : "Camera preflight is active."}
      </Text>
      {!hidePreview ? (
        <Text style={styles.message}>
          The mobile client keeps the front camera ready, uploads periodic still-image
          evidence during active exams, and remains ready for native local proctoring events.
        </Text>
      ) : null}
      {!hidePreview && lastSnapshotAt ? (
        <Text style={styles.message}>Last snapshot uploaded at {lastSnapshotAt}</Text>
      ) : null}
      {!hidePreview && uploadStatus === "uploading" ? (
        <Text style={styles.message}>Uploading evidence snapshot...</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
    )
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFCF5",
    borderRadius: 24,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E7DDCB",
  },
  warningCard: {
    borderColor: "#D8AA6B",
    backgroundColor: "#FFF7E8",
  },
  compactCard: {
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D2A24",
  },
  preview: {
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
  },
  hiddenPreview: {
    height: 1,
    opacity: 0.01,
    position: "absolute",
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E655D",
  },
  status: {
    fontSize: 13,
    fontWeight: "700",
    color: "#45604E",
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    color: "#A14A39",
  },
});
