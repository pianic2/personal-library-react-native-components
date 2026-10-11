import React, { createContext, useMemo } from "react";

/** `system` follows the OS setting, `always` reduces motion regardless, `never` keeps motion regardless. */
export type ReduceMotionMode = "system" | "always" | "never";

export interface MotionProviderProps {
  /** App-level override of the reduced-motion preference. Defaults to `"system"`. */
  reduceMotion?: ReduceMotionMode;
  children?: React.ReactNode;
}

export interface MotionContextValue {
  reduceMotion: ReduceMotionMode;
}

/** Without a provider the preference follows the system, which is also the SSR/test-safe default. */
export const MotionContext = createContext<MotionContextValue>({ reduceMotion: "system" });

function isMode(value: unknown): value is ReduceMotionMode {
  return value === "system" || value === "always" || value === "never";
}

export function MotionProvider({ reduceMotion = "system", children }: MotionProviderProps): React.ReactElement {
  // An unknown value (for example from untyped JS) falls back to the system preference instead of disabling motion by accident.
  const mode: ReduceMotionMode = isMode(reduceMotion) ? reduceMotion : "system";
  const value = useMemo<MotionContextValue>(() => ({ reduceMotion: mode }), [mode]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
