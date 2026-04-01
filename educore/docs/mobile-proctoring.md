# Mobile Proctoring

## Current state
- The active exam screen now keeps the front camera mounted, uploads periodic still-image evidence, and blocks start until camera preflight is ready.
- When an exam requires audio recording, the mobile client expects microphone permission and a working native audio recorder before the exam can start.
- Existing non-camera integrity signals such as app background and screen blur still log normally.
- Audio recording currently depends on `expo-av` being installed in the app build. Without it, the recorder intentionally reports itself as unsupported.

## Why
- Snapshot evidence and rolling audio evidence are the current parity path with the web app.
- Local-only suspicious behavior detection still needs a stronger native camera processing pipeline than plain Expo camera previews can provide.
- To reach production-grade on-device face-state detection, the mobile implementation still needs a native build with frame processors.

## Current implementation
- `MobileProctorCamera` keeps the front camera mounted, reports readiness, captures periodic still-image evidence, and uploads snapshots through the shared cheat-media backend routes.
- `use-exam-audio-recorder.ts` rotates 30-second microphone chunks and finalizes uploaded audio metadata through the shared backend audio routes.
- `use-native-proctoring-camera.ts` still defines the future boundary for native frame-processor detection.
- `proctoring.ts` contains the reusable state/timer logic for these event types:
  - `face_missing`
  - `multiple_faces`
  - `looking_away`
  - `camera_blocked`

## Planned native stack
- custom Expo dev client or bare/native build
- `react-native-vision-camera`
- frame processors
- on-device face detection / landmarks
- shared backend event/media logging

## Real-device validation checklist
- Install `expo-av` into `educore` and rebuild the native app before validating audio-required exams.
- Rebuild the app after the camera/microphone permission changes in `app.json`.
- Validate camera permission denial before exam start.
- Validate microphone permission denial on an audio-required exam.
- Validate one full in-progress exam with snapshot uploads reaching the backend.
- Validate one audio-required exam with at least two rotated chunks and a successful final flush on submit.
- Validate app backgrounding during an active exam and confirm the blocking warning appears.
- Validate recovery after returning to the app, including camera readiness and audio recorder recovery behavior.

## Non-goals
- no facial recognition
- no video streaming
