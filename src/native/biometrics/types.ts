// Contract of the biometric prompt adapter (PLRNUI-368). Types only; no runtime, no native import.

/** Why an authentication did not succeed. */
export type BiometricError = "cancelled" | "notEnrolled" | "lockout" | "unavailable";

export type BiometricResult = { success: true } | { success: false; error: BiometricError };

export interface BiometricAuthenticateOptions {
  /** The reason shown in the system prompt. */
  reason: string;
  /** Let the user fall back to the device passcode. Default `false`. */
  fallbackToPasscode?: boolean;
}

/** A biometric prompt. `authenticate` never rejects: a failure is a `{ success: false, error }` result. */
export interface BiometricAdapter {
  /** True when the device has biometric hardware and at least one enrolled identity. */
  isAvailable(): Promise<boolean>;
  authenticate(options: BiometricAuthenticateOptions): Promise<BiometricResult>;
}
