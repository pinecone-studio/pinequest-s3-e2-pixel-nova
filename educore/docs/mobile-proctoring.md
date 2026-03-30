# Mobile Proctoring Prototype

## What shipped
- Front camera monitoring for the student exam screen.
- Real-time face-based detection for:
  - `face_missing`
  - `multiple_faces`
  - `looking_away`
  - `looking_down`
- Existing `logIntegrityEvent()` flow is reused, so backend cheat events and teacher notifications continue to work without new APIs.

## Dev build setup
1. Run `npm install` inside `educore/`.
2. Build with a native dev client instead of Expo Go because Vision Camera frame processors require native modules.
3. Use one of:
   - `npx expo run:android`
   - `npx expo run:ios`
4. Grant front camera permission when prompted before starting an exam.

## Demo checklist
1. Join an exam from the mobile student app.
2. Tap `Шалгалтыг эхлүүлэх`.
3. Confirm the camera preview card appears once the session is `in_progress`.
4. Trigger each rule on a real device:
   - move out of frame for 2+ seconds
   - bring a second face into frame for 1+ second
   - turn sideways for 1.5+ seconds
   - look downward for 1.5+ seconds
5. Confirm cheat events appear through the existing backend flow.

## Device runbook
- If start is blocked, confirm camera permission is granted in system settings.
- If the preview does not render, rebuild the native app after dependency/plugin changes.
- If detections feel noisy, test in good lighting and keep the front camera at eye level.
- When the app goes to the background, the exam screen logs the existing integrity event and the camera detector resets its pending timers.
