import type { BiometricAdapter, BiometricResult } from "./types.js";

const unavailable: BiometricResult = Object.freeze({ success: false, error: "unavailable" }) as BiometricResult;

/**
 * The adapter for web and for apps that configured nothing: no biometrics are available and `authenticate` resolves
 * `{ success: false, error: "unavailable" }`. It never reports success, so it can not be used to unlock anything.
 */
export function createNoopBiometrics(): BiometricAdapter {
  return {
    isAvailable: async () => false,
    authenticate: async () => unavailable,
  };
}
