/* eslint-disable no-undef */

// In-memory AsyncStorage mock so the persistence layer works under Jest.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Silence the reanimated warning in the test environment.
global.__reanimatedWorkletInit = () => {};
