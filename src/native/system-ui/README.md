# System UI sync (`native/system-ui`)

Keeps the status bar, the Android navigation bar, the root view background and the web `theme-color` in line with the theme. Reached through the `./native` subpath once the export contract wires it (Expo factory through `./native/expo`); never from the root entry. It imports no native package and the package adds no dependency: with nothing installed it works (web sets `meta theme-color`, elsewhere the hook does nothing).

```tsx
import * as SystemUI from "expo-system-ui"; // in the app, not in this package
import * as NavigationBar from "expo-navigation-bar"; // Android only, optional
const adapter = createExpoSystemUi({ systemUi: SystemUI, navigationBar: Platform.OS === "android" ? NavigationBar : null }); // hoist or memoize

function Root() {
  useSystemBars({ adapter }); // mode and background default to the theme
  return (
    <>
      <ThemedStatusBar />
      <App />
    </>
  );
}
```

- `ThemedStatusBar`: React Native's `StatusBar` with `barStyle` from the mode (`dark` gives `light-content`, `light` gives `dark-content`). Renders nothing where the host has no `StatusBar`.
- `useSystemBars({ mode, backgroundColor, adapter })`: applies the config in an effect. Every step is best-effort: a rejection or a synchronous throw is swallowed (a development-only `console.warn`), and one failing step does not stop the others.
- `createExpoSystemUi({ systemUi, navigationBar })`: `expo-system-ui` `setBackgroundColorAsync`; `expo-navigation-bar` `setBackgroundColorAsync` and `setButtonStyleAsync` (Android, so pass it on Android only).
- `createWebSystemUi(document)` / `resolveWebSystemUi()`: updates or creates `<meta name="theme-color">`.
- Edge-to-edge configuration (`app.json`) stays with the app.
