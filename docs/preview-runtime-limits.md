# Preview web shims and runtime limits

## Scope

The preview web environment is only a browser documentation/demo surface. It is
useful for checking how docs or a repo-local demo render in a web preview, but
it is not the public package contract and is not a consumer Expo/React Native
runtime.

`preview-web/shims/**`, when present, are documentation infrastructure. They
are not public API, are not exported from the package, and are not versioned as
a supported consumer contract.

## Preview web is not Expo/RN validation

Passing preview web does not prove Expo, Metro, native runtime, iOS, Android,
Hermes, or React Native compatibility.

Expo/RN validation must be done through real Expo/React Native consumer
validation, not through Vite preview. A valid consumer check installs the
published package or generated tarball in an external app, imports from the
approved public package entrypoint, and exercises the selected Expo/RN toolchain
directly.

## Shim and alias matrix

| Preview alias/shim | Preview target | Purpose | Public consumer API? | Runtime limit |
| --- | --- | --- | --- | --- |
| `react-native` | `react-native-web` | Allows browser rendering of RN primitives in docs preview. | No | Does not validate native RN behavior, Metro resolution, platform APIs, Hermes, iOS, or Android. |
| `react-native-safe-area-context` | Preview shim | Provides browser-safe `SafeAreaProvider` / `useSafeAreaInsets` fallback. | No | Does not validate native safe-area insets or device cutout behavior. |
| `@react-native-async-storage/async-storage` | `localStorage` shim | Allows persistence-like behavior in browser preview. | No | `localStorage` semantics differ from AsyncStorage native behavior. |
| `expo-clipboard` | Browser Clipboard shim | Maps preview copy operations to browser Clipboard APIs. | No | Does not validate Expo Clipboard permissions or native behavior. |
| `lucide-react-native` | `lucide-react` | Allows icon rendering in browser preview. | No | Does not validate `react-native-svg` or native icon behavior. |
| `@` alias | Repo root | Vite/doc authoring convenience. | No | Consumer apps must not depend on repo-local aliases. |
| `preview-web/shims/**` | Local preview shims | Browser-only compatibility layer. | No | Not exported and not versioned as a public package contract. |

## Runtime limits

Preview web does not validate:

- package installation in a clean Expo or React Native app;
- npm peer dependency resolution;
- Metro package root resolution or package export map behavior;
- generated TypeScript declarations in a consumer project;
- native Safe Area behavior;
- native AsyncStorage behavior;
- Expo Clipboard permissions or native module availability;
- `react-native-svg` behavior used by native icon packages;
- Hermes, iOS, Android, Expo Go, prebuild, or custom dev-client behavior;
- absence of duplicate React or React Native copies in a consumer app.

## Consumer example boundary

Consumer examples must import only from the approved public package API, for
example:

```tsx
import { Button, Text } from "@personal-library/react-native-components";
```

Consumer examples must not import from `preview-web/shims/**`, must not rely on
the Vite `@` alias, and must not use repo-local package paths such as
`../../index`, `src/*`, or `dist/*`.

If a docs example needs an API or type that is not public, register the API gap
instead of bypassing the public package surface with a deep import or preview
alias.

## Troubleshooting link

For current consumer-facing platform posture, see
[Platform Support](platform-support.md). For consumer install, Metro, TypeScript
and native runtime triage, see
[Expo / React Native / Metro troubleshooting](expo-rn-metro-troubleshooting.md).

The detailed Expo/RN/Metro troubleshooting outline is tracked as audit evidence
in `audit/docs/expo-rn-metro-troubleshooting-outline.md`. That outline is the
place to record Metro, package export, native module, peer dependency, and
clean-consumer validation gaps until a dedicated troubleshooting page is added
to the docs.
