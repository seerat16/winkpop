/**
 * Ambient types for globals exposed by `jest.setup.js` to the test suite.
 */
interface ExpoRouterMock {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  navigate: jest.Mock;
}

// eslint-disable-next-line no-var
declare var __expoRouterMock: ExpoRouterMock;
