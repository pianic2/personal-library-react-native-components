# E8 - Native capabilities and device APIs: proposals

Baseline: react >=19.2.3, react-native >=0.86 <0.87, Expo SDK 57. Evidence: package.json (peers react, react-native only; no dependencies), audit/dependencies/{native-dependency-gate, peer-dependency-policy, clipboard-dependency-strategy, safe-area-provider-dependency-contract}.md, src/theme/types.ts (ThemeStorageAdapter), src/components/Link (LinkRouterAdapter), src/utils/platform.ts.
Note: peer-dependency-policy.md still lists RN 0.85 / Expo 56; package.json says 0.86. Doc refresh belongs to E14.

## 1. Constraints that shape the design

- Root import must stay free of native/Expo imports (gate, PLRNUI-39: `expo-clipboard` forbidden in every package.json section and in root-reachable code).
- Any optional peer (`peerDependenciesMeta`) or API split needs ADR + breaking-change register + PLRNUI-46 smoke row. Proposal avoids optional peers entirely: ticket E8-02 writes the ADR.
- Cutover compatibility: all paths are relative to the package; the future Texo shim re-exports `/native/*` unchanged.

## 2. Architecture: the `capabilities` pattern (ticket E8-01)

Entry points (wildcard exports, owned by E8-02):

| Subpath | Content | Native imports |
| --- | --- | --- |
| `/native` | CapabilityProvider, registry, `useCapability`, types | none (react, react-native only) |
| `/native/<name>` | contract, hooks, noop/RN-core/web fallback | RN core only |
| `/native/<name>/expo` | Expo-backed adapter factory | Expo module via injection or lazyRequire, structural types (no expo type import, so `tsc` builds without Expo) |
| `/native/testing` | mock adapters, `renderWithCapabilities` | none |
| `/native/expo` | `createExpoCapabilities()` one-line preset | lazyRequire of each known module |

Contract sketch:

```ts
interface CapabilityMap { haptics: HapticsAdapter; clipboard: ClipboardAdapter; /* module-augmentable */ }
type CapabilityStatus = 'available' | 'unavailable' | 'noop';
<CapabilityProvider adapters={{ haptics: createExpoHaptics(require('expo-haptics')) }}>
const haptics = useCapability('haptics'); // never undefined, never throws
```

Resolution order: provider adapter > registry default > RN-core/web fallback > noop. Missing module yields `unavailable`, never an exception. Injection (`createExpoX(require('expo-x'))`) is the Metro-safe default; the preset uses try/catch lazyRequire and returns a report of what was found. Tests and web mount no provider (or the testing mocks) and stay deterministic. Hooks never auto-request permissions or touch hardware on mount.

Install story for consumers: `npx expo install expo-haptics` then add to the provider (or use the preset). Library `package.json` is untouched.

## 3. Capability matrix

Legend: Go = Expo Go (SDK 57); items marked "verify" must be confirmed by E8-27 before claims go in docs.

| Capability (ticket) | Wraps | Fallback without it | Expo Go | Web | Test strategy |
| --- | --- | --- | --- | --- | --- |
| Haptics (13,14) | expo-haptics | Android Vibration; iOS noop | yes | navigator.vibrate or noop | mock records semantic calls; table test |
| Clipboard (15) | expo-clipboard (consumer-injected) | status noop, copy resolves false | yes | navigator.clipboard | fake timers for copied state |
| Share (16) | RN Share (no Expo pkg) | n/a (RN core) | yes | navigator.share else unsupported | mock Share result mapping |
| Keyboard (10) | RN Keyboard, KeyboardAvoidingView | n/a | yes | no-op avoiding view | mock keyboard emitter |
| Safe area (11) | react-native-safe-area-context | zero insets, noop; web env() | yes | CSS env() | mock insets via adapter |
| Status bar / system UI (12) | RN StatusBar; expo-system-ui; expo-navigation-bar | StatusBar only | yes (Android nav bar verify) | meta theme-color | mock adapter, rejecting-promise test |
| Appearance (4) | RN Appearance | light | yes | matchMedia | mock listener |
| Font scale / a11y prefs (5) | RN AccessibilityInfo, PixelRatio | false / scale 1 | yes | matchMedia where exists | mock emitter |
| Network (7) | expo-network or netinfo | unknown (null), not false | yes | navigator.onLine | mock subscribe |
| App state (6) | RN AppState | n/a | yes | visibilitychange | mock emitter |
| Orientation (8) | RN Dimensions; expo-screen-orientation (lock) | lock resolves false | yes | matchMedia | mock Dimensions |
| Device info (9) | RN Platform; expo-device, expo-constants | core fields only | yes (isExpoGo detectable) | os 'web' | adapter override test |
| Permissions (19,20) | expo-camera, expo-media-library, expo-location, expo-notifications | status 'unavailable' | camera/location yes; notifications and media-library partial (verify) | Permissions API where exists else unavailable | `setPermission` mock, normalizer table |
| Image picker/camera field (21) | expo-image-picker | web file input; else unavailable | yes | input type=file | mock adapter, field render states |
| Document picker field (22) | expo-document-picker | web file input | yes | input type=file | result normalization table |
| Storage (23) | @react-native-async-storage, expo-secure-store | memory; secure has NO insecure fallback | yes | localStorage (non-secure only) | shared conformance suite |
| Biometrics (24) | expo-local-authentication | unavailable, never success | partial: Face ID not in Expo Go (verify) | unavailable | error-code mapping |
| Linking / deep links (17) | RN Linking; expo-linking, expo-web-browser | Linking only | yes | window.open noopener | scheme allowlist, parse table |
| Back handler (18) | RN BackHandler | noop (iOS/web) | yes | noop | priority stack test |
| Splash / app-ready (25) | expo-splash-screen | gate without splash | yes (custom splash config ignored) | noop | fake timers, once-only hide |

Security rules: `javascript:` and unknown schemes rejected in `useOpenURL`; secure storage never degrades silently; noop biometrics never returns success.

## 4. Ticket map (tickets/E8.json, 28 tickets)

- Foundation: E8-01 contract, E8-02 exports/ADR/boundary check (epic E14), E8-03 testing mocks. All others depend on E8-01.
- RN-core hooks (no deps): 04 appearance, 05 a11y/font scale, 06 app state, 08 orientation, 09 device, 10 keyboard, 16 share, 18 back handler, 12 status bar.
- Adapters: 07 network, 11 safe area, 13/14 haptics, 15 clipboard, 17 linking, 23 storage, 24 biometrics, 25 app-ready.
- Permissions and fields: 19 core, 20 Expo adapters, 21 image picker, 22 document picker.
- Integration: 26 Expo preset, 27 smoke matrix (epic E12), 28 docs/manifest (epic E16).
- filesTouched are disjoint (`src/native/<name>/**`, `tests/native/<name>/**`); only E8-02 touches package.json (exports block only; coordinate with E14).
- Cross-stream hooks (not owned here): E1 wires HapticPressable into Button/Switch/Checkbox; E6 consumes safe-area and back-handler in Modal/BottomSheet/app shell; E3 consumes reduced-motion; E5 uses keyboard primitives and picker fields; E2 can accept `'system'` via `resolveThemeMode`.

## 5. Rejected ideas

| Idea | Why rejected |
| --- | --- |
| Wrapping `expo-camera` CameraView or `expo-video`/`expo-av` | Expo's component is already the API; wrapper adds props drift. Only permission and picker flows are wrapped. |
| Re-exporting Expo modules from Texo | Hides versions, breaks `expo install` alignment, violates gate. |
| Declaring expo-* as optional peers (`peerDependenciesMeta`) | Triggers ADR and install warnings; PLRNUI-39 forbids for clipboard. Injection/lazyRequire is cheaper. Revisit only via E8-02 ADR. |
| `expo-sharing`, `expo-file-system` wrappers | File sharing/IO is app-specific; Expo API is already one call. |
| Geolocation/notification scheduling hooks | Domain logic, not UI-library concern; only permission state is unified. |
| `expo-constants` generic config reader | Single import in app code; wrapping adds nothing beyond isExpoGo in E8-09. |
| `expo-font` loading wrapper | `useFonts` is already minimal; AppReadyGate just accepts it as a task. |
| react-native-keyboard-controller dependency | Native dep; RN KeyboardAvoidingView plus hooks suffice for 1.0. Could be a later adapter. |
| Own network library (polling) | Adapters over expo-network/netinfo are enough. |
| Auto-requesting permissions in provider | Surprising UX and store-review risk. |
| Persisting theme inside CapabilityProvider | ThemeStorageAdapter already exists; E8-23 only supplies backends. |
| Global singleton registry only (no provider) | Non-deterministic tests, SSR leakage; provider with module fallback chosen. |

## 6. Risks and open questions

1. Metro behaviour for try/catch `require` of absent modules across Metro versions: validate in E8-27; injection is the guaranteed path.
2. Expo Go partial support (notifications, media library, Face ID) is from memory of recent SDKs; do not publish claims before E8-27.
3. Secure storage and biometrics are privacy-sensitive: gate requires a Risk Assessment (attach to E8-23).
4. `package.json` is a shared file with E14; E8-02 edits only the `exports` block.
5. Doc drift: peer-dependency-policy.md (RN 0.85, Expo 56) vs package.json (0.86); schedule refresh with E14/E17.
