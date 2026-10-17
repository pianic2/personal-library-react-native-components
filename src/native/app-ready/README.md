# App-ready gate (`native/app-ready`)

Waits for startup tasks (fonts, storage hydration), then renders the app and hides the splash screen once. Reached through the `./native` subpath once the export contract wires it (Expo factory through `./native/expo`); never from the root entry. It imports no native package and the package adds no dependency. With no splash adapter it works anywhere (web included) and calls no splash api.

```tsx
import * as SplashScreen from "expo-splash-screen"; // in the app, not in this package (Font is expo-font)
const splash = createExpoSplash(SplashScreen); // hoist or memoize

function Root() {
  const theme = useStoredState("theme", "light");
  const hydrated = useHydratedTask(theme.hydrated);
  const loadFonts = useCallback(() => Font.loadAsync({ Inter }), []);
  return (
    <AppReadyGate tasks={[hydrated, loadFonts]} splash={splash} timeoutMs={8000} onError={report} fallback={null}>
      <App />
    </AppReadyGate>
  );
}
```

- `AppReadyGate` / `useAppReady({ tasks, timeoutMs, splash, onError })` return `{ ready, error, timedOut }`. Tasks start together on mount; later changes of the props are ignored.
- The splash is kept (`preventAutoHide`, once, on mount) and hidden **exactly once** when the first of these happens: all tasks resolved, a task rejected, or the timeout (default 10000 ms) was reached.
- A rejection or a timeout calls `onError` once (`AppReadyTimeoutError` for the timeout) and still renders `children`: the app is never left blank.
- `useHydratedTask(...flags)` is a task that resolves when every flag is true, for the `hydrated` flags of `useStoredState` (theme or preference storage), which avoids a flash of the wrong theme.
- `createExpoSplash(module)` maps an injected `expo-splash-screen`; its rejections are swallowed. `createNoopSplash()` is for web.
- Font loading is the app's task (pass an `expo-font` loader); this folder does not load fonts.
