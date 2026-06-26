# Getting Started

## Stability labels

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component/API is classified as stable.

## Installazione

Installa e importa il pacchetto usando l’identità approvata:

```sh
npm install @personal-library/react-native-components
```

La preview web del repository non sostituisce questa verifica consumer:
eventuali shim o alias Vite della preview non provano installazione Expo/RN,
Metro, iOS, Android, Hermes o runtime nativo. Vedi
[Preview web shims and runtime limits](preview-runtime-limits.md).

## Uso minimo

Personal Library React Native Components espone un provider di tema che
inizializza e fornisce `theme` tramite `useTheme()`.

`ThemeProvider`, `Box` e `Text` sono API `beta`: usabili dalla superficie
consumer pubblica, ma il contratto puo ancora cambiare prima della promozione
stable.

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

`ThemeStorageAdapter` e la persistenza opt-in sono `beta`; non implicano una
dipendenza storage posseduta dal package.

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

`NavBar` e `NavItem` sono `beta`. Le superfici navigation/app-shell orientate a
layout come `TopBar`, `BottomBar` e `SideBar` restano `experimental` nelle
pagine dedicate.

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
