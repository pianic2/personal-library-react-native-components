# Expo / React Native / Metro troubleshooting

## Scope

This page is for consumer apps using Expo, React Native and Metro with
`@personal-library/react-native-components`.

Vite preview and browser documentation/demo runtime are separate environments.
Preview web may help render documentation or a repo-local demo in a browser, but
it is not Expo, Metro, iOS, Android, Hermes or native React Native validation.

## Clean Expo consumer install

Use a clean consumer app when validating package installation or Metro behavior.

Checklist:

1. Create or use an Expo app outside this repository.
2. Install the library from the package source used by the sprint, such as the
   published package or the generated tarball.
3. Align Expo, React and React Native versions before installing the library.
4. Install from the consumer app root, not from this repository.
5. Import from the public package entrypoint only.
6. Clear npm, Expo or Metro caches only after dependency alignment has been
   verified.
7. Run Metro from the consumer app root.

Example flow:

```sh
npx create-expo-app@latest /tmp/plrnui-consumer --template blank-typescript
cd /tmp/plrnui-consumer
npm install @personal-library/react-native-components
npm ls react react-native expo --depth=0
npx expo start --clear
```

For sprint tarball validation, replace the package install with the generated
package artifact path.

Do not treat `--force` or `--legacy-peer-deps` as final fixes. They can be used
briefly to diagnose npm peer-resolution behavior, but committed consumer setup
must align dependencies instead of bypassing npm's dependency graph.

## Peer dependency alignment: React / Expo / React Native

Expo pins compatible React and React Native versions per SDK. The consumer app
owns `expo`, `react`, `react-native` and native runtime dependencies. The
library must not vendor or duplicate React or React Native.

Current package metadata declares:

- `react`: `>=19.2.3 <20.0.0`
- `react-native`: `>=0.85.0 <0.86.0`

PLRNUI-8 exposed a peer React mismatch during clean Expo consumer validation:
the generated Expo app used `react@19.2.3`, while the historical package
artifact `@aura/ui@1.0.0` required `react@^19.2.4`. npm failed with `ERESOLVE`
before root import, TypeScript import, Metro resolution or native runtime smoke
could proceed.

The correct fix is dependency alignment, not `--force` or
`--legacy-peer-deps`.

Diagnostic checklist:

- Inspect this package's `peerDependencies`.
- Inspect the consumer app's `package.json`.
- Check the selected Expo SDK's expected React and React Native versions.
- Run `npm ls react react-native expo --depth=0` in the consumer app.
- Remove lockfile and reinstall only after version alignment is understood.
- Confirm the consumer app has one React copy and one React Native copy.
- Open a packaging blocker if the package peer range rejects the selected Expo
  SDK baseline.

## Metro resolver

Common symptoms:

| Symptom | Likely cause | Correct response |
| --- | --- | --- |
| `Unable to resolve module` | Wrong import path, missing package export, missing dependency or package artifact issue. | Import from the public entrypoint, verify package exports and dependencies, then open a packaging blocker if the documented public export still fails. |
| Package subpath not exported | Consumer used a private or unpublished subpath. | Use the public API or request a new public export. |
| Duplicate module instance | Consumer dependency graph installed duplicate React or React Native copies. | Align peers and inspect `npm ls react react-native`. |
| Invalid `main`, `module` or `react-native` field | Package metadata or generated artifact is wrong. | Fix package metadata/artifacts; do not deep import internals. |
| Metro resolves source TypeScript instead of package build | Consumer import bypasses package exports or resolver config points at repo source. | Use the package root and validate emitted `dist` metadata. |

Valid fixes:

- Use `@personal-library/react-native-components`.
- Verify `package.json` exports point to generated package files.
- Verify the documented component or type is actually exported by the public
  API.
- Clear Metro cache after dependency or package artifact changes.
- Open a packaging blocker if Metro cannot resolve a documented public export.

Do not fix Metro issues by importing from `src`, `dist`, repository-relative
paths or unpublished subpaths.

## TypeScript module resolution

Common symptoms:

- `TS2307: Cannot find module`.
- Missing declarations for a public component.
- Missing type-only export for documented API.
- Consumer `moduleResolution` settings disagree with package metadata.

Valid fixes:

- Use public package imports only.
- Verify generated declarations exist in `dist`.
- Verify package `types` and `exports["."].types` point to generated
  declarations.
- Verify the consumer TypeScript config can resolve package exports.
- Open an API/type blocker if a documented public type is missing from the
  public package entrypoint.

Do not import from source files to recover a missing public type.

## Native runtime limitations

React Native native runtime is not the same as browser preview. Components or
features that depend on native modules need compatible Expo/RN support in the
consumer app.

Browser-only shims do not make native modules available in Expo Go, prebuilds or
native builds. Expo Go also has limits when a component requires custom native
code not included in the Expo Go runtime.

Runtime checks should cover:

- native Safe Area behavior;
- AsyncStorage behavior when a consumer app provides a storage adapter;
- Expo Clipboard availability and permissions when clipboard behavior is used;
- native icon/SVG behavior when an icon package requires `react-native-svg`;
- iOS and Android behavior separately from React Native Web behavior;
- Expo Go, prebuild or custom dev-client requirements when native modules are
  introduced.

## Deep imports are forbidden

Forbidden consumer imports:

- `@personal-library/react-native-components/src/...`
- `@personal-library/react-native-components/dist/...`
- local repo-relative imports such as `../../src/...` or `../../index`
- unpublished package subpaths not listed in package exports
- `preview-web/**` or shim internals

Allowed imports:

- `@personal-library/react-native-components`
- explicitly documented public subpaths only, if package exports add them in the
  future

Deep imports are forbidden because they:

- break the package boundary;
- bypass generated declarations;
- bypass export governance;
- may pass locally but fail in Metro or package consumers;
- couple consumer apps to repository internals.

If the public API does not expose something needed by consumers, open an
API/package blocker instead of bypassing the package boundary.

## Preview/demo shims

Preview shims exist for browser documentation/demo runtime only. They support
Vite preview compatibility and are not native implementations.

Preview shims must not be copied into consumer apps as production fixes. Vite
aliases and `preview-web/shims/**` are not Metro resolver configuration.

Known preview-only substitutions include:

| Preview shim or alias | Boundary |
| --- | --- |
| `react-native` -> `react-native-web` | Browser rendering only; not native RN behavior. |
| `react-native-safe-area-context` -> preview shim | Does not validate native safe-area insets. |
| `@react-native-async-storage/async-storage` -> `localStorage` shim | Does not validate native AsyncStorage semantics. |
| `expo-clipboard` -> browser Clipboard shim | Does not validate Expo Clipboard permissions or native behavior. |
| `lucide-react-native` -> `lucide-react` | Does not validate `react-native-svg` or native icon behavior. |
| Vite `@` alias -> repo root | Repo-local authoring convenience only. |
| `preview-web/shims/**` | Documentation infrastructure, not public API. |

See [Preview web shims and runtime limits](preview-runtime-limits.md) for the
full preview boundary.

## Known errors

| Error | Cause | Correct response | Not a final solution |
| --- | --- | --- | --- |
| npm peer dependency conflict involving React | Consumer React/Expo/RN version does not satisfy package peers or Expo SDK baseline. | Align Expo SDK peers, reinstall cleanly and verify `npm ls react react-native expo --depth=0`. | `--force`, `--legacy-peer-deps`. |
| Metro: `Unable to resolve module` | Wrong import path, missing package export, missing dependency or invalid package artifact. | Use the public entrypoint, verify exports and dependencies, then open a packaging blocker if a documented public export still fails. | Deep importing `src` or `dist`. |
| Package subpath is not exported | Consumer used a private or unpublished subpath. | Use the public API or request a new public export. | Adding consumer aliases to package internals. |
| `TS2307: Cannot find module` | Missing declaration/export or invalid import path. | Verify public import, generated declarations and `exports["."].types`; open an API/type blocker if needed. | Importing source files for types. |
| Native module not found / `TurboModuleRegistry` error | Native runtime dependency is absent, duplicated or unsupported in Expo Go. | Document the native requirement, use a compatible Expo workflow or open a runtime blocker. | Browser preview shims. |
| Preview works but Expo fails | Vite preview uses browser shims while Metro/native runtime does not. | Reproduce in a clean Expo consumer and fix the package/runtime contract. | Treating preview success as native validation. |

## When to open a packaging/API ticket

Open a blocker when:

- a documented public component cannot be imported from the package entrypoint;
- Metro cannot resolve a documented public export;
- TypeScript declarations are missing for public API;
- a required native dependency is undocumented;
- a preview-only shim is required to make a consumer import work;
- a consumer has to deep import to use a documented feature.

Do not open a blocker when:

- the consumer app uses private imports;
- the consumer app has incompatible Expo/React/RN versions;
- the issue only exists after using `--force` or `--legacy-peer-deps`;
- the issue only reproduces in browser preview and not in a clean Expo consumer,
  or vice versa, without noting the runtime boundary.
