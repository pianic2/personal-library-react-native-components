// App-state sources used by the hooks when no adapter is injected. No expo-* and no native package: only `document` (web)
// and the `AppState` member of `react-native` core, both looked up defensively so SSR and test shims never throw.
import * as ReactNative from "react-native";
import type { AppStateApi, AppStateValue } from "../core/types.js";

/** The slice of `document` the web mapping needs. */
export interface VisibilityDocument {
  visibilityState?: string;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
}

/** Web mapping: `document.visibilityState` "visible" is active, anything else is background. */
export function createVisibilityAppState(doc: VisibilityDocument): AppStateApi {
  const read = (): AppStateValue => (doc.visibilityState === "hidden" ? "background" : "active");
  return {
    getState: read,
    subscribe(listener) {
      const onChange = () => listener(read());
      doc.addEventListener("visibilitychange", onChange);
      return () => doc.removeEventListener("visibilitychange", onChange);
    },
  };
}

/** The slice of React Native's `AppState` the native mapping needs. */
export interface RNAppState {
  currentState?: string;
  addEventListener(type: "change", listener: (state: string) => void): { remove(): void };
}

const toValue = (s: string | undefined): AppStateValue => (s === "background" || s === "inactive" ? s : "active");

/** Native mapping: unknown strings (and a missing `currentState`) map to "active". */
export function createReactNativeAppState(host: RNAppState): AppStateApi {
  return {
    getState: () => toValue(host.currentState),
    subscribe(listener) {
      const sub = host.addEventListener("change", (s) => listener(toValue(s)));
      return () => sub.remove();
    },
  };
}

const inertAppState: AppStateApi = { getState: () => "active", subscribe: () => () => undefined };

/** Fallback when no adapter was injected: web visibility, else React Native `AppState`, else an inert always-active api. */
export function resolveFallbackAppState(): AppStateApi {
  const doc = (globalThis as { document?: Partial<VisibilityDocument> }).document;
  if (doc && typeof doc.addEventListener === "function" && typeof doc.removeEventListener === "function")
    return createVisibilityAppState(doc as VisibilityDocument);
  const rn = (ReactNative as unknown as { AppState?: RNAppState }).AppState;
  if (rn && typeof rn.addEventListener === "function") return createReactNativeAppState(rn);
  return inertAppState;
}
