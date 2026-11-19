/* eslint-disable no-undef */

// In-memory AsyncStorage mock so the persistence layer works under Jest.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Silence the reanimated warning in the test environment.
global.__reanimatedWorkletInit = () => {};

// expo-router depends on native/navigation context we don't mount in unit
// tests. Provide lightweight mocks so components that navigate still render.
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: ({ children }) => children,
  Redirect: () => null,
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
}));

// Expose the router mock so individual tests can assert on navigation.
global.__expoRouterMock = mockRouter;

// Keep NativeWind's safe-area wrapper pointed at valid test components.
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});
