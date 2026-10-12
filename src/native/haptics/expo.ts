// Structural adapter for an injected `expo-haptics` module (expo-haptics is never imported here).
import { defineExpoAdapter } from "../core/defineExpoAdapter.js";
import type { HapticsApi } from "../core/types.js";

/** The slice of `expo-haptics` the adapter needs. Enum members are read from the injected module, never hard-coded. */
export interface ExpoHapticsModuleLike {
  impactAsync(style?: unknown): Promise<void>;
  notificationAsync(type?: unknown): Promise<void>;
  selectionAsync(): Promise<void>;
  ImpactFeedbackStyle?: { Light?: unknown; Medium?: unknown; Heavy?: unknown };
  NotificationFeedbackType?: { Success?: unknown; Warning?: unknown; Error?: unknown };
}

const IMPACT = { light: "Light", medium: "Medium", heavy: "Heavy" } as const;
const NOTIFICATION = { success: "Success", warning: "Warning", error: "Error" } as const;

/** Maps the semantic api onto an injected `expo-haptics` module. Throws nothing itself; rejections reach the caller. */
export function createExpoHaptics(module: ExpoHapticsModuleLike): HapticsApi {
  return {
    impact: async (style = "medium") => module.impactAsync(module.ImpactFeedbackStyle?.[IMPACT[style]]),
    notification: async (type) => module.notificationAsync(module.NotificationFeedbackType?.[NOTIFICATION[type]]),
    selection: async () => module.selectionAsync(),
  };
}

/** Capability adapter factory: `available` with the module, `unavailable` (noop api) without it. Pass it to CapabilityProvider. */
export const createExpoHapticsAdapter = defineExpoAdapter<"haptics", ExpoHapticsModuleLike>("haptics", createExpoHaptics);
