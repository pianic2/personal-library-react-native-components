# Safe-area adapter (PLRNUI-282 / E8-11)

Contract notes, superseding the "defer" stance of `audit/dependencies/safe-area-provider-dependency-contract.md`
(PLRNUI-37 / PLRNUI-28) only where stated here.

- **PLRNUI-37 / PLRNUI-28 compatibility.** `ThemeProvider` and `ThemeAppShell` are unchanged and still know nothing about
  safe areas. Safe-area behaviour is opt-in, lives in `./native`, and is never exported from `src/index.ts`.
- **No dependency.** `react-native-safe-area-context` is not imported, required or declared. `createSafeAreaContextAdapter`
  takes the module as an argument (structural type), so the app owns the import. The static-import convenience adapter is
  E8-31.
- **Fallback (status `noop`).** Android: `StatusBar.currentHeight` as `top`. iOS and others: zero. Web: `SafeAreaBox`
  uses CSS `env(safe-area-inset-*)` (`safeAreaEnvStyle`).
- **Adapter.** `SafeAreaAdapter { useInsets(): Insets; Provider? }`, supplied through `SafeAreaInsetsProvider adapter={...}`
  (stable identity). `insets={...}` overrides with fixed values and wins over the adapter.
- **No double provider.** Do not mount your own `SafeAreaProvider` and also pass `mountProvider: true`.
- `useInsets()` includes the fallback; `useSafeInsets()` returns zeros unless a provider is mounted.
