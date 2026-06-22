# PLRNUI-45 - Package Entrypoint Reconciliation

## Scope

PLRNUI-45 reconciles package entrypoints, export metadata, build output and API governance for the current checkout.

This task does not create a consumer Expo smoke test. PLRNUI-46 remains responsible for clean consumer install/import/runtime validation.

No runtime implementation, UI component, public API, dependency, native dependency, naming decision, token export policy or deprecation path is changed by this document.

## Current package metadata

Evidence: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `src/index.ts`, `dist/`.

| Field | Current value | PLRNUI-45 assessment |
| --- | --- | --- |
| `name` | `@personal-library/react-native-components` | Canonical package name is applied. |
| `type` | `module` | Matches emitted ESM JavaScript. |
| `main` | `./dist/index.js` | Points to real build output. |
| `module` | `./dist/index.js` | Points to real build output. |
| `types` | `./dist/index.d.ts` | Points to real declaration output. |
| `exports["."].import` | `./dist/index.js` | Root import is explicit and points to real build output. |
| `exports["."].types` | `./dist/index.d.ts` | Root type entry is explicit and points to real declaration output. |
| `exports["./package.json"]` | `./package.json` | Package metadata is intentionally exposed. |
| `files` | `dist`, `README.md`, `LICENSE` | Minimal publish whitelist. |
| `sideEffects` | Not present | No side-effects metadata is declared. |

## Build output

Current emitted files:

- `dist/index.js`
- `dist/index.js.map`
- `dist/index.d.ts`
- `dist/index.d.ts.map`

`src/index.ts` currently exports:

```ts
export const PACKAGE_NAME = "@personal-library/react-native-components";
```

The generated `dist/index.js` and `dist/index.d.ts` expose the same root symbol.

## Root import policy

The only public package import currently declared by package metadata is:

```ts
import { PACKAGE_NAME } from "@personal-library/react-native-components";
```

PLRNUI-45 does not introduce the broader proposed PLRNUI-4 root API. The PLRNUI-4 root API proposal remains a future governance proposal that requires implementation and verification before it can be treated as the consumable package surface.

## Subpath export policy

No functional subpath exports are declared.

The only non-root export key is `./package.json`, which exposes package metadata. There are no `./src/*`, `./dist/*`, `./components`, `./theme`, `./tokens`, `./internal`, `./legacy` or experimental subpath exports.

This is intentional for PLRNUI-45:

- no ungoverned deep import is exposed by package metadata;
- no legacy alias is introduced;
- proposed subpaths in `audit/api/subpath-exports.md` remain proposals only;
- PLRNUI-46 can validate the explicit root import without also validating unapproved subpaths.

## Tarball policy

The package whitelist must keep the tarball limited to:

- `LICENSE`
- `README.md`
- `package.json`
- `dist/*`

The tarball must not expose:

- `audit/`
- `src/`
- `demo/`
- `preview/`
- `docs/`
- `node_modules/`
- direct source or build deep-import contracts outside the root package export map.

## Relationship to historical audits

Older PLRNUI-4 and PLRNUI-8 audit files may refer to historical package states such as:

- `@aura/ui`
- `index.ts` as `main` / `types`
- `dist/index.mjs`
- `dist/index.d.mts`
- a broad root barrel with 92 analyzed exports

Those are not the current PLRNUI-45 package metadata state. They remain historical governance evidence for API and migration planning.

## Release impact

PLRNUI-45 is metadata/audit reconciliation for the current checkout.

It does not add a breaking change by itself because no package metadata, public export, runtime implementation or dependency is changed in this task. Release readiness still requires PLRNUI-46 consumer validation.

## PLRNUI-46 preparation

PLRNUI-46 should validate:

- clean install of the packed artifact;
- root import from `@personal-library/react-native-components`;
- TypeScript declaration resolution for `PACKAGE_NAME`;
- no access to undeclared subpaths;
- tarball file list excludes source, audit, demo, preview and docs;
- duplicate React/RN checks under the approved Expo/RN baseline.

PLRNUI-45 does not execute or replace those consumer-smoke checks.
