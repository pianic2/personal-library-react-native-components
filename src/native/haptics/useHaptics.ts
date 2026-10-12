import { useMemo } from "react";
import { useCapability } from "../core/CapabilityProvider.js";
import type { CapabilityStatus, HapticsApi } from "../core/types.js";
import { resolveWebHaptics } from "./web.js";

let globalEnabled = true;

/** Global switch (for example a "haptic feedback" setting). Read at call time, so it needs no re-render. Default true. */
export function setHapticsEnabled(enabled: boolean): void {
  globalEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return globalEnabled;
}

export interface UseHapticsOptions {
  /** Per-hook switch. `false` suppresses every call from this hook; the global flag still applies. Default true. */
  enabled?: boolean;
}

export interface Haptics extends HapticsApi {
  /** `noop` when nothing is configured and the platform has no fallback. */
  status: CapabilityStatus;
}

const swallow = (): void => undefined;

/**
 * Semantic haptics: `impact(level)`, `notification(type)`, `selection()`. Resolves the `haptics` capability (provider
 * adapter, registry, then RN-core `Vibration`); with nothing configured on web it falls back to `navigator.vibrate` and
 * otherwise does nothing. Calls are suppressed when the global flag or `enabled` is false, never throw, and always
 * resolve. Not tied to reduced motion: that is a separate setting.
 */
export function useHaptics(options: UseHapticsOptions = {}): Haptics {
  const { enabled = true } = options;
  const adapter = useCapability("haptics");
  const web = useMemo(() => (adapter.status === "noop" ? resolveWebHaptics() : undefined), [adapter]);
  const api = web ?? adapter.api;
  const status: CapabilityStatus = web ? "available" : adapter.status;
  return useMemo<Haptics>(() => {
    const run = (call: () => Promise<void>): Promise<void> => {
      if (!enabled || !globalEnabled) return Promise.resolve();
      try {
        return Promise.resolve(call()).catch(swallow);
      } catch {
        return Promise.resolve();
      }
    };
    return {
      status,
      impact: (style) => run(() => api.impact(style)),
      notification: (type) => run(() => api.notification(type)),
      selection: () => run(() => api.selection()),
    };
  }, [api, status, enabled]);
}
