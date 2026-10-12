// Typed usage compiled by tsconfig.tests.json. The module is declared locally: expo-haptics is not imported.
import { createExpoHapticsAdapter, useHaptics } from "../../../src/native/haptics/index.js";
import type { Haptics } from "../../../src/native/haptics/index.js";

declare const Haptics: {
  impactAsync(style?: unknown): Promise<void>;
  notificationAsync(type?: unknown): Promise<void>;
  selectionAsync(): Promise<void>;
  ImpactFeedbackStyle: { Light: number; Medium: number; Heavy: number };
  NotificationFeedbackType: { Success: number; Warning: number; Error: number };
};

export const adapter = createExpoHapticsAdapter(Haptics);
export const hook: () => Haptics = () => useHaptics({ enabled: true });
