// Typed usage compiled by tsconfig.tests.json. The Expo modules are declared locally: no Expo package is imported.
import { PermissionsProvider, usePermission } from "../../../src/native/permissions/index.js";
import type { PermissionAdapters, PermissionControls } from "../../../src/native/permissions/index.js";
import {
  createExpoCameraPermission,
  createExpoLocationPermission,
  createExpoMediaLibraryPermission,
  createExpoNotificationsPermission,
  createUnavailablePermission,
} from "../../../src/native/permissions-expo/index.js";

declare const Camera: Parameters<typeof createExpoCameraPermission>[0];
declare const MediaLibrary: Parameters<typeof createExpoMediaLibraryPermission>[0];
declare const Location: Parameters<typeof createExpoLocationPermission>[0];
declare const Notifications: Parameters<typeof createExpoNotificationsPermission>[0];

export const adapters: PermissionAdapters = {
  camera: createExpoCameraPermission(Camera),
  mediaLibrary: createExpoMediaLibraryPermission(MediaLibrary),
  location: createExpoLocationPermission(Location),
  notifications: createExpoNotificationsPermission(Notifications),
  microphone: createUnavailablePermission(),
};
export const provider = () => PermissionsProvider({ adapters });
export const hook: () => PermissionControls = () => usePermission("camera");
