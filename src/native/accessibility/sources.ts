// Accessibility-preference sources used by the hooks when no adapter is injected. No expo-* and no native package:
// the `AccessibilityInfo`, `PixelRatio` and `Dimensions` members of `react-native` core and `matchMedia` (web), all
// looked up defensively so SSR and test shims never throw. Unsupported values are `false` (`fontScale` 1).
import * as ReactNative from "react-native";
import type { AccessibilityApi, AccessibilityPreferences } from "../core/types.js";

/** The preferences of a platform that exposes none. */
export const DEFAULT_PREFERENCES: AccessibilityPreferences = Object.freeze({
  reduceMotion: false,
  reduceTransparency: false,
  screenReader: false,
  boldText: false,
  grayscale: false,
  invertColors: false,
  fontScale: 1,
});

type BooleanKey = Exclude<keyof AccessibilityPreferences, "fontScale">;

const sameValues = (a: AccessibilityPreferences, b: AccessibilityPreferences): boolean =>
  a.reduceMotion === b.reduceMotion &&
  a.reduceTransparency === b.reduceTransparency &&
  a.screenReader === b.screenReader &&
  a.boldText === b.boldText &&
  a.grayscale === b.grayscale &&
  a.invertColors === b.invertColors &&
  a.fontScale === b.fontScale;

const validScale = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1);

function notify(listeners: Iterable<(p: AccessibilityPreferences) => void>, snapshot: AccessibilityPreferences): void {
  const errors: unknown[] = [];
  for (const listener of [...listeners]) {
    try {
      listener(snapshot);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) throw errors[0];
}

/** The slice of `window` the web mapping needs. */
export interface MediaQueryHost {
  matchMedia(query: string): {
    matches: boolean;
    addEventListener?(type: "change", listener: () => void): void;
    removeEventListener?(type: "change", listener: () => void): void;
    addListener?(listener: () => void): void;
    removeListener?(listener: () => void): void;
  };
}

const WEB_QUERIES: ReadonlyArray<readonly [BooleanKey, string]> = [
  ["reduceMotion", "(prefers-reduced-motion: reduce)"],
  ["reduceTransparency", "(prefers-reduced-transparency: reduce)"],
];

/** Web mapping: `prefers-reduced-motion` and `prefers-reduced-transparency`; everything else is false, the scale is 1. */
export function createMediaQueryAccessibility(host: MediaQueryHost): AccessibilityApi {
  const lists = WEB_QUERIES.map(([key, query]) => {
    try {
      return [key, host.matchMedia(query)] as const;
    } catch {
      return [key, undefined] as const; // an engine that rejects the query (older browsers) reads as false
    }
  });
  let last: AccessibilityPreferences = DEFAULT_PREFERENCES;
  const read = (): AccessibilityPreferences => {
    const next = { ...DEFAULT_PREFERENCES };
    for (const [key, list] of lists) next[key] = list?.matches === true;
    if (!sameValues(next, last)) last = next;
    return last;
  };
  return {
    getPreferences: read,
    subscribe(listener) {
      const onChange = () => listener(read());
      for (const [, list] of lists) {
        if (list?.addEventListener) list.addEventListener("change", onChange);
        else list?.addListener?.(onChange);
      }
      return () => {
        for (const [, list] of lists) {
          if (list?.removeEventListener) list.removeEventListener("change", onChange);
          else list?.removeListener?.(onChange);
        }
      };
    },
  };
}

/** The slice of React Native's `AccessibilityInfo` the native mapping needs; every method is optional (older RN). */
export interface RNAccessibilityInfo {
  isReduceMotionEnabled?(): Promise<boolean>;
  isReduceTransparencyEnabled?(): Promise<boolean>;
  isScreenReaderEnabled?(): Promise<boolean>;
  isBoldTextEnabled?(): Promise<boolean>;
  isGrayscaleEnabled?(): Promise<boolean>;
  isInvertColorsEnabled?(): Promise<boolean>;
  addEventListener?(name: string, handler: (enabled: boolean) => void): { remove(): void };
}

export interface RNAccessibilityHost {
  AccessibilityInfo?: RNAccessibilityInfo;
  PixelRatio?: { getFontScale?(): number };
  Dimensions?: { addEventListener?(type: "change", handler: () => void): { remove(): void } };
}

const NATIVE_PREFERENCES: ReadonlyArray<readonly [BooleanKey, Exclude<keyof RNAccessibilityInfo, "addEventListener">, string]> = [
  ["reduceMotion", "isReduceMotionEnabled", "reduceMotionChanged"],
  ["reduceTransparency", "isReduceTransparencyEnabled", "reduceTransparencyChanged"],
  ["screenReader", "isScreenReaderEnabled", "screenReaderChanged"],
  ["boldText", "isBoldTextEnabled", "boldTextChanged"],
  ["grayscale", "isGrayscaleEnabled", "grayscaleChanged"],
  ["invertColors", "isInvertColorsEnabled", "invertColorsChanged"],
];

/**
 * Native mapping. The first subscriber starts one `AccessibilityInfo` event listener per preference plus one initial
 * asynchronous read each; the last unsubscribe removes them and forgets the cache (the next subscriber re-reads). Until
 * a read resolves a preference is `false`. A missing method, a throwing call or a rejected read leaves that preference
 * `false`; a late read after the last unsubscribe is ignored. The font scale is read synchronously on every
 * `getPreferences()` and re-notified on a `Dimensions` change.
 */
export function createReactNativeAccessibility(host: RNAccessibilityHost): AccessibilityApi {
  const listeners = new Set<(p: AccessibilityPreferences) => void>();
  let snapshot: AccessibilityPreferences = DEFAULT_PREFERENCES;
  let generation = 0;
  let subscriptions: Array<{ remove(): void }> = [];

  const readFontScale = (): number => {
    try {
      return validScale(host.PixelRatio?.getFontScale?.());
    } catch {
      return 1;
    }
  };

  const update = (patch: Partial<AccessibilityPreferences>): void => {
    const next = { ...snapshot, ...patch };
    if (sameValues(next, snapshot)) return;
    snapshot = next;
    notify(listeners, snapshot);
  };

  const stop = (): void => {
    generation += 1;
    const active = subscriptions;
    subscriptions = [];
    for (const sub of active) {
      try {
        sub.remove();
      } catch {
        // a failing removal must not block the others
      }
    }
    snapshot = DEFAULT_PREFERENCES;
  };

  const start = (): void => {
    const mine = generation;
    const info = host.AccessibilityInfo;
    const seenEvent = new Set<BooleanKey>(); // an event is newer than any initial read that resolves after it
    try {
      for (const [key, read, event] of NATIVE_PREFERENCES) {
        const sub = info?.addEventListener?.(event, (enabled) => {
          if (mine !== generation) return;
          seenEvent.add(key);
          update({ [key]: enabled === true });
        });
        if (sub) subscriptions.push(sub);
        const promise = info?.[read]?.();
        if (promise && typeof promise.then === "function")
          promise.then(
            (enabled) => {
              if (mine === generation && !seenEvent.has(key)) update({ [key]: enabled === true });
            },
            () => undefined
          );
      }
      const dims = host.Dimensions?.addEventListener?.("change", () => {
        if (mine === generation) update({ fontScale: readFontScale() });
      });
      if (dims) subscriptions.push(dims);
    } catch (error) {
      stop();
      throw error;
    }
  };

  return {
    getPreferences() {
      const fontScale = readFontScale();
      if (fontScale !== snapshot.fontScale) snapshot = { ...snapshot, fontScale };
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        try {
          start();
        } catch (error) {
          listeners.delete(listener);
          throw error;
        }
      }
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
  };
}

const inertAccessibility: AccessibilityApi = { getPreferences: () => DEFAULT_PREFERENCES, subscribe: () => () => undefined };

let resolved: { key: unknown; api: AccessibilityApi } | undefined;

/** Fallback when no adapter was injected: web `matchMedia`, else React Native core, else an inert all-false api. One instance per source. */
export function resolveFallbackAccessibility(): AccessibilityApi {
  const matchMedia = (globalThis as { matchMedia?: unknown }).matchMedia;
  if (typeof matchMedia === "function") {
    // `window.matchMedia` throws "Illegal invocation" when called with another `this`, so it is always called on globalThis.
    if (resolved?.key !== matchMedia)
      resolved = {
        key: matchMedia,
        api: createMediaQueryAccessibility({
          matchMedia: (query) => (matchMedia as (q: string) => ReturnType<MediaQueryHost["matchMedia"]>).call(globalThis, query),
        }),
      };
    return resolved.api;
  }
  const rn = ReactNative as unknown as RNAccessibilityHost;
  if (rn.AccessibilityInfo && typeof rn.AccessibilityInfo.addEventListener === "function") {
    if (resolved?.key !== rn.AccessibilityInfo) resolved = { key: rn.AccessibilityInfo, api: createReactNativeAccessibility(rn) };
    return resolved.api;
  }
  return inertAccessibility;
}
