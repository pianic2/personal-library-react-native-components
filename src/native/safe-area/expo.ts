import type { ComponentType, ReactNode } from "react";
import type { Insets, SafeAreaAdapter } from "./types.js";

/** Structural slice of `react-native-safe-area-context`; the module is injected by the app, never imported here. */
export interface SafeAreaContextModuleLike {
  useSafeAreaInsets(): Insets;
  SafeAreaProvider?: ComponentType<{ children?: ReactNode }>;
}

export interface SafeAreaContextAdapterOptions {
  /** Wrap the tree in the module's `SafeAreaProvider`. Default false (the app usually mounts its own). */
  mountProvider?: boolean;
}

/** Adapter over an injected `react-native-safe-area-context` module. Create once, outside render. */
export function createSafeAreaContextAdapter(
  module: SafeAreaContextModuleLike,
  options: SafeAreaContextAdapterOptions = {}
): SafeAreaAdapter {
  return {
    useInsets: () => module.useSafeAreaInsets(),
    ...(options.mountProvider && module.SafeAreaProvider ? { Provider: module.SafeAreaProvider } : {}),
  };
}
