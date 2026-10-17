// Structural adapter for an injected `expo-local-authentication` module (the module itself is never imported here).
//
// iOS Face ID is not available in Expo Go: it needs a development build (or a production build) whose Info.plist has
// `NSFaceIDUsageDescription` (the Expo config plugin option `faceIDPermission` of `expo-local-authentication` sets it).
// Without it, iOS can not use Face ID and the module reports an error that this adapter maps to `unavailable`.
import { defineExpoAdapter } from "../core/defineExpoAdapter.js";
import type { BiometricApi } from "../core/types.js";
import type { BiometricAdapter, BiometricError, BiometricResult } from "./types.js";

/** The slice of `expo-local-authentication` the adapter needs. */
export interface ExpoLocalAuthenticationLike {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  authenticateAsync(options: {
    promptMessage?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: true } | { success: false; error?: string; warning?: string }>;
}

/**
 * Result table: the `error` string of a failed `authenticateAsync` and the code it becomes.
 * Anything not listed (including `authentication_failed`, `not_available`, `timeout` and `unknown`) is `unavailable`:
 * an unrecognised answer fails closed, it never turns into a success.
 */
export const EXPO_BIOMETRIC_ERRORS: Readonly<Record<string, BiometricError>> = Object.freeze({
  user_cancel: "cancelled",
  app_cancel: "cancelled",
  system_cancel: "cancelled",
  user_fallback: "cancelled",
  not_enrolled: "notEnrolled",
  passcode_not_set: "notEnrolled",
  lockout: "lockout",
  not_available: "unavailable",
});

export function mapExpoBiometricError(error: unknown): BiometricError {
  return (typeof error === "string" && Object.hasOwn(EXPO_BIOMETRIC_ERRORS, error) ? EXPO_BIOMETRIC_ERRORS[error] : undefined) ?? "unavailable";
}

/**
 * Maps an injected `expo-local-authentication` module onto the biometric adapter. Missing hardware gives `unavailable`,
 * no enrolled identity gives `notEnrolled`; only a module result of `success: true` is a success. Never rejects.
 */
export function createExpoBiometrics(module: ExpoLocalAuthenticationLike): BiometricAdapter {
  const check = async (): Promise<BiometricError | null> => {
    if (!(await module.hasHardwareAsync())) return "unavailable";
    if (!(await module.isEnrolledAsync())) return "notEnrolled";
    return null;
  };
  return {
    isAvailable: async () => {
      try {
        return (await check()) === null;
      } catch {
        return false;
      }
    },
    async authenticate({ reason, fallbackToPasscode = false }): Promise<BiometricResult> {
      try {
        const problem = await check();
        if (problem) return { success: false, error: problem };
        const result = await module.authenticateAsync({ promptMessage: reason, disableDeviceFallback: !fallbackToPasscode });
        return result.success === true ? { success: true } : { success: false, error: mapExpoBiometricError((result as { error?: unknown }).error) };
      } catch {
        return { success: false, error: "unavailable" };
      }
    },
  };
}

/** The `biometric` capability api (boolean result) over the same module, for `CapabilityProvider`. */
export function createExpoBiometricApi(module: ExpoLocalAuthenticationLike): BiometricApi {
  const adapter = createExpoBiometrics(module);
  return {
    isAvailable: () => adapter.isAvailable(),
    authenticate: async (promptMessage) => (await adapter.authenticate({ reason: promptMessage })).success,
  };
}

/** Capability adapter factory: `available` with the module, `unavailable` (noop api) without it. Pass it to CapabilityProvider. */
export const createExpoBiometricAdapter = defineExpoAdapter<"biometric", ExpoLocalAuthenticationLike>("biometric", createExpoBiometricApi);
