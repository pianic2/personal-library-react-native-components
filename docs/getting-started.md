# Getting Started

## Installazione

Installa e importa il pacchetto usando l’identità approvata:

```sh
npm install @personal-library/react-native-components
```

## Uso minimo

Personal Library React Native Components espone un provider di tema che
inizializza e fornisce `theme` tramite `useTheme()`.

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

## Persistenza tema opzionale

La persistenza del tema è opt-in e storage-agnostic. L’app consumer possiede
l’implementazione storage e la passa a `ThemeProvider`.

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

## Navigazione (routing gestito dall’app)

I componenti di navigazione non includono un router: l’app passa `pathname` e `navigate(href)`.

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
        // integra qui il tuo router
        window.location.assign(href);
      }}
      layout="top"
    />
  );
}
```
