/** Development-only warning for a swallowed system UI failure; silent in production. It never throws itself. */
export function warnSwallowed(step: string, error: unknown): void {
  try {
    if ((globalThis as { __DEV__?: boolean }).__DEV__ === true && typeof console !== "undefined") {
      console.warn(`[system-ui] ${step} failed and was ignored:`, error);
    }
  } catch {
    // a hostile console must not turn a swallowed failure into a thrown one
  }
}
