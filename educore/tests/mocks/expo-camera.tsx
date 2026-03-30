import React from 'react';

export const CameraView = ({
  children,
}: {
  children?: React.ReactNode;
}) => React.createElement('View', null, children);

export const useCameraPermissions = jest.fn(() => [
  { granted: true },
  jest.fn(async () => ({ granted: true })),
  jest.fn(async () => ({ granted: true })),
]);

export const Camera = {
  getCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
};
