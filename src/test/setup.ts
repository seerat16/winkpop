import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { useUserStore } from "@/data/userStore";

// Reset the DOM and the persisted store between tests so state never leaks.
beforeEach(() => {
  localStorage.clear();
  useUserStore.setState({ user: null });
});

afterEach(() => {
  cleanup();
});
