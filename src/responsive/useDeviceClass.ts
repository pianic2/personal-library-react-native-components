// src/responsive/useDeviceClass.ts
//
// Device class and window-shape hooks. No native import: only `react-native` core (`Platform`) and `matchMedia` (web),
// both looked up defensively.
//
// Limitations (read before relying on these):
// - The class comes from the WINDOW, not the hardware. Split-screen, freeform windows, iPad Slide Over / Stage Manager
//   and resized desktop windows make a tablet report "phone" (shortest side < 600) and a phone report "tablet" when it
//   is unfolded; that is intended for layout purposes.
// - `Platform.isPad` forces "tablet" on native platforms other than macOS and Windows regardless of the window size (it
//   is set on iPad only; Android has no equivalent flag). On web and desktop OSes it is ignored.
// - The pointer is read from `matchMedia` while rendering and is not subscribed to: a pointer change at runtime (docking a
//   mouse) is only seen on the next render, and on the server (no `matchMedia`, fine pointer assumed) a touch device with a
//   window of 1024 or more can hydrate with a different class than the server rendered.
// - Web: "desktop" needs a fine pointer (`(pointer: fine)`) and a window at least 1024 wide; a touch-first wide window
//   (an iPad in the browser) is a "tablet". Without `matchMedia` the pointer is assumed fine.
// - `useAspectPosture` is a heuristic on the window aspect ratio. A foldable that is unfolded often looks "square-ish",
//   but so does a resized desktop window; it cannot tell a fold from a window. Use `FoldAdapter` for real posture data.
import * as ReactNative from "react-native";
import { useBreakpointInfo } from "../hooks/useBreakpoint.js";

export type DeviceClass = "phone" | "tablet" | "desktop";
export type AspectPosture = "normal" | "wide" | "square-ish";

/** Shortest window side (dp) from which a native device counts as a tablet. */
export const TABLET_MIN_SHORTEST_SIDE = 600;
/** Window width (dp) from which a fine-pointer web window counts as a desktop. */
export const DESKTOP_MIN_WIDTH = 1024;

export interface PlatformLike {
  OS?: string;
  isPad?: boolean;
}

/** Pure device-class rule. `finePointer` only matters on web. */
export function resolveDeviceClass(width: number, height: number, platform: PlatformLike, finePointer = true): DeviceClass {
  const shortest = Math.min(width, height);
  if (platform.OS === "web") {
    if (finePointer && width >= DESKTOP_MIN_WIDTH) return "desktop";
    return shortest >= TABLET_MIN_SHORTEST_SIDE ? "tablet" : "phone";
  }
  if (platform.OS === "macos" || platform.OS === "windows") return "desktop";
  if (platform.isPad === true) return "tablet";
  return shortest >= TABLET_MIN_SHORTEST_SIDE ? "tablet" : "phone";
}

/** Pure posture rule on width / height: >= 1.6 is wide, 0.8..1.25 is square-ish, anything else normal. */
export function resolveAspectPosture(width: number, height: number): AspectPosture {
  if (!(width > 0) || !(height > 0)) return "normal";
  const ratio = width / height;
  if (ratio >= 1.6) return "wide";
  if (ratio >= 0.8 && ratio <= 1.25) return "square-ish";
  return "normal";
}

function hasFinePointer(): boolean {
  const matchMedia = (globalThis as { matchMedia?: unknown }).matchMedia;
  if (typeof matchMedia !== "function") return true;
  try {
    const list = (matchMedia as (q: string) => { matches?: boolean }).call(globalThis, "(pointer: fine)");
    return list?.matches !== false;
  } catch {
    return true;
  }
}

/** "phone", "tablet" or "desktop" for the current window and platform. */
export function useDeviceClass(): DeviceClass {
  const { width, height } = useBreakpointInfo();
  const platform = (ReactNative as unknown as { Platform?: PlatformLike }).Platform ?? {};
  return resolveDeviceClass(width, height, platform, platform.OS === "web" ? hasFinePointer() : true);
}

/** "normal", "wide" or "square-ish" from the window aspect ratio (see the limitations above). */
export function useAspectPosture(): AspectPosture {
  const { width, height } = useBreakpointInfo();
  return resolveAspectPosture(width, height);
}

export { useFoldState, FoldAdapterProvider, defaultFoldAdapter } from "./FoldAdapter.js";
export type { FoldAdapter, FoldState, HingeBounds } from "./FoldAdapter.js";
