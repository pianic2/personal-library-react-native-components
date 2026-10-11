import type { ReactElement } from "react";
import type { ReactTestRenderer } from "react-test-renderer";
import { createMockAdapters, renderWithCapabilities, type MockAdapterSet } from "../../src/native/testing/index.js";

/** Mock accessibility capability whose system reduce-motion setting starts as `reduceMotion`. */
export function createMotionMocks(reduceMotion = false): MockAdapterSet {
  const mocks = createMockAdapters();
  mocks.setAccessibility({ reduceMotion });
  return mocks;
}

/** Renders `ui` with the accessibility capability mocked; returns the renderer and the mocks to drive the setting. */
export function renderWithMotion(ui: ReactElement, reduceMotion = false): { renderer: ReactTestRenderer; mocks: MockAdapterSet } {
  const mocks = createMotionMocks(reduceMotion);
  return { renderer: renderWithCapabilities(ui, mocks), mocks };
}
