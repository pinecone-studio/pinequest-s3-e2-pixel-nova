import {
  buildProctorMetadata,
  createInitialProctorState,
  evaluateProctorObservation,
  resetProctorActiveTimers,
} from '@/lib/student-app/proctoring';

describe('proctoring utilities', () => {
  it('does not fire before the threshold window is reached', () => {
    const initialState = createInitialProctorState();

    const firstPass = evaluateProctorObservation(initialState, {
      timestamp: 0,
      platform: 'android',
      faceCount: 0,
      yaw: null,
      cameraPosition: 'front',
    });

    const secondPass = evaluateProctorObservation(firstPass.state, {
      timestamp: 2_999,
      platform: 'android',
      faceCount: 0,
      yaw: null,
      cameraPosition: 'front',
    });

    expect(secondPass.events).toEqual([]);
  });

  it('fires once when the threshold is reached and respects cooldown', () => {
    const initialState = createInitialProctorState();

    const firstPass = evaluateProctorObservation(initialState, {
      timestamp: 0,
      platform: 'ios',
      faceCount: 2,
      yaw: null,
      cameraPosition: 'front',
    });

    const thresholdPass = evaluateProctorObservation(firstPass.state, {
      timestamp: 2_000,
      platform: 'ios',
      faceCount: 2,
      yaw: null,
      cameraPosition: 'front',
    });

    expect(thresholdPass.events).toHaveLength(1);
    expect(thresholdPass.events[0]?.eventType).toBe('multiple_faces');

    const cooldownPass = evaluateProctorObservation(thresholdPass.state, {
      timestamp: 5_000,
      platform: 'ios',
      faceCount: 2,
      yaw: null,
      cameraPosition: 'front',
    });

    expect(cooldownPass.events).toEqual([]);
  });

  it('resets pending timers when the face state returns to normal', () => {
    const initialState = createInitialProctorState();

    const firstPass = evaluateProctorObservation(initialState, {
      timestamp: 0,
      platform: 'android',
      faceCount: 0,
      yaw: null,
      cameraPosition: 'front',
    });

    const resetPass = evaluateProctorObservation(firstPass.state, {
      timestamp: 1_000,
      platform: 'android',
      faceCount: 1,
      yaw: 0,
      cameraPosition: 'front',
    });

    const finalPass = evaluateProctorObservation(resetPass.state, {
      timestamp: 2_500,
      platform: 'android',
      faceCount: 0,
      yaw: null,
      cameraPosition: 'front',
    });

    expect(finalPass.events).toEqual([]);
  });

  it('preserves cooldown while clearing active timers on reset', () => {
    const initialState = createInitialProctorState();
    const activeState = evaluateProctorObservation(initialState, {
      timestamp: 0,
      platform: 'android',
      faceCount: 2,
      yaw: null,
      cameraPosition: 'front',
    });
    const triggeredState = evaluateProctorObservation(activeState.state, {
      timestamp: 2_000,
      platform: 'android',
      faceCount: 2,
      yaw: null,
      cameraPosition: 'front',
    });

    const resetState = resetProctorActiveTimers(triggeredState.state);
    const cooldownPass = evaluateProctorObservation(resetState, {
      timestamp: 10_000,
      platform: 'android',
      faceCount: 2,
      yaw: null,
      cameraPosition: 'front',
    });

    expect(cooldownPass.events).toEqual([]);
  });

  it('builds mobile camera metadata with null pose fields for missing faces', () => {
    const metadata = buildProctorMetadata(
      'face_missing',
      {
        timestamp: 2_000,
        platform: 'android',
        faceCount: 0,
        yaw: null,
        cameraPosition: 'front',
      },
      3_000
    );

    expect(JSON.parse(metadata)).toEqual({
      source: 'mobile_camera_local',
      platform: 'android',
      faceCount: 0,
      yaw: null,
      brightness: null,
      durationMs: 3_000,
      threshold: 3_000,
      cameraPosition: 'front',
      reason: null,
    });
  });

  it('detects camera_blocked when low brightness persists', () => {
    const initialState = createInitialProctorState();

    const firstPass = evaluateProctorObservation(initialState, {
      timestamp: 0,
      platform: 'android',
      faceCount: 1,
      yaw: 0,
      brightness: 12,
      blockedReason: 'low_brightness',
      cameraPosition: 'front',
    });

    const thresholdPass = evaluateProctorObservation(firstPass.state, {
      timestamp: 3_000,
      platform: 'android',
      faceCount: 1,
      yaw: 0,
      brightness: 12,
      blockedReason: 'low_brightness',
      cameraPosition: 'front',
    });

    expect(thresholdPass.events[0]?.eventType).toBe('camera_blocked');
  });
});
