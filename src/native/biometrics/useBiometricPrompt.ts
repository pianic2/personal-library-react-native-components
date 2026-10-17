import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createNoopBiometrics } from "./noop.js";
import type { BiometricAdapter, BiometricAuthenticateOptions, BiometricError, BiometricResult } from "./types.js";

const noop = createNoopBiometrics();

export interface UseBiometricPromptOptions {
  /** The adapter to use, for example `createExpoBiometrics(LocalAuthentication)`. Default: the noop adapter (never succeeds). */
  adapter?: BiometricAdapter;
}

export interface BiometricPrompt {
  /** Shows the prompt. Resolves a result and never rejects. A second call while one is pending resolves `unavailable` without a prompt. */
  authenticate(options: BiometricAuthenticateOptions): Promise<BiometricResult>;
  /** True while a prompt is pending. */
  loading: boolean;
  /** The result of the last prompt, or null before the first one. */
  result: BiometricResult | null;
  /** The error of the last prompt, or null (also after a success). */
  error: BiometricError | null;
}

/**
 * State around a biometric prompt. With no adapter it uses the noop adapter: `authenticate` resolves
 * `{ success: false, error: "unavailable" }` and `result.success` is never true. State is not set after unmount.
 */
export function useBiometricPrompt(options: UseBiometricPromptOptions = {}): BiometricPrompt {
  const adapter = options.adapter ?? noop;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BiometricResult | null>(null);
  const mounted = useRef(true);
  const pending = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const authenticate = useCallback(
    async (prompt: BiometricAuthenticateOptions): Promise<BiometricResult> => {
      if (pending.current) return { success: false, error: "unavailable" };
      pending.current = true;
      if (mounted.current) setLoading(true);
      let outcome: BiometricResult;
      try {
        const answer = await adapter.authenticate(prompt);
        outcome = answer?.success === true ? { success: true } : { success: false, error: answer && answer.success === false ? answer.error : "unavailable" };
      } catch {
        outcome = { success: false, error: "unavailable" };
      }
      pending.current = false;
      if (mounted.current) {
        setResult(outcome);
        setLoading(false);
      }
      return outcome;
    },
    [adapter]
  );

  const error = result && !result.success ? result.error : null;
  return useMemo(() => ({ authenticate, loading, result, error }), [authenticate, loading, result, error]);
}
