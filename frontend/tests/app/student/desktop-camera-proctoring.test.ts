import {
  createInitialDesktopCameraState,
  estimateDesktopCameraObservation,
  evaluateDesktopCameraObservation,
} from "@/app/student/hooks/desktop-camera-proctoring";

const singleFace = (noseX: number, noseY: number) => {
  const landmarks = Array.from({ length: 400 }, () => ({ x: 0.5, y: 0.5 }));

  landmarks[33] = { x: 0.4, y: 0.4 };
  landmarks[133] = { x: 0.45, y: 0.41 };
  landmarks[159] = { x: 0.43, y: 0.39 };
  landmarks[145] = { x: 0.43, y: 0.43 };
  landmarks[263] = { x: 0.6, y: 0.4 };
  landmarks[362] = { x: 0.55, y: 0.41 };
  landmarks[386] = { x: 0.57, y: 0.39 };
  landmarks[374] = { x: 0.57, y: 0.43 };
  landmarks[13] = { x: 0.5, y: 0.63 };
  landmarks[14] = { x: 0.5, y: 0.64 };
  landmarks[78] = { x: 0.46, y: 0.63 };
  landmarks[308] = { x: 0.54, y: 0.63 };
  landmarks[1] = { x: noseX, y: noseY };

  return landmarks;
};

describe("desktop camera proctoring", () => {
  it("flags face_missing after the threshold", () => {
    const state = createInitialDesktopCameraState();

    const first = evaluateDesktopCameraObservation(state, {
      direction: "unclear",
      faceCount: 0,
      pitch: null,
      timestamp: 0,
      yaw: null,
    });

    const second = evaluateDesktopCameraObservation(first.state, {
      direction: "unclear",
      faceCount: 0,
      pitch: null,
      timestamp: 2200,
      yaw: null,
    });

    expect(second.events).toEqual([
      expect.objectContaining({ eventType: "face_missing" }),
    ]);
  });

  it("flags multiple_faces after the threshold", () => {
    const state = createInitialDesktopCameraState();

    const first = evaluateDesktopCameraObservation(state, {
      direction: "unclear",
      faceCount: 2,
      pitch: null,
      timestamp: 0,
      yaw: null,
    });

    const second = evaluateDesktopCameraObservation(first.state, {
      direction: "unclear",
      faceCount: 2,
      pitch: null,
      timestamp: 1200,
      yaw: null,
    });

    expect(second.events).toEqual([
      expect.objectContaining({ eventType: "multiple_faces" }),
    ]);
  });

  it("estimates looking_away from face landmarks", () => {
    const observation = estimateDesktopCameraObservation([singleFace(0.56, 0.51)], 1000);

    expect(observation.faceCount).toBe(1);
    expect(observation.direction).toBe("right");
    expect(observation.yaw).not.toBeNull();
  });

  it("applies cooldown to repeated looking_down events", () => {
    const state = createInitialDesktopCameraState();

    const first = evaluateDesktopCameraObservation(state, {
      direction: "down",
      faceCount: 1,
      pitch: 80,
      timestamp: 0,
      yaw: 0,
    });

    const second = evaluateDesktopCameraObservation(first.state, {
      direction: "down",
      faceCount: 1,
      pitch: 80,
      timestamp: 1900,
      yaw: 0,
    });

    const third = evaluateDesktopCameraObservation(second.state, {
      direction: "down",
      faceCount: 1,
      pitch: 80,
      timestamp: 4000,
      yaw: 0,
    });

    expect(second.events).toEqual([
      expect.objectContaining({ eventType: "looking_down" }),
    ]);
    expect(third.events).toEqual([]);
  });
});
