/**
 * Permission kinds. The interface is open: an app can add kinds by augmenting the module that declares it
 * (`declare module "<path to this file>" { interface PermissionKinds { bluetooth: true } }`). The package does not yet
 * expose a `./native` subpath (E14 wiring), so there is no public specifier to augment today.
 */
export interface PermissionKinds {
  camera: true;
  location: true;
  notifications: true;
  mediaLibrary: true;
  microphone: true;
  contacts: true;
}

export type PermissionKind = keyof PermissionKinds;

/**
 * `undetermined`: never asked. `granted`. `denied`: refused, the system may ask again. `blocked`: refused and the system
 * will not ask again (only settings can change it). `limited`: partial access (for example selected photos).
 * `unavailable`: no adapter for the kind, or the platform has no such permission.
 */
export type PermissionState = "undetermined" | "granted" | "denied" | "blocked" | "limited" | "unavailable";

export interface PermissionResult {
  status: PermissionState;
  /** False once the system will not show its prompt again. */
  canAskAgain: boolean;
}

export interface PermissionAdapter {
  check(): Promise<PermissionResult>;
  request(): Promise<PermissionResult>;
  /** Opens the app settings. Without it `usePermission` falls back to React Native's `Linking.openSettings`. */
  openSettings?(): Promise<void>;
}

export type PermissionAdapters = { [K in PermissionKind]?: PermissionAdapter };

export interface PermissionControls {
  status: PermissionState;
  /** False when `blocked` or `unavailable`. */
  canAskAgain: boolean;
  /** True until the first check has settled, and while a request is pending. */
  isLoading: boolean;
  /** Asks the system. Resolves the new status; `unavailable` (without prompting) when no adapter is registered. */
  request(): Promise<PermissionState>;
  /** Opens the app settings (adapter, else `Linking.openSettings`); never rejects. */
  openSettings(): Promise<void>;
}
