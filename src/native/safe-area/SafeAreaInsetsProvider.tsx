import React from "react";
import { ZERO_INSETS, readFallbackInsets } from "./fallback.js";
import type { Insets, SafeAreaAdapter, SafeAreaState } from "./types.js";

const SafeAreaContext = React.createContext<SafeAreaState | null>(null);

const same = (a: Insets, b: Insets) => a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
const clean = (v: number | undefined): number => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);

export interface SafeAreaInsetsProviderProps {
  children?: React.ReactNode;
  /** Fixed insets (tests, previews, fixed shells). Wins over `adapter`. */
  insets?: Partial<Insets>;
  /** Source of live insets, for example from `createSafeAreaContextAdapter`. */
  adapter?: SafeAreaAdapter;
}

function FromAdapter({ adapter, children }: { adapter: SafeAreaAdapter; children?: React.ReactNode }) {
  const live = adapter.useInsets();
  const insets = React.useMemo<Insets>(
    () => ({ top: clean(live?.top), right: clean(live?.right), bottom: clean(live?.bottom), left: clean(live?.left) }),
    [live?.top, live?.right, live?.bottom, live?.left]
  );
  const value = React.useMemo<SafeAreaState>(() => ({ insets, status: "available" }), [insets]);
  return <SafeAreaContext.Provider value={value}>{children}</SafeAreaContext.Provider>;
}

/**
 * Supplies insets to {@link useInsets}, {@link useSafeAreaState} and SafeAreaBox. Mount it once: do not nest it inside a
 * host `SafeAreaProvider` that the adapter's own `Provider` already mounts (no double provider). Without it, hooks fall
 * back to React Native core / web values with status `noop`. Switching a mounted provider between `insets` and `adapter`
 * remounts its subtree. Does not touch ThemeProvider (PLRNUI-28 contract).
 */
export function SafeAreaInsetsProvider({ children, insets, adapter }: SafeAreaInsetsProviderProps) {
  const fixed = React.useMemo<SafeAreaState | null>(
    () =>
      insets
        ? { insets: { top: clean(insets.top), right: clean(insets.right), bottom: clean(insets.bottom), left: clean(insets.left) }, status: "available" }
        : null,
    [insets?.top, insets?.right, insets?.bottom, insets?.left, insets === undefined]
  );
  if (fixed) return <SafeAreaContext.Provider value={fixed}>{children}</SafeAreaContext.Provider>;
  if (adapter) {
    const Host = adapter.Provider;
    const inner = <FromAdapter adapter={adapter}>{children}</FromAdapter>;
    return Host ? <Host>{inner}</Host> : inner;
  }
  return <>{children}</>;
}

export function useSafeAreaContext(): SafeAreaState | null {
  return React.useContext(SafeAreaContext);
}

/** Insets plus their source: `{ insets, status }`. Status is `noop` when only the fallback is in use. */
export function useSafeAreaState(): SafeAreaState {
  const ctx = React.useContext(SafeAreaContext);
  const cache = React.useRef<SafeAreaState | null>(null);
  if (ctx) return ctx;
  const next = readFallbackInsets();
  // Stable identity while the fallback values are unchanged, so `state` is safe in dependency arrays.
  if (!cache.current || !same(cache.current.insets, next)) cache.current = { insets: next, status: "noop" };
  return cache.current;
}

/** Current insets: provider/adapter values, else the fallback (Android status bar height, otherwise zeros). */
export function useInsets(): Insets {
  return useSafeAreaState().insets;
}

/** Insets from a provider only; zeros when none is mounted (no platform fallback). */
export function useSafeInsets(): Insets {
  return React.useContext(SafeAreaContext)?.insets ?? ZERO_INSETS;
}
