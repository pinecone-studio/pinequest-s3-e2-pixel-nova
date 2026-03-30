# Mobile Proctoring In Expo Go

## What works today
- `expo-camera` based front camera preview on the exam screen.
- Camera permission gate before the exam can start.
- Preview card only mounts while the exam is in progress.
- Preview card shows `warming up`, `ready`, and `failed` states for easier demo/debugging.
- Once the preview is ready, the app captures one snapshot immediately and then about every `15` seconds.
- Each snapshot is sent to the backend and analyzed with Workers AI vision.
- Suspicious snapshot results are forwarded into the existing `logIntegrityEvent()` flow.
- Existing mobile integrity events such as `tab_hidden`, `window_blur`, and `rapid_answers` continue to work.
- Backend accepts the camera event types used by snapshot analysis:
  - `face_missing`
  - `multiple_faces`
  - `looking_away`
  - `looking_down`

## Expo Go limitation
- Expo Go supports `expo-camera` preview.
- Expo Go does not support the custom native frame-by-frame face detection stack from the original plan.
- This build works around that by using periodic snapshots plus backend AI instead of native realtime detection.
- If the preview fails to mount, the camera card now shows a local recovery message instead of silently failing.

## How to run
1. `cd educore`
2. `npm install`
3. `npx expo start`
4. Open the project in Expo Go on a real device.
5. Join an exam and press `Start exam`.
6. Wait for the camera card to switch from `warming up` to `ready`.
7. Keep the device pointed at the student so the 15-second snapshots can be analyzed successfully.

## Demo checklist
1. Confirm camera permission is requested before the exam starts.
2. Confirm the preview card appears only after the exam enters `in_progress`.
3. Confirm the app does not crash in Expo Go.
4. Confirm the camera card shows that AI snapshot analysis is active.
5. Confirm backgrounding the app still logs the existing integrity warning.
6. Confirm a local error message appears if the preview cannot be mounted or AI analysis fails.
7. Confirm teacher/backend flows receive `face_missing`, `multiple_faces`, `looking_away`, or `looking_down` when the AI flags a suspicious snapshot.
