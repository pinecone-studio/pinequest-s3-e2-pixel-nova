module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-camera$': '<rootDir>/tests/mocks/expo-camera.tsx',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-router|@react-navigation/.*|react-navigation|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
