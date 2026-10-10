# Getting Started

> **Language policy.** Public documentation (this site, the README and the policy pages) is written in English. Internal audit and planning material under `audit/` may be written in Italian.

## Stability labels

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component/API is classified as stable.

## Installation

The library is still pre-stable. For the `0.1.0-rc.2` candidate, always install the prerelease explicitly; do not assume that `latest` is the RC channel:

```sh
npm install @personal-library/react-native-components@0.1.0-rc.2
```

The validated consumer baseline for this cycle is Expo SDK 57, React 19.2.3 and React Native 0.86.x. The canonical React and React Native ranges and the Node requirement are the ones declared in the package metadata and must be checked before installing the package.

### Install matrix

The matrix below is generated from `config/compatibility.json` by `node scripts/check-doc-snippets.mjs --write-matrix`; do not edit it by hand. A lane without a validated pass is `residual`: expected to work, but not part of the support claim. See [Compatibility](compatibility.md) for the tiers and the evidence.

<!-- BEGIN GENERATED: install-matrix -->
| Runtime | Platform | Tier | Expo SDK | React Native | React | Last verified |
| --- | --- | --- | --- | --- | --- | --- |
| Expo Go | android | supported | 57.0.21 | 0.86.3 | 19.2.3 | 2026-09-09 |
| Expo Go | ios | residual | 57.0.21 | 0.86.3 | 19.2.3 | not validated |
| Expo dev client | android | residual | 57.0.21 | 0.86.3 | 19.2.3 | not validated |
| Expo dev client | ios | residual | 57.0.21 | 0.86.3 | 19.2.3 | not validated |
| Bare React Native | android | residual | n/a | 0.86.3 | 19.2.3 | not validated |
| Bare React Native | ios | residual | n/a | 0.86.3 | 19.2.3 | not validated |
<!-- END GENERATED: install-matrix -->

The web preview of the repository does not replace this consumer verification: any shims or Vite aliases of the preview do not prove an Expo or React Native install, Metro, iOS, Android, Hermes or the native runtime. See [Preview web shims and runtime limits](preview-runtime-limits.md).

For install, peer dependency, Metro and TypeScript resolver troubleshooting, see [Expo / React Native / Metro troubleshooting](expo-rn-metro-troubleshooting.md).

## Minimal usage

Personal Library React Native Components exposes a theme provider that initializes and supplies `theme` through `useTheme()`.

`ThemeProvider`, `Box` and `Text` are `beta` APIs: usable from the public consumer surface, but the contract may still change before promotion to stable.

```tsx
import React from "react";
import { ThemeProvider, Box, Text } from "@personal-library/react-native-components";

export function App() {
  return (
    <ThemeProvider>
      <Box bg="surface" padding="md">
        <Text weight="bold">Personal Library components</Text>
      </Box>
    </ThemeProvider>
  );
}
```

## Optional theme persistence

Theme persistence is opt-in and storage-agnostic. The consumer app owns the storage implementation and passes it to `ThemeProvider`.

`ThemeStorageAdapter` and opt-in persistence are `beta`; they do not imply a storage dependency owned by the package.

```tsx
import React from "react";
import {
  ThemeProvider,
  type ThemeStorageAdapter,
} from "@personal-library/react-native-components";

const appStorage = new Map<string, string>();

const themeStorage: ThemeStorageAdapter = {
  getItem: async (key) => appStorage.get(key) ?? null,
  setItem: async (key, value) => {
    appStorage.set(key, value);
  },
};

export function App() {
  return (
    <ThemeProvider persistTheme storage={themeStorage} storageKey="app.theme">
      {null}
    </ThemeProvider>
  );
}
```

## Navigation (routing owned by the app)

The navigation components do not include a router: the app passes `pathname` and `navigate(href)`.

`NavBar` and `NavItem` are `beta`. The layout-oriented navigation and app-shell surfaces `TopBar`, `BottomBar` and `SideBar` remain `experimental` in their dedicated pages.

```tsx
import React from "react";
import { NavBar, type NavItem } from "@personal-library/react-native-components";

const items: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings" },
];

export function Shell({ pathname }: { pathname: string }) {
  return (
    <NavBar
      items={items}
      pathname={pathname}
      navigate={(href) => {
        // plug your router in here
        window.location.assign(href);
      }}
      layout="top"
    />
  );
}
```
