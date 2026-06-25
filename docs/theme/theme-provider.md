# ThemeProvider

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
  withSafeArea?: boolean;
  withScroll?: boolean;
  themeOverrides?: Partial<Theme>;
}
```

## Note

- `withSafeArea=true` usa `SafeAreaProvider`/`SafeAreaView`.
- `withScroll=true` wrappa i children in `ScrollView`, altrimenti in `View`.
