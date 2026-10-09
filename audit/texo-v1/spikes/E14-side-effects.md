# E14-06 report: import-time side effects of `src/`

- Ticket: PLRNUI-212 (E14-06)
- Question: can `package.json` declare `"sideEffects": false`, or does it need an allow-list?
- Method: (1) static survey of module-scope statements in all 101 files of `src/` (TypeScript AST: expression statements and variable initializers that contain a call or `new`, ignoring function and class bodies); (2) dynamic check, `tests/scripts/side-effects.test.ts`, which imports every module of `src/` in a child process where `react-native` is a recording shim and fails on any import-time use that is not in an explicit allow-list.

## Result

**No module of `src/` has an observable import-time side effect.** There are no module-scope listeners, no `Appearance`/`Dimensions`/`Linking`/`Keyboard` calls, no global writes, no registries and no imports for effect only (`import "x"`).

Import-time work that exists, all of it pure:

| Where | What | Why it is pure |
| --- | --- | --- |
| `src/components/Card/Card.tsx:112` | `StyleSheet.create({...})` | returns the style object; recorded by the shim as the only react-native call |
| `src/components/FormField/FormField.tsx:168` | `StyleSheet.create({...})` | same |
| `src/components/NavContext/NavContext.tsx:19` | `createContext(null)` | creates a React context object |
| `src/theme/ThemeProvider.tsx:26` | `createContext(null)` | same |
| `src/theme/defaultTheme.tsx:104` | `createBaseTheme("light")` | builds a plain theme object; the dynamic check records no react-native use while it runs |
| `src/tokens/themeTokens.ts:107-108` | `Object.freeze(buildThemeTokens(...))` | builds and freezes plain objects |
| `src/utils/platform.ts` | reads `Platform.OS` into `isWeb` / `isIOS` / `isAndroid` constants | a constant read, no call; the value is fixed per bundle target |

## Allow-list for the test (not for `sideEffects`)

The test allows exactly these import-time react-native uses and nothing else; the test also fails if one of them disappears (stale list):

- `src/components/Card/Card.tsx` calls `StyleSheet.create`
- `src/components/FormField/FormField.tsx` calls `StyleSheet.create`
- `src/utils/platform.ts` reads `Platform.OS`

A module-scope `Appearance`, `Dimensions`, `Platform.select` or listener call added anywhere in `src/` fails the test (verified: appending `Dimensions.get("window")` at module scope of `src/utils/mergeStyles.ts` made the test fail with `src/utils/mergeStyles.ts|Dimensions.get`; the change was reverted). The test also has two controls: a fixture with those calls is reported, and a clean fixture produces no records.

## Recommended `sideEffects` value

**`"sideEffects": false`.** No file needs to be in an allow-list: every import-time statement above is pure, so a bundler may drop an unused module without changing behavior.

Notes for the ticket that edits `package.json` (this ticket does not own it):

- Webpack, Rollup and esbuild honor the field; Metro ignores it today, so the benefit is for web and library consumers.
- Re-run `tests/scripts/side-effects.test.ts` before changing the value and whenever import-time code is added.
- The planned global-singleton contexts of the legacy shim (ADR 0013) will write to `globalThis` when their module is evaluated. Keep that registration inside the module that exports the context, so dropping an unused module cannot lose a registration that something else depends on; if that is not possible, list the file in `sideEffects` instead of using `false`.
- CSS or font imports for effect, polyfills and `import "x"` statements would need an allow-list entry; none exist now.

## How to reproduce

```sh
node --import tsx --test tests/scripts/side-effects.test.ts
```

The static survey is a short script over the TypeScript AST (module-scope `ExpressionStatement` nodes and `VariableStatement` initializers containing a call, skipping function and class bodies); it printed the seven rows above and no expression statements.

## Limits

- The recording shim covers the react-native names that `src/` imports plus the usual runtime objects (`Appearance`, `Dimensions`, `Linking`, `Keyboard`, `PixelRatio`, `I18nManager`, `AccessibilityInfo`, `LayoutAnimation`, `PanResponder`, `Animated`). A new import of a react-native name that the shim does not export makes the test fail loudly; add it to the shim.
- Only react-native is recorded. Import-time use of Node or browser globals (`window`, `document`, `globalThis` writes) is not detected by the dynamic check; the static survey found none.
