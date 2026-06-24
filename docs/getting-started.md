# Getting Started

Install and import the package by its approved package identity:

```tsx
import { Button, Text, ThemeProvider } from "@personal-library/react-native-components";
```

Use the root package entrypoint for consumer-facing code. Do not import from source internals, build output, component internals, repo-relative paths, or legacy package names.

## Minimal App

```tsx
import { Button, Column, Text, ThemeProvider } from "@personal-library/react-native-components";

export function App() {
  return (
    <ThemeProvider withScroll={false}>
      <Column gap="md" padding="md">
        <Text>Personal Library components</Text>
        <Button label="Continue" onPress={() => undefined} />
      </Column>
    </ThemeProvider>
  );
}
```

## Current Stability

No component is promoted to `stable` yet. Public candidates are documented as `beta`; platform-risk APIs are documented as `experimental`.

See:

- `docs/components.md`
- `docs/platform-support.md`
- `examples/basic-usage.tsx`
