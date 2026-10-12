// Keyboard host used when none is injected: the `Keyboard` and `Platform` members of `react-native` core, looked up
// defensively so SSR, web and test shims that lack them never throw. No expo-* and no native package.
import * as ReactNative from "react-native";
import type { KeyboardHost } from "./types.js";

export function resolveKeyboardHost(): KeyboardHost | undefined {
  const keyboard = (ReactNative as unknown as { Keyboard?: Partial<KeyboardHost> }).Keyboard;
  if (keyboard && typeof keyboard.addListener === "function" && typeof keyboard.dismiss === "function")
    return keyboard as KeyboardHost;
  return undefined;
}

export function resolvePlatformOS(): string {
  return (ReactNative as unknown as { Platform?: { OS?: string } }).Platform?.OS ?? "web";
}

/** `Keyboard.dismiss()` when available; never throws. */
export function dismissKeyboard(host: KeyboardHost | undefined = resolveKeyboardHost()): void {
  try {
    host?.dismiss();
  } catch {
    // Dismissing is best effort: a host without a keyboard must not crash the press handler.
  }
}
