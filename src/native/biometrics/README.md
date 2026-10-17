# Biometric prompt (`native/biometrics`)

A normalised biometric prompt over an injected `expo-local-authentication` module. Reached through the `./native` subpath once the export contract wires it (Expo factories through `./native/expo`); never from the root entry. This folder imports no native package and the package adds no dependency.

## API

```ts
type BiometricError = "cancelled" | "notEnrolled" | "lockout" | "unavailable";
type BiometricResult = { success: true } | { success: false; error: BiometricError };

interface BiometricAdapter {
  isAvailable(): Promise<boolean>; // hardware present and an identity enrolled
  authenticate(options: { reason: string; fallbackToPasscode?: boolean }): Promise<BiometricResult>; // never rejects
}
```

- `createExpoBiometrics(LocalAuthentication)`: the Expo mapping. Missing hardware is `unavailable`, no enrolled identity is `notEnrolled`. The module's `error` strings map through `EXPO_BIOMETRIC_ERRORS` (`user_cancel`, `app_cancel`, `system_cancel`, `user_fallback` to `cancelled`; `not_enrolled`, `passcode_not_set` to `notEnrolled`; `lockout` to `lockout`; anything else to `unavailable`, so an unknown answer fails closed).
- `createNoopBiometrics()`: web and unconfigured apps. `isAvailable` is false and `authenticate` resolves `unavailable`; it never reports success.
- `useBiometricPrompt({ adapter })`: `{ authenticate, loading, result, error }`. Without an adapter it uses the noop one.
- `createExpoBiometricAdapter(LocalAuthentication)`: the same module as the `biometric` capability of `CapabilityProvider` (boolean `authenticate(promptMessage)`).

```ts
import * as LocalAuthentication from "expo-local-authentication"; // in the app, not in this package
const biometrics = createExpoBiometrics(LocalAuthentication);
const { authenticate, loading } = useBiometricPrompt({ adapter: biometrics }); // memoize or hoist `biometrics`
const outcome = await authenticate({ reason: "Unlock your library", fallbackToPasscode: true });
```

## iOS Face ID

Face ID is **not available in Expo Go**. Use a development build or a production build, and set `NSFaceIDUsageDescription` in the app (the config plugin option `faceIDPermission` of `expo-local-authentication` writes it). Without that key iOS refuses Face ID and the adapter reports `unavailable`. Touch ID and Android biometrics do not need it.
