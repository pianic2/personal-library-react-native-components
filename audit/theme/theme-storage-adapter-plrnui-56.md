# PLRNUI-56 - ThemeStorageAdapter Implementation Evidence

## Scope

PLRNUI-56 implements optional theme persistence for `ThemeProvider` through a consumer-provided `ThemeStorageAdapter`.

Reference decision:

- `audit/dependencies/theme-persistence-strategy.md`

## Repository Baseline

- Path: `/home/optimus/Documenti/GitHub/personal-library-react-native-components`
- Branch: `main`
- Initial git status: clean
- Node: `v20.19.2`
- npm: `9.2.0`

## Public Contract

`ThemeStorageAdapter` is a type-only public contract:

```ts
export interface ThemeStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}
```

`ThemeProviderProps` now accepts:

```ts
storage?: ThemeStorageAdapter;
storageKey?: string;
persistTheme?: boolean;
```

## Behavior

- Default `<ThemeProvider>` behavior remains non-persistent.
- `<ThemeProvider persistTheme>` without `storage` is a valid no-op.
- If `storage` exists but `persistTheme` is omitted or false, no read or write is attempted.
- If `persistTheme=true` and `storage` exists, the provider renders initially with `initialMode`, then hydrates asynchronously from `storage.getItem(storageKey)`.
- Only persisted `light` and `dark` values are applied.
- Invalid values and `null` are ignored.
- Read and write failures are caught and do not crash rendering.
- Late hydration resolution after unmount must not set state.
- `setMode` and `toggleTheme` update in-memory state synchronously before attempting persistence.

## System Mode Deferral

`audit/dependencies/theme-persistence-strategy.md` proposed `system` as a future valid theme mode. PLRNUI-56 intentionally does not implement runtime `"system"` support because current source `ThemeMode` is still:

```ts
export type ThemeMode = "light" | "dark";
```

Persisted `"system"` is therefore treated as invalid and ignored safely. System mode should be handled by a separate runtime theme-mode ticket that updates token resolution and provider semantics deliberately.

## Dependency Boundary

PLRNUI-56 keeps storage consumer-owned:

- no direct package import of `@react-native-async-storage/async-storage`;
- no `AsyncStorage` adapter implementation in source;
- no official async-storage adapter subpath;
- no `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`, or `peerDependenciesMeta` change;
- no `ThemeAppShell`, safe-area or app-shell behavior change.

AsyncStorage may be used only by a consuming app as one possible implementation of `ThemeStorageAdapter`.

## Files Changed

Runtime/API:

- `src/theme/types.ts`
- `src/theme/ThemeProvider.tsx`
- `src/index.ts`

Tests:

- `tests/theme/theme-storage-adapter.test.tsx`

Docs/audit:

- `docs/getting-started.md`
- `audit/api/export-matrix.md`
- `audit/api/public-types.md`
- `audit/migration/migration-changelog.md`
- `audit/migration/breaking-change-register.md`
- `audit/release/release-readiness-report.md`
- `audit/theme/theme-storage-adapter-plrnui-56.md`

## Verification

Implementation verification:

```sh
npm run typecheck # pass
npm run test # pass, 4 test files
npm run build # pass
git diff --check # pass
git diff -- package.json package-lock.json # empty
grep -R "@react-native-async-storage/async-storage\|AsyncStorage" -n src tests docs examples audit package.json package-lock.json || true # docs/audit references only; no src/tests/package metadata hits
```
