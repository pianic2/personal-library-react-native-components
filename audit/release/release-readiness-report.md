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

Consumer validation:

- Clean Expo TypeScript app was created in `/tmp/plrnui8-consumer`.
- App used `expo@~56.0.12`, `react@19.2.3`, and `react-native@0.85.3`.
- App creation emitted Node engine warnings because the environment is Node `v20.19.2` and current React Native/Metro packages require at least Node `20.19.4`.
- Clean package install failed with `ERESOLVE`:
  - Consumer has `react@19.2.3`.
  - `@aura/ui@1.0.0` peer requires `react@^19.2.4`.
- Root import, TypeScript import, Metro resolution and native runtime smoke could not proceed after install failure.

Export and metadata validation:

- `package.json` exposes only root `exports["."]`.
- `exports["."].import` and `exports["."].types` point to built `dist` files.
- Current `main`, `module` and top-level `types` point to `./dist/index.js` and `./dist/index.d.ts`.
- Current `src/index.ts` exports `PACKAGE_NAME` plus the governed root component, theme, hook, utility and token APIs; PLRNUI-24 makes approved root-public component props type exports explicit, including `RadioGroupOption`, and keeps PLRNUI-23 experimental overlay/form modal root exports runtime-only through explicit component exports.
- PLRNUI-25 adds component platform support documentation and a docs import audit for the current checkout; package metadata and runtime exports are unchanged.
- PLRNUI-26 fences internal helper root exports by removing `cn` and `useIsMounted` from `src/index.ts`, while keeping the root API explicit named exports only. `Stack` remains root-exported as a documented public-candidate layout primitive, `useNavigate` remains root-exported as experimental navigation API, overlay exports remain explicit experimental root runtime exports, and `getAuraTokens` remains legacy/deprecated compatibility pending future deprecation planning.
- PLRNUI-57 adds minimal consumer-facing docs and examples that import from `@personal-library/react-native-components`; package metadata and runtime exports are unchanged.
- PLRNUI-28 makes `ThemeProvider` a pure theme context provider, adds root-exported `ThemeAppShell` for explicit themed layout/scroll behavior, and removes provider-owned layout rendering.
- Historical PLRNUI-4 audit files classify 92 candidate/source-tree exports: 40 public, 32 experimental, 18 internal and 2 deprecated. Those are governance proposals, not current package exports.
- Proposed subpaths are not implemented in package metadata.

Dependency/native validation:

- Historical PLRNUI-8 evidence recorded `react-native` as a dependency, creating duplicate RN risk at that time. Current package metadata keeps `react-native` as a peer dependency with range `>=0.85.0 <0.86.0`.
- Current package metadata has no hard runtime `dependencies`; AsyncStorage, Expo Clipboard, Safe Area, SVG and Lucide RN are not declared in current `package.json`.
- PLRNUI-44 consolidates the native dependency policy: AsyncStorage and Clipboard remain consumer-owned. PLRNUI-28 removes safe-area behavior from `ThemeProvider`; future safe-area support requires separate dependency governance.
- Expo Go, managed workflow, prebuild and custom dev client requirements remain unproven.

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
- No duplicate React/RN-free consumer state can be proven by PLRNUI-42 or PLRNUI-43 because automated Expo smoke coverage is explicitly deferred to PLRNUI-46.
- Metro and TypeScript consumer import checks remain future consumer-smoke evidence.
- Native runtime compatibility remains separate from PLRNUI-42 and is tracked by native dependency governance work.

## Risks

- Historical PLRNUI-8 evidence showed an Expo consumer generated by `create-expo-app@4.0.0` could not satisfy `react@^19.2.4`; PLRNUI-42 resolves that React peer mismatch in current package metadata by using `>=19.2.3 <20.0.0`.
- React Native peer alignment is completed for package metadata by PLRNUI-43 with range `>=0.85.0 <0.86.0`; consumer smoke proof remains deferred to PLRNUI-46.
- Future native dependencies can make root install or runtime behavior fail if introduced without the PLRNUI-44 gate; current package metadata does not declare bundled native runtime dependencies.
- Package entrypoint metadata is aligned to current build output by PLRNUI-45; consumer resolver proof remains deferred to PLRNUI-46.
- PLRNUI-21 remediates the known `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput` component blockers and adds Node smoke/render coverage for them, but does not promote any component to `stable`.
- PLRNUI-22 remediates targeted navigation blockers for `TopBar`, `BottomBar`, `NavBar`, `Link` and `SideBar`, adds Node smoke/render coverage, adds root API exports, and records the platform/router contract; it does not promote any component to `stable`.
- PLRNUI-23 documents and smoke-renders `Modal`, `BottomSheet`, `Tooltip`, `Popover` and `Select`, adds root API visibility, and records the overlay platform contract; it does not promote any component to `stable`.
- PLRNUI-24 adds approved root-public props type exports without adding package subpaths, runtime dependencies or stable promotion, and leaves experimental/internal props types intentionally unexported from root.
- PLRNUI-25 documents iOS/Android/Web support posture and aligns the README consumer import example to `@personal-library/react-native-components`; no component is promoted to `stable`.
- PLRNUI-26 reduces root API risk by fencing internal helpers and documenting remaining experimental/legacy exports; it does not add subpath entrypoints, package metadata, dependencies or stable promotion.
- PLRNUI-57 expands docs/examples coverage while preserving beta/experimental labels; no component is promoted to `stable`.
- PLRNUI-28 changes provider behavior before stable release; consumers using the old implicit layout wrapper or `withScroll` must migrate to `ThemeAppShell`.
- Current Node patch version is slightly below the engine range required by current Expo/RN toolchain.

## Blockers

1. Clean Expo consumer install evidence must be regenerated after PLRNUI-42; automated Expo smoke coverage is deferred to PLRNUI-46.
2. Root import, TypeScript declaration resolution and Metro validation remain unproven until clean consumer evidence is regenerated.
3. Duplicate React/RN absence in a clean consumer is not proven and remains deferred to PLRNUI-46.
4. React Native package metadata alignment is completed by PLRNUI-43; consumer smoke proof remains deferred to PLRNUI-46.
5. Native dependency governance is consolidated by PLRNUI-44 for the current package state; PLRNUI-28 reduces provider native dependency risk by keeping safe-area out of `ThemeProvider`, but executable consumer proof remains deferred to PLRNUI-46.
6. Package entrypoint metadata is aligned to `dist`, but clean consumer root import and TypeScript declaration resolution remain unproven until PLRNUI-46.
7. Component `stable` promotion remains blocked until consumer runtime proof and any required interaction/accessibility coverage are complete; PLRNUI-25 and PLRNUI-57 add docs/examples evidence but do not promote components to `stable`.
8. Overlay/form modal `stable` promotion remains blocked until iOS/Android/Web runtime behavior, focus, keyboard and accessibility behavior are validated beyond Node render smoke coverage.
9. PLRNUI-26 documents and fences internal/experimental root API risk, but remaining experimental root exports still require future owner decisions before stable release.

## Conclusion

Verdict: **NOT READY**

The library can typecheck, build and produce a package dry-run artifact. PLRNUI-45 aligns package entrypoint governance with the current `dist` output and root-only export map. PLRNUI-26 improves root API governance by removing internal helper root exports and documenting experimental/legacy exports. Release readiness still requires regenerated clean Expo consumer evidence, incomplete consumer import validation and native runtime compatibility proof under PLRNUI-46.

Candidate follow-up tickets:

- Align React peer range with the selected Expo/RN baseline.
- Regenerate clean Expo consumer smoke evidence for the approved React/React Native peer policy.
- Keep PLRNUI-44 native dependency governance current when package metadata or runtime APIs change.
- Keep package entrypoint metadata aligned with emitted `dist` artifacts as source/API work evolves.
- Add a clean Expo consumer smoke test that installs the packed tarball, imports root API, checks TypeScript resolution, starts Metro and verifies no duplicate React/RN.
- Decide whether Expo Clipboard, AsyncStorage, Safe Area and SVG/icon paths are core, optional peer-backed, or isolated behind subpaths.
