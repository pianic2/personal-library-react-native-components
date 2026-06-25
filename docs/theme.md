# Theme

## ThemeProvider

`ThemeProvider` inizializza il tema, gestisce la modalità (`light`/`dark`) e fornisce i valori tramite context.

Props principali:

- `initialMode?: "light" | "dark"`
- `withSafeArea?: boolean` (default `true`)
- `withScroll?: boolean` (default `true`)
- `themeOverrides?: Partial<Theme>`

Esempio:

```tsx
import React from "react";
import { ThemeProvider } from "@personal-library/react-native-components";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider initialMode="light" withSafeArea={false} withScroll={false}>
      {children}
    </ThemeProvider>
  );
}
```

## useTheme()

Hook per accedere a:

- `theme` (token completi)
- `colors` (alias di `theme.colors`)
- `mode`, `toggleTheme()`, `setMode(mode)`

```ts
import { useTheme } from "@personal-library/react-native-components";

function Example() {
  const { theme, colors, toggleTheme } = useTheme();
  return { theme, colors, toggleTheme };
}
```

## Token

I token sono esportati da `tokens/` (es. spacing, radius, typography, shadows, zIndex, size, colors).

> Nota: il tema base è un dettaglio interno: i consumer lo personalizzano con
> `themeOverrides` su `ThemeProvider` o con `createTheme()`.
