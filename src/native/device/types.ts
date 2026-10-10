// Device and platform info contract (PLRNUI-187). Types only; no runtime, no native import.

export type PlatformOs = "ios" | "android" | "web" | "windows" | "macos" | "unknown";

export interface PlatformInfo {
  /** Operating system. Always filled (from React Native `Platform`, or the adapter when it provides one). */
  os: PlatformOs;
  /** OS version as a string; null when neither React Native nor the adapter knows it (for example on web). */
  osVersion: string | null;
  /**
   * Always a boolean. Core default: iOS `Platform.isPad`; web: from the user agent when available (iPad, "Tablet",
   * Android without "Mobile"), else false; Android tablets are NOT detected without an adapter (React Native has no
   * core signal). On web the adapter's `isTablet` is ignored (the user agent is the only source).
   */
  isTablet: boolean;
  /** null = unknown (no adapter, or the adapter does not know). */
  isEmulator: boolean | null;
  /** null = unknown (no adapter, or the adapter does not know). */
  isExpoGo: boolean | null;
  isWeb: boolean;
  /** null = unknown. */
  hasNotch: boolean | null;
}

/**
 * Optional enrichment, injected by the app (for example built from expo-device and expo-constants).
 * Every field is optional; a field that is absent, undefined or null never overrides the core value.
 */
export interface DeviceInfoAdapter {
  os?: PlatformOs | null;
  osVersion?: string | null;
  isTablet?: boolean | null;
  isEmulator?: boolean | null;
  isExpoGo?: boolean | null;
  hasNotch?: boolean | null;
}

/** Structural shape of the `expo-device` module that the app injects. */
export interface ExpoDeviceModuleLike {
  osName?: string | null;
  osVersion?: string | null;
  isDevice?: boolean;
  deviceType?: number | null; // expo-device DeviceType: 2 = TABLET
}

/** Structural shape of the `expo-constants` module (default export) that the app injects. */
export interface ExpoConstantsModuleLike {
  executionEnvironment?: string | null; // "storeClient" = Expo Go
  appOwnership?: string | null; // "expo" = Expo Go (legacy)
}

/** Source of the core values; defaults to React Native `Platform`. Injectable for tests. */
export interface PlatformSource {
  OS: string;
  Version?: string | number;
  isPad?: boolean;
  /** Web only: navigator.userAgent. Used for the web isTablet default. */
  userAgent?: string;
}
