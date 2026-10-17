// Structural slices of the Expo modules the permission adapters need. No Expo package is imported: the app passes its own.
import type { ExpoPermissionResponseLike } from "../permissions/map.js";

type Responder = () => Promise<ExpoPermissionResponseLike>;

/** The slice of `expo-camera`: `Camera.getCameraPermissionsAsync` / `Camera.requestCameraPermissionsAsync`. */
export interface ExpoCameraModuleLike {
  Camera?: {
    getCameraPermissionsAsync?: Responder;
    requestCameraPermissionsAsync?: Responder;
  };
}

/** The slice of `expo-media-library`. Its `accessPrivileges: "limited"` becomes the `limited` state. */
export interface ExpoMediaLibraryModuleLike {
  getPermissionsAsync?: Responder;
  requestPermissionsAsync?: Responder;
}

/** The slice of `expo-location`: the foreground permission only (tracking is out of scope). */
export interface ExpoLocationModuleLike {
  getForegroundPermissionsAsync?: Responder;
  requestForegroundPermissionsAsync?: Responder;
}

/** The slice of `expo-notifications`. */
export interface ExpoNotificationsModuleLike {
  getPermissionsAsync?: Responder;
  requestPermissionsAsync?: Responder;
}
