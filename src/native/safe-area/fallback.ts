// Fallback insets used when no adapter or override is provided. React Native core only (no expo-*, no
// react-native-safe-area-context): `StatusBar.currentHeight` on Android, conservative zero elsewhere.
import * as ReactNative from "react-native";
import type { Edge, Insets } from "./types.js";

export const ZERO_INSETS: Insets = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

const valid = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0);

/** Pure mapping: Android reserves the status bar height at the top; every other platform reports zero. */
export function resolveFallbackInsets(os: string, statusBarHeight?: number): Insets {
  if (os === "android" && valid(statusBarHeight) > 0) return { ...ZERO_INSETS, top: valid(statusBarHeight) };
  return ZERO_INSETS;
}

export function currentPlatformOS(): string {
  return (ReactNative as unknown as { Platform?: { OS?: string } }).Platform?.OS ?? "web";
}

export function readFallbackInsets(): Insets {
  const statusBar = (ReactNative as unknown as { StatusBar?: { currentHeight?: number } }).StatusBar;
  return resolveFallbackInsets(currentPlatformOS(), statusBar?.currentHeight);
}

/** Web style helper: CSS `env(safe-area-inset-*)` padding strings for the given edges (react-native-web accepts them). */
export function safeAreaEnvStyle(edges: readonly Edge[] = ["top", "right", "bottom", "left"]): Record<string, string> {
  const style: Record<string, string> = {};
  for (const edge of edges) style[`padding${edge[0]!.toUpperCase()}${edge.slice(1)}`] = `env(safe-area-inset-${edge})`;
  return style;
}
