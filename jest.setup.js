/* eslint-disable no-undef */

// In-memory AsyncStorage mock so the persistence layer works under Jest.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Silence the reanimated warning in the test environment.
global.__reanimatedWorkletInit = () => {};

// expo-router depends on native/navigation context we don't mount in unit
// tests. Provide lightweight mocks so components that navigate still render.
const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => ({
  useRouter: () => routerMock,
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: ({ children }) => children,
  Redirect: () => null,
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
}));

// Expose the router mock so individual tests can assert on navigation.
global.__expoRouterMock = routerMock;

// Safe-area context needs a provider/native module; use its built-in test mock.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);
