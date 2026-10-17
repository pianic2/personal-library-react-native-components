// Typed usage compiled by tsconfig.tests.json. The module is declared locally: expo-local-authentication is not imported.
import { createExpoBiometricAdapter, createExpoBiometrics, createNoopBiometrics, useBiometricPrompt } from "../../../src/native/biometrics/index.js";
import type { BiometricAdapter, BiometricError, BiometricPrompt, BiometricResult } from "../../../src/native/biometrics/index.js";

declare const LocalAuthentication: {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  authenticateAsync(options: { promptMessage?: string; disableDeviceFallback?: boolean; cancelLabel?: string }): Promise<{ success: boolean; error?: string }>;
};

export const adapter: BiometricAdapter = createExpoBiometrics(LocalAuthentication as never);
export const capability = createExpoBiometricAdapter();
export const noop: BiometricAdapter = createNoopBiometrics();
export const hook: () => BiometricPrompt = () => useBiometricPrompt({ adapter });
export const run = async (): Promise<BiometricError | null> => {
  const result: BiometricResult = await adapter.authenticate({ reason: "Unlock", fallbackToPasscode: true });
  return result.success ? null : result.error;
};
