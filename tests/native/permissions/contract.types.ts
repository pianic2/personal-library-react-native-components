// Typed usage compiled by tsconfig.tests.json. Expo modules are not imported: a structural response is mapped.
import { PermissionsProvider, mapExpoPermission, usePermission } from "../../../src/native/permissions/index.js";
import type { PermissionAdapter, PermissionControls, PermissionKind, PermissionState } from "../../../src/native/permissions/index.js";

declare const Camera: { getCameraPermissionsAsync(): Promise<{ status: string; canAskAgain: boolean }>; requestCameraPermissionsAsync(): Promise<{ status: string; canAskAgain: boolean }> };

export const camera: PermissionAdapter = {
  check: async () => mapExpoPermission(await Camera.getCameraPermissionsAsync()),
  request: async () => mapExpoPermission(await Camera.requestCameraPermissionsAsync()),
};
export const kinds: PermissionKind[] = ["camera", "location", "notifications", "mediaLibrary", "microphone", "contacts"];
export const hook: () => PermissionControls = () => usePermission("camera");
export const states: PermissionState[] = ["undetermined", "granted", "denied", "blocked", "limited", "unavailable"];
export const provider = () => PermissionsProvider({ adapters: { camera } });
