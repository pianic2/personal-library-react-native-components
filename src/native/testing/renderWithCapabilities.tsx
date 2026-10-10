import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { CapabilityProvider } from "../core/CapabilityProvider.js";
import type { CapabilityAdapters } from "../core/types.js";
import type { MockAdapterSet } from "./mockAdapters.js";

/**
 * Renders `ui` inside a `CapabilityProvider` and returns the react-test-renderer instance. `adapters` is either the
 * result of `createMockAdapters()` or a plain adapters object. `react-test-renderer` is a dev dependency of the host
 * app's tests, not of the library runtime.
 */
export function renderWithCapabilities(
  ui: React.ReactElement,
  adapters?: MockAdapterSet | CapabilityAdapters
): TestRenderer.ReactTestRenderer {
  const bag = adapters && "adapters" in adapters && "calls" in adapters ? (adapters as MockAdapterSet).adapters : (adapters as CapabilityAdapters | undefined);
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<CapabilityProvider adapters={bag}>{ui}</CapabilityProvider>);
  });
  return renderer;
}
