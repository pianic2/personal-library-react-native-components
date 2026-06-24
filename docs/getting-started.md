# Getting Started

Install and import the package by its approved package identity:

```tsx
import { Button, Text, ThemeAppShell, ThemeProvider } from "@personal-library/react-native-components";
```

Use the root package entrypoint for consumer-facing code. Do not import from source internals, build output, component internals, repo-relative paths, or legacy package names.

## Minimal App

```tsx
import { Button, Column, Text, ThemeAppShell, ThemeProvider } from "@personal-library/react-native-components";

export function App() {
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" padding="md">
          <Text>Personal Library components</Text>
          <Button label="Continue" onPress={() => undefined} />
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
```

## Optional Theme Persistence

Theme persistence is opt-in and storage-agnostic. Consumers own the storage implementation and pass it to `ThemeProvider`.

```tsx
import {
  ThemeProvider,
  type ThemeStorageAdapter,
} from "@personal-library/react-native-components";

const themeStorage: ThemeStorageAdapter = {
  getItem: async (key) => appStorage.get(key) ?? null,
  setItem: async (key, value) => {
    appStorage.set(key, value);
  },
};

export function App() {
  return (
    <ThemeProvider persistTheme storage={themeStorage} storageKey="app.theme">
      {/* app */}
    </ThemeProvider>
  );
}
```

If no storage adapter is passed, `ThemeProvider` remains non-persistent and manages theme mode in memory only.

## Current Stability

No component is promoted to `stable` yet. Public candidates are documented as `beta`; platform-risk APIs are documented as `experimental`.

See:

- `docs/components.md`
- `docs/platform-support.md`
- `examples/basic-usage.tsx`
