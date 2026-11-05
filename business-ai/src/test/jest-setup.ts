/**
 * Optional global Jest setup for app tests (mocks for native modules without a JS fallback).
 * Enable by adding `"setupFiles": ["<rootDir>/src/test/jest-setup.ts"]` to the jest config in
 * package.json. Until then, test files mock these themselves (see src/test/renderWithProviders.tsx).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
