# PLRNUI-8 - Release Readiness Report

## Scope

Release readiness verdict for package buildability, package dry-run, export metadata, clean Expo/RN consumer install, TypeScript/Metro readiness and native runtime validation.

This report is evidence-only. No source, `package.json`, `package-lock.json`, TypeScript config, build config, public exports, Jira or Confluence changes were made.

## Evidence

Repository state:

- Branch: `main` tracking `origin/main`.
- Pre-existing dirty state before report creation: `M package-lock.json` and `?? audit/`.
- Reports created only under `audit/release/`.

Package validation:

- `npm run typecheck` passed in `/tmp/plrnui8-validation.SC3SJW/repo`.
- `npm run build` passed in `/tmp/plrnui8-validation.SC3SJW/repo`.
- `npm pack --dry-run` passed with `npm_config_cache=/tmp/plrnui8-npm-cache`.
- Dry-run package size: `54.8 kB`.
- Dry-run unpacked size: `252.0 kB`.
- Dry-run total files: `7`.
- PLRNUI-46 adds `npm run consumer:smoke`, which builds, packs and installs the generated package tarball into `/tmp/plrnui-46-consumer-smoke/consumer`.

Consumer validation:

- Clean Expo TypeScript app was created in `/tmp/plrnui8-consumer`.
- App used `expo@~56.0.12`, `react@19.2.3`, and `react-native@0.85.3`.
- App creation emitted Node engine warnings because the environment is Node `v20.19.2` and current React Native/Metro packages require at least Node `20.19.4`.
- Clean package install failed with `ERESOLVE`:
  - Consumer has `react@19.2.3`.
  - `@aura/ui@1.0.0` peer requires `react@^19.2.4`.
- Root import, TypeScript import, Metro resolution and native runtime smoke could not proceed after install failure.
- Current PLRNUI-46 automated consumer smoke passes after network-enabled dependency installation: the generated fixture installs `@personal-library/react-native-components@0.0.0` from the packed tarball, resolves `react@19.2.7` and `react-native@0.85.3`, typechecks root imports and renders `ThemeProvider`, `Button`, `Text`, `Box`, `Input` and `Card`.
- PLRNUI-46 validates package root import and declaration resolution from an external fixture. It does not prove Expo CLI Metro export, native device runtime or Expo Go/prebuild/dev-client compatibility.
- PLRNUI-58 automated Expo/Metro consumer smoke passes after network-enabled dependency installation: the generated fixture installs `@personal-library/react-native-components@0.0.0` from the packed tarball, resolves `expo@56.0.12`, `react@19.2.7` and `react-native@0.85.3`, typechecks root imports and runs `expo export --platform web`.
- PLRNUI-58 validates Expo web/Metro bundling from an external fixture. It does not prove Expo Go, native device runtime, prebuild or custom dev client compatibility.

Export and metadata validation:

- `package.json` exposes only root `exports["."]`.
- `exports["."].import` and `exports["."].types` point to built `dist` files.
- Current `main`, `module` and top-level `types` point to `./dist/index.js` and `./dist/index.d.ts`.
- Current `src/index.ts` exports `PACKAGE_NAME` plus the governed root component, theme, hook, utility and token APIs; PLRNUI-24 makes approved root-public component props type exports explicit, including `RadioGroupOption`, and keeps PLRNUI-23 experimental overlay/form modal root exports runtime-only through explicit component exports.
- PLRNUI-25 adds component platform support documentation and a docs import audit for the current checkout; package metadata and runtime exports are unchanged.
- PLRNUI-26 fences internal helper root exports by removing `cn` and `useIsMounted` from `src/index.ts`, while keeping the root API explicit named exports only. `Stack` remains root-exported as a documented public-candidate layout primitive, `useNavigate` remains root-exported as experimental navigation API, and overlay exports remain explicit experimental root runtime exports. PLRNUI-29 removes legacy token compatibility names.
- PLRNUI-57 adds minimal consumer-facing docs and examples that import from `@personal-library/react-native-components`; package metadata and runtime exports are unchanged.
- PLRNUI-50 keeps current consumer examples on the root package entrypoint,
  removes internal/non-stable preview coverage from copy-pasteable examples and
  documents repo-local demo/preview paths as harness-only when present. Demo or
  preview success is not package validation.
- PLRNUI-52 adds consumer-facing Expo/RN/Metro troubleshooting documentation at
  `docs/expo-rn-metro-troubleshooting.md`, covering clean consumer install, peer
  alignment, Metro, TypeScript declarations, native runtime limits, preview shim
  boundaries, deep import bans, known errors and packaging/API blocker criteria.
  It is documentation-only and does not change runtime source, package metadata,
  package exports or release validation status.
- PLRNUI-54 closes the PLRNUI-9 docs update inventory by recording P0/P1
  resolution status in `audit/docs/docs-update-inventory.md`, confirming current
  consumer examples use only `@personal-library/react-native-components`,
  confirming preview shims/runtime limits are documented as browser docs/demo
  infrastructure only, and removing the misleading consumer import example for
  the internal/non-stable `cn` helper. It is documentation/audit-only and does
  not change runtime source, package metadata, package exports or release
  validation status.
- PLRNUI-28 makes `ThemeProvider` a pure theme context provider, adds root-exported `ThemeAppShell` for explicit themed layout/scroll behavior, and removes provider-owned layout rendering.
- PLRNUI-56 adds root-exported `ThemeStorageAdapter` and optional `ThemeProvider` persistence props. The default provider behavior remains non-persistent and the implementation does not introduce an official storage adapter subpath.
- PLRNUI-30 wires Button structural component tokens through `theme.components.button` without adding dependencies, package metadata changes, root exports or non-structural Button color tokens.
- PLRNUI-31 wires Input structural component tokens through `theme.components.input`, removes the decorative label marker, eliminates magic sizing offsets and preserves semantic color behavior without adding dependencies, package metadata changes or root exports.
- PLRNUI-32 wires Card structural defaults through `theme.components.card` for radius, padding and shadow, removes the former `radius = 14` default and preserves explicit Card prop overrides without adding dependencies, package metadata changes or root exports.
- PLRNUI-33 verifies nested `themeOverrides` behavior for colors, radius, size and Button/Input/Card component tokens, hardens `createTheme` against invalid object branch replacements, and keeps package metadata, root exports and public provider props unchanged.
- PLRNUI-29 removes legacy/snapshot public token names from root and token barrels, exposes neutral `defaultThemeTokens`, `createThemeTokens` and `ThemeTokens`, and records the change as an intentional breaking change with no deprecated root aliases.
- Historical PLRNUI-4 audit files classify 92 candidate/source-tree exports: 40 public, 32 experimental, 18 internal and 2 deprecated. Those are governance proposals, not current package exports.
- Proposed subpaths are not implemented in package metadata.

Dependency/native validation:

- Historical PLRNUI-8 evidence recorded `react-native` as a dependency, creating duplicate RN risk at that time. Current package metadata keeps `react-native` as a peer dependency with range `>=0.85.0 <0.86.0`.
- Current package metadata has no hard runtime `dependencies`; AsyncStorage, Expo Clipboard, Safe Area, SVG and Lucide RN are not declared in current `package.json`.
- PLRNUI-44 consolidates the native dependency policy: AsyncStorage and Clipboard remain consumer-owned. PLRNUI-28 removes safe-area behavior from `ThemeProvider`; future safe-area support requires separate dependency governance.
- PLRNUI-56 keeps theme persistence storage-agnostic and consumer-owned. AsyncStorage remains allowed only as a consumer-provided adapter implementation and is not imported by the package runtime.
- Expo web/Metro export is proven by PLRNUI-58. Expo Go, native managed workflow runtime, prebuild and custom dev client requirements remain unproven.

## Commands Executed

```bash
git status --short --branch
rg --files -g 'package.json' -g 'tsconfig*.json' -g '*tsup*' -g '*rollup*' -g '*vite*' -g '*babel*' -g 'README*' -g 'audit/api/*.md' -g 'audit/dependencies/*.md'
sed -n '1,260p' package.json
sed -n '1,240p' tsconfig.json
sed -n '1,240p' tsconfig.ui.json
sed -n '1,240p' tsconfig.preview.json
sed -n '1,240p' tsup.config.ts
sed -n '1,260p' index.ts
sed -n '1,240p' README.md
sed -n '1,260p' audit/api/export-matrix.md
sed -n '1,260p' audit/api/root-api-proposal.md
sed -n '1,260p' audit/api/subpath-exports.md
sed -n '1,260p' audit/api/deep-import-audit.md
sed -n '1,260p' audit/api/public-types.md
sed -n '1,300p' audit/dependencies/dependency-classification.md
sed -n '1,260p' audit/dependencies/peer-dependency-policy.md
sed -n '1,300p' audit/dependencies/native-dependency-register.md
sed -n '1,300p' audit/dependencies/expo-rn-workflow-risk-matrix.md
sed -n '1,300p' audit/dependencies/native-dependency-gate.md
sed -n '1,300p' audit/dependencies/plrnui-8-smoke-test-requirements.md
npm run typecheck
npm run build
npm pack --dry-run
npm_config_cache=/tmp/plrnui8-npm-cache npm pack --dry-run
npm_config_cache=/tmp/plrnui8-npm-cache npm pack
npx create-expo-app@latest /tmp/plrnui8-consumer --template blank-typescript --yes
npm_config_cache=/tmp/plrnui8-npm-cache npm install /tmp/plrnui8-validation.SC3SJW/repo/aura-ui-1.0.0.tgz
npm_config_cache=/tmp/plrnui8-npm-cache npm ls react react-native --depth=0
npm_config_cache=/tmp/plrnui8-npm-cache npm ls expo --depth=0
```

## Findings

- Build/typecheck/package dry-run are validatable.
- Historical PLRNUI-8 clean Expo consumer installation was not validatable as passing because it failed under strict npm resolution.
- PLRNUI-42 updates the current React peer range to accept React `19.2.3`, matching the selected latest stable Expo SDK baseline: Expo SDK `56.0.0`, React Native `0.85`, React `19.2.3`, and Node minimum `22.13.x`.
- PLRNUI-46 now proves the generated consumer fixture resolves one root-level `react@19.2.7` and `react-native@0.85.3` alongside the packed package.
- PLRNUI-46 now provides automated TypeScript root import and Node render consumer evidence for the packed artifact.
- PLRNUI-58 now provides automated Expo web/Metro export evidence for the packed artifact.
- Native runtime compatibility remains separate from PLRNUI-42 and is tracked by native dependency governance work.

## Risks

- Historical PLRNUI-8 evidence showed an Expo consumer generated by `create-expo-app@4.0.0` could not satisfy `react@^19.2.4`; PLRNUI-42 resolves that React peer mismatch in current package metadata by using `>=19.2.3 <20.0.0`.
- React Native peer alignment is completed for package metadata by PLRNUI-43 with range `>=0.85.0 <0.86.0`; PLRNUI-46 validates the generated consumer fixture with `react-native@0.85.3`.
- Future native dependencies can make root install or runtime behavior fail if introduced without the PLRNUI-44 gate; current package metadata does not declare bundled native runtime dependencies.
- Package entrypoint metadata is aligned to current build output by PLRNUI-45; PLRNUI-46 validates consumer resolver proof from the packed artifact.
- PLRNUI-21 remediates the known `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput` component blockers and adds Node smoke/render coverage for them, but does not promote any component to `stable`.
- PLRNUI-22 remediates targeted navigation blockers for `TopBar`, `BottomBar`, `NavBar`, `Link` and `SideBar`, adds Node smoke/render coverage, adds root API exports, and records the platform/router contract; it does not promote any component to `stable`.
- PLRNUI-23 documents and smoke-renders `Modal`, `BottomSheet`, `Tooltip`, `Popover` and `Select`, adds root API visibility, and records the overlay platform contract; it does not promote any component to `stable`.
- PLRNUI-24 adds approved root-public props type exports without adding package subpaths, runtime dependencies or stable promotion, and leaves experimental/internal props types intentionally unexported from root.
- PLRNUI-25 documents iOS/Android/Web support posture and aligns the README consumer import example to `@personal-library/react-native-components`; no component is promoted to `stable`.
- PLRNUI-26 reduces root API risk by fencing internal helpers and documenting remaining experimental/legacy exports; it does not add subpath entrypoints, package metadata, dependencies or stable promotion.
- PLRNUI-57 expands docs/examples coverage while preserving beta/experimental labels; no component is promoted to `stable`.
- PLRNUI-28 changes provider behavior before stable release; consumers using the old implicit layout wrapper or `withScroll` must migrate to `ThemeAppShell`.
- PLRNUI-56 adds asynchronous opt-in hydration risk only for consumers that pass `persistTheme` and `storage`; persisted invalid values, read failures and write failures are ignored without crashing.
- PLRNUI-30 reduces Button token-architecture risk for structural values, PLRNUI-31 reduces Input token-architecture risk for structural values, PLRNUI-32 reduces Card token-architecture risk for structural defaults, and PLRNUI-33 reduces unsafe override risk for nested theme structures. These tickets do not promote components or the override API to stable.
- PLRNUI-29 intentionally breaks consumers of `auraTokens`, `getAuraTokens` or `TokensSnapshot`; PLRNUI-53 confirms `auraTokens` and `getAuraTokens` are legacy/deprecated, not stable public API, forbidden in consumer examples, and not reintroduced as aliases.
- Current Node patch version is slightly below the engine range required by current Expo/RN toolchain.

## Blockers

1. PLRNUI-46 automated packed-artifact consumer smoke now passes for package install, root import, TypeScript declaration resolution and Node render coverage.
2. PLRNUI-58 automated Expo/Metro web export now passes for package install, root import, TypeScript declaration resolution and Metro bundling.
3. Duplicate React/RN absence is proven only for the generated fixture root tree, not for a full Expo CLI-generated app.
4. React Native package metadata alignment is completed by PLRNUI-43 and exercised by PLRNUI-46 with `react-native@0.85.3`.
5. Native dependency governance is consolidated by PLRNUI-44 for the current package state; PLRNUI-28 reduces provider native dependency risk by keeping safe-area out of `ThemeProvider`, but native runtime proof remains separate from PLRNUI-46.
6. Package entrypoint metadata is aligned to `dist`, and PLRNUI-46 verifies consumer root import and TypeScript declaration resolution from the packed artifact.
7. Component `stable` promotion remains blocked until consumer runtime proof and any required interaction/accessibility coverage are complete; PLRNUI-25 and PLRNUI-57 add docs/examples evidence but do not promote components to `stable`.
8. Overlay/form modal `stable` promotion remains blocked until iOS/Android/Web runtime behavior, focus, keyboard and accessibility behavior are validated beyond Node render smoke coverage.
9. PLRNUI-26 documents and fences internal/experimental root API risk, but remaining experimental root exports still require future owner decisions before stable release.
10. PLRNUI-56 does not prove consumer-native storage runtime behavior because the storage backend is consumer-owned; that remains a future app-level adapter smoke.

## Conclusion

Verdict: **NOT READY**

The library can typecheck, build and produce a package dry-run artifact. PLRNUI-45 aligns package entrypoint governance with the current `dist` output and root-only export map. PLRNUI-46 adds automated packed-artifact consumer proof for root API import, type declaration resolution and Node render coverage. PLRNUI-58 adds Expo/Metro web export proof. Release readiness still requires native runtime compatibility proof before a full Expo/RN release claim.

Candidate follow-up tickets:

- Align React peer range with the selected Expo/RN baseline.
- Add Expo Go/native runtime evidence for the approved React/React Native peer policy.
- Keep PLRNUI-44 native dependency governance current when package metadata or runtime APIs change.
- Keep package entrypoint metadata aligned with emitted `dist` artifacts as source/API work evolves.
- Extend consumer validation to Expo Go/device or native workflow behavior.
- Decide whether Expo Clipboard, AsyncStorage, Safe Area and SVG/icon paths are core, optional peer-backed, or isolated behind subpaths.
