# ThemeProvider

**Stability:** beta — public consumer API, usable but contract may still change.

Provider che inizializza il tema, gestisce `mode` e rende disponibili `theme`/`colors` via context.

## Import

```ts
import { ThemeProvider } from "@personal-library/react-native-components";
```

## Props

```ts
interface ThemeProviderProps {
  initialMode?: "light" | "dark";
  children: React.ReactNode;
  themeOverrides?: Partial<Theme>;
  storage?: ThemeStorageAdapter;
  storageKey?: string;
  persistTheme?: boolean;
}
```

## Note

- `ThemeProvider` fornisce solo il context tema.
- La persistenza è opt-in tramite `persistTheme` e adapter storage consumer-owned.
- Layout, safe-area e scroll devono essere composti fuori dal provider.
