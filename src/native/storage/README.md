# Storage adapters (PLRNUI-366 / E8-23)

`StorageAdapter { kind, status, insecure?, getItem, setItem, removeItem }` is structurally assignable to the theme's
`ThemeStorageAdapter` (compile-time check in `types.ts`), so any adapter can be passed to `ThemeProvider`.

| Adapter | Kind | Backend | Without a backend |
| --- | --- | --- | --- |
| `createMemoryStorage()` | plain | in-memory map | n/a |
| `createWebStorage()` | plain | `localStorage` (guarded) | `unavailable`: reads `null`, writes no-op |
| `createAsyncStorage(module)` | plain | injected AsyncStorage | `unavailable`: reads `null`, writes no-op |
| `createSecureStorage(module, options)` | secure | injected secure store | `unavailable`: reads `null`, **writes reject** |

`useStoredState(key, default, { storage, serialize })` returns `{ value, setValue, remove, hydrated }`.

## Risk assessment (secure storage)

- **Data.** Secure storage is meant for tokens and similar secrets; plain storage is readable by the user, by backups and
  on web by any script of the page.
- **No silent downgrade.** A secure adapter never writes to plain storage on its own. On web, or when the module is not
  injected, it is `unavailable` and `setItem` / `removeItem` reject, so a secret cannot end up in `localStorage` unnoticed.
- **Explicit opt-in.** `allowInsecureWeb: true` stores in `localStorage` and reports `insecure: true` on the adapter. It is
  for previews and tests, never for real secrets.
- **No encryption here.** The package adds no cryptography; confidentiality comes from the platform keychain / keystore
  behind the injected module. Keys for `expo-secure-store` may only contain letters, digits, `.`, `-` and `_`.
- **Failure behaviour.** Reads that fail resolve `null` (the value is treated as absent); write failures reject and are
  swallowed by `useStoredState` (the in-memory value stays), so callers that must know use the adapter directly.
- **Dependencies.** None added; the modules are injected structurally and never imported.
