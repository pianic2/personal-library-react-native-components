# Expo permission adapters (`native/permissions-expo`)

Drop-in `PermissionAdapter`s for the unified `usePermission` (`native/permissions`) over injected Expo modules. Reached through the `./native/expo` subpath once the export contract wires it; never from the root entry. This folder imports no Expo package and the package adds no dependency: the app installs the modules and passes them in.

```ts
import * as Camera from "expo-camera"; // in the app, not in this package
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

const adapters = {
  camera: createExpoCameraPermission(Camera),
  mediaLibrary: createExpoMediaLibraryPermission(MediaLibrary),
  location: createExpoLocationPermission(Location),
  notifications: createExpoNotificationsPermission(Notifications),
}; // hoist or memoize
// <PermissionsProvider adapters={adapters}> ... usePermission("camera")
```

## Behaviour

- Each adapter maps its module's responses with `mapExpoPermission` (granted, denied, blocked when `canAskAgain` is false, undetermined, `limited` for media-library `accessPrivileges: "limited"`).
- A module that is missing (`undefined`, `null`, not installed) or too old to have the two functions gives the unavailable adapter (`createUnavailablePermission()`): `check` and `request` resolve `{ status: "unavailable", canAskAgain: false }` and nothing is prompted.
- A rejection of the Expo module propagates; `usePermission` keeps the last known status when an adapter fails.
- `openSettings` is not provided: `usePermission` falls back to React Native's `Linking.openSettings`.

| Adapter | Expo module call | Expo Go | Config plugin keys the app sets |
| --- | --- | --- | --- |
| camera | `Camera.getCameraPermissionsAsync` / `requestCameraPermissionsAsync` | Works | `expo-camera`: `cameraPermission`, `microphonePermission` |
| mediaLibrary | `getPermissionsAsync` / `requestPermissionsAsync` | Partial: on Android, Expo Go can not get full media-library access (use a development build) | `expo-media-library`: `photosPermission`, `savePhotosPermission` |
| location | `getForegroundPermissionsAsync` / `requestForegroundPermissionsAsync` | Works (foreground) | `expo-location`: `locationWhenInUsePermission` |
| notifications | `getPermissionsAsync` / `requestPermissionsAsync` | Partial: remote push is not supported on Android in Expo Go (use a development build); local notifications work | `expo-notifications` plugin options (icon, color); Android 13+ needs the `POST_NOTIFICATIONS` runtime permission |

**SDK 57 note.** Checked against the packages published for SDK 57 (`expo-camera` 57.0.6, `expo-media-library` 57.0.5, `expo-location` 57.0.21, `expo-notifications` 57.0.23; their shipped `.d.ts` files and config plugins, read from the npm registry, nothing installed here):

- The call names in the table exist with the expected shapes, and each response is a `PermissionResponse` (`status`, `granted`, `canAskAgain`); media-library adds `accessPrivileges?: "all" | "limited" | "none"`.
- The plugin option names in the table exist (`expo-camera`: `cameraPermission`, `microphonePermission`; `expo-media-library`: `photosPermission`, `savePhotosPermission`; `expo-location`: `locationWhenInUsePermission`; `expo-notifications`: `icon`, `color`, `defaultChannel`).
- In `expo-camera` 57 the `Camera` object that carries the two permission functions is marked `@hidden` in its types; the documented way is the `useCameraPermissions` hook. The adapter still reads `Camera.getCameraPermissionsAsync`, so pass the module namespace (`import * as Camera from "expo-camera"`, the adapter reads `Camera.Camera`) and expect to revisit it if Expo removes the hidden object (the adapter would then report `unavailable`).
- **Not verified:** the Expo Go column. That is runtime behaviour, which type files do not show, and it is not checked in this environment; the real-device and Expo Go check is E8-27. Treat that column as to-be-confirmed.

Semver impact: minor (new subpath API). The migration-changelog entry belongs to the ticket that owns `audit/migration/migration-changelog.md`.
