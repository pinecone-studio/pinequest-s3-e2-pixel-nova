# Mobile Proctoring

## Current state
- Snapshot-based mobile proctoring has been removed from the active app flow.
- The Expo app no longer captures, uploads, stores, or analyzes camera snapshots.
- Existing non-camera integrity signals such as app background and screen blur still log normally.

## Why
- The goal is local-only suspicious behavior detection.
- The current Expo camera runtime is not sufficient for production-ready on-device face detection every 300-500ms without snapshots.
- To meet that requirement cleanly, the mobile implementation needs a native build with frame processors.

## Prepared path
- `MobileProctorCamera` now acts as a local-only scaffold instead of an uploader.
- `use-native-proctoring-camera.ts` defines the boundary for future native camera processing.
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
- event-only backend logging

## Non-goals
- no facial recognition
- no snapshot upload
- no image storage
- no video streaming
