import React from 'react';

type MockCameraState = {
  capturedPicture: {
    base64?: string;
    format: 'jpg' | 'png';
    height: number;
    uri: string;
    width: number;
  };
  mode: 'ready' | 'error' | 'idle';
  message: string;
  takePictureError: string | null;
};

const getMockCameraState = (): MockCameraState => {
  const sharedState = (globalThis as {
    __expoCameraMockState?: MockCameraState;
  }).__expoCameraMockState;

  return (
    sharedState ?? {
      capturedPicture: {
        base64: 'mock-base64',
        format: 'jpg',
        height: 480,
        uri: 'file:///mock-camera.jpg',
        width: 640,
      },
      mode: 'ready',
      message: 'mock camera mount error',
      takePictureError: null,
    }
  );
};

export const __setMockCameraMode = (
  mode: 'ready' | 'error' | 'idle',
  message = 'mock camera mount error',
) => {
  (globalThis as { __expoCameraMockState?: MockCameraState }).__expoCameraMockState = {
    ...getMockCameraState(),
    mode,
    message,
  };
};

export const __setMockCapturedPicture = (
  picture: Partial<MockCameraState['capturedPicture']>,
) => {
  const current = getMockCameraState();
  (globalThis as { __expoCameraMockState?: MockCameraState }).__expoCameraMockState = {
    ...current,
    capturedPicture: {
      ...current.capturedPicture,
      ...picture,
    },
  };
};

export const __setMockTakePictureError = (message: string | null) => {
  const current = getMockCameraState();
  (globalThis as { __expoCameraMockState?: MockCameraState }).__expoCameraMockState = {
    ...current,
    takePictureError: message,
  };
};

export const __resetMockCamera = () => {
  (globalThis as { __expoCameraMockState?: MockCameraState }).__expoCameraMockState = {
    capturedPicture: {
      base64: 'mock-base64',
      format: 'jpg',
      height: 480,
      uri: 'file:///mock-camera.jpg',
      width: 640,
    },
    mode: 'ready',
    message: 'mock camera mount error',
    takePictureError: null,
  };
};

export const CameraView = React.forwardRef(
  (
    {
      children,
      onCameraReady,
      onMountError,
    }: {
      children?: React.ReactNode;
      onCameraReady?: () => void;
      onMountError?: (event: { message: string }) => void;
    },
    ref: React.ForwardedRef<{
      takePictureAsync: () => Promise<MockCameraState['capturedPicture']>;
    }>,
  ) => {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: async () => {
        const mockState = getMockCameraState();
        if (mockState.takePictureError) {
          throw new Error(mockState.takePictureError);
        }

        return mockState.capturedPicture;
      },
    }));

    React.useEffect(() => {
      const mockState = getMockCameraState();

      if (mockState.mode === 'ready') {
        onCameraReady?.();
        return;
      }

      if (mockState.mode === 'error') {
        onMountError?.({ message: mockState.message });
      }
    }, [onCameraReady, onMountError]);

    return React.createElement('View', { testID: 'camera-view' }, children);
  },
);

CameraView.displayName = 'MockCameraView';

export const useCameraPermissions = jest.fn(() => [
  { granted: true },
  jest.fn(async () => ({ granted: true })),
  jest.fn(async () => ({ granted: true })),
]);

export const Camera = {
  getCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
};
