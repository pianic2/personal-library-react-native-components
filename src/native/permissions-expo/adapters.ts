import { mapExpoPermission } from "../permissions/map.js";
import type { ExpoPermissionResponseLike } from "../permissions/map.js";
import type { PermissionAdapter, PermissionResult } from "../permissions/types.js";
import type { ExpoCameraModuleLike, ExpoLocationModuleLike, ExpoMediaLibraryModuleLike, ExpoNotificationsModuleLike } from "./types.js";

type Responder = () => Promise<ExpoPermissionResponseLike>;

const UNAVAILABLE: PermissionResult = Object.freeze({ status: "unavailable", canAskAgain: false }) as PermissionResult;

/** The adapter used when the Expo module is missing: both calls resolve `unavailable`, nothing is prompted. */
export function createUnavailablePermission(): PermissionAdapter {
  return { check: async () => UNAVAILABLE, request: async () => UNAVAILABLE };
}

const isFunction = (value: unknown): value is Responder => typeof value === "function";

/**
 * Builds the adapter from a module's `get` and `request` functions. If either is missing (module not installed,
 * not injected, or too old) the adapter is the unavailable one. Responses go through `mapExpoPermission`. A rejection of the
 * module propagates: `usePermission` keeps the last known status when an adapter fails.
 */
function fromModule(owner: unknown, get: unknown, request: unknown): PermissionAdapter {
  if (!isFunction(get) || !isFunction(request)) return createUnavailablePermission();
  return {
    check: async () => mapExpoPermission(await get.call(owner)),
    request: async () => mapExpoPermission(await request.call(owner)),
  };
}

/** `createExpoCameraPermission(await import("expo-camera"))` in the app. Missing module or `Camera` gives the unavailable adapter. */
export function createExpoCameraPermission(module: ExpoCameraModuleLike | null | undefined): PermissionAdapter {
  const camera = module?.Camera;
  return fromModule(camera, camera?.getCameraPermissionsAsync, camera?.requestCameraPermissionsAsync);
}

/** `createExpoMediaLibraryPermission(MediaLibrary)`: `limited` access (selected photos) maps to the `limited` state. */
export function createExpoMediaLibraryPermission(module: ExpoMediaLibraryModuleLike | null | undefined): PermissionAdapter {
  return fromModule(module, module?.getPermissionsAsync, module?.requestPermissionsAsync);
}

/** `createExpoLocationPermission(Location)`: the foreground permission. */
export function createExpoLocationPermission(module: ExpoLocationModuleLike | null | undefined): PermissionAdapter {
  return fromModule(module, module?.getForegroundPermissionsAsync, module?.requestForegroundPermissionsAsync);
}

/** `createExpoNotificationsPermission(Notifications)`. */
export function createExpoNotificationsPermission(module: ExpoNotificationsModuleLike | null | undefined): PermissionAdapter {
  return fromModule(module, module?.getPermissionsAsync, module?.requestPermissionsAsync);
}
