/** Development-only warning for a swallowed system UI failure; silent in production. */
export function warnSwallowed(step: string, error: unknown): void {
  if ((globalThis as { __DEV__?: boolean }).__DEV__ === true && typeof console !== "undefined") {
    console.warn(`[system-ui] ${step} failed and was ignored:`, error);
  }
}
