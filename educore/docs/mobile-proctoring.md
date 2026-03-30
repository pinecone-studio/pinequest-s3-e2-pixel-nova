# Mobile Proctoring In Expo Go

## What works today
- `expo-camera` based front camera preview on the exam screen.
- Camera permission gate before the exam can start.
- Preview card only mounts while the exam is in progress.
- Existing mobile integrity events such as `tab_hidden`, `window_blur`, and `rapid_answers` continue to work.
- Backend now accepts the future camera event types:
  - `face_missing`
  - `multiple_faces`
  - `looking_away`
  - `looking_down`

## Expo Go limitation
- Expo Go supports `expo-camera` preview.
- Expo Go does not support the custom native face detection stack from the original plan.
- In this build, the exam screen shows a clear preview-mode message instead of pretending that live face detection is active.

## How to run
1. `cd educore`
2. `npm install`
3. `npx expo start`
4. Open the project in Expo Go on a real device.
5. Join an exam and press `Start exam`.

## Demo checklist
1. Confirm camera permission is requested before the exam starts.
2. Confirm the preview card appears only after the exam enters `in_progress`.
3. Confirm the app does not crash in Expo Go.
4. Confirm backgrounding the app still logs the existing integrity warning.
5. Confirm teacher/backend flows still accept the new camera event types.
