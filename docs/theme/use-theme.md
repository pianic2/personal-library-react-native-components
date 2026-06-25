# useTheme

**Stability:** beta — public consumer API, usable but contract may still change.

Hook che legge il context del tema e restituisce un oggetto con `theme`, `mode`, `toggleTheme`, `setMode` e `ready`.

## Import

```ts
import { useTheme } from "@personal-library/react-native-components";
```

## API

```ts
const { theme, mode, toggleTheme, setMode, ready } = useTheme();
```
