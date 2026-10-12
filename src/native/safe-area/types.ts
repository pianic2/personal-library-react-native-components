/** Safe-area distances in points. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type Edge = "top" | "right" | "bottom" | "left";

/** `noop`: nothing was provided, insets come from the React Native / web fallback. `available`: an adapter or override supplied them. */
export type SafeAreaStatus = "noop" | "available";

export interface SafeAreaState {
  insets: Insets;
  status: SafeAreaStatus;
}

/**
 * Safe-area source. `useInsets` is a hook and runs inside {@link SafeAreaInsetsProvider}, so the adapter must keep a
 * stable identity (create it once, outside render).
 */
export interface SafeAreaAdapter {
  useInsets(): Insets;
  /** Optional host provider (for example `SafeAreaProvider`) wrapped around the tree by SafeAreaInsetsProvider. */
  Provider?: import("react").ComponentType<{ children?: import("react").ReactNode }>;
}
