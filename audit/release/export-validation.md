# PLRNUI-8 - Export Validation

## Scope

File-based validation of root exports, subpath exports, deep imports, public types and package metadata coherence.

Current-state note for PLRNUI-45: this PLRNUI-8 report is historical evidence for an older package artifact. PLRNUI-45 supersedes the current package metadata assessment with `@personal-library/react-native-components`, `dist/index.js`, `dist/index.d.ts`, and root-only package exports.

Current-state note for PLRNUI-46: `npm run consumer:smoke` now validates root package consumption from a packed tarball in an external generated fixture. The fixture imports runtime APIs and public types from `@personal-library/react-native-components`; it does not use library source paths, `dist` direct imports, package subpaths or legacy AURA imports.

Current-state note for PLRNUI-58: `npm run consumer:expo` validates the same representative root package API through a generated Expo fixture and `expo export --platform web`, without direct `src/`, direct `dist/`, package subpath or legacy AURA imports.

## Evidence

- Historical PLRNUI-8 artifact: `index.ts` exported broad barrels from components, hooks, utils, storage, tokens, theme and themes.
- Current checkout: `src/index.ts` exports `PACKAGE_NAME` plus governed component, theme, hook, utility and token APIs through explicit named exports.
- Current `package.json` exposes only root `exports["."]` with `types: "./dist/index.d.ts"` and `import: "./dist/index.js"`, plus `./package.json`.
- `package.json` does not expose subpaths.
- `audit/api/export-matrix.md` analyzes 92 exports: 40 public, 32 experimental, 18 internal and 2 deprecated.
- `audit/api/root-api-proposal.md` proposes a smaller stable root API and marks multiple decisions as `HUMAN REVIEW REQUIRED`.
- `audit/api/subpath-exports.md` proposes future subpaths, but confirms no `package.json` changes were made and current package exports expose only `"."`.
- `audit/api/public-types.md` documents missing public props/types for many proposed public components.
- `audit/api/deep-import-audit.md` records 10 concrete deep-import findings plus a grouped legacy docs import finding.

Current package export metadata:

| Metadata | Current value | Validation result |
| --- | --- | --- |
| `name` | `@personal-library/react-native-components` | Canonical package identity is applied. |
| `main` | `./dist/index.js` | Aligned with current build output. |
| `module` | `./dist/index.js` | Aligned with current build output. |
| `types` | `./dist/index.d.ts` | Aligned with current declaration output. |
| `exports["."].import` | `./dist/index.js` | Aligned with current build output. |
| `exports["."].types` | `./dist/index.d.ts` | Aligned with current declaration output. |
| `exports["./package.json"]` | `./package.json` | Intentional package metadata exposure. |
| Subpath exports | None | Aligned with current metadata, not aligned with proposed future subpaths. |

## Commands Executed

```bash
sed -n '1,260p' audit/api/export-matrix.md
sed -n '1,260p' audit/api/root-api-proposal.md
sed -n '1,260p' audit/api/subpath-exports.md
sed -n '1,260p' audit/api/deep-import-audit.md
sed -n '1,260p' audit/api/public-types.md
sed -n '1,260p' package.json
sed -n '1,260p' src/index.ts
rg -n "from ['\"](src|dist|@aura/ui|AURA|\.\./\.\./|\.\./\.\./theme|\.\./\.\./index)|from ['\"]\.\./demo|from ['\"]\.\./\.\./" docs demo preview-web -g '*.ts' -g '*.tsx' -g '*.md'
```

## Findings

- The built root export exists and matches `exports["."]`.
- Current `src/index.ts` exports only `PACKAGE_NAME`; the broader 92-export matrix is historical API governance evidence, not the current package entrypoint.
- No supported package subpaths exist today.
- Deep imports remain in demo files through repo-relative imports such as `../../index` and `../../theme/types`.
- Documentation snippets still import from legacy placeholder `"AURA"`.
- Public props/types are incomplete for many proposed public components, including core component prop types.

## Risks

- Consumers can only use the root package export; proposed subpath imports are not valid with current metadata.
- Tools that prefer `main` or top-level `types` over `exports` resolve `dist/index.js` and `dist/index.d.ts` in the current checkout.
- The current root API is intentionally minimal; proposed broader API stability remains unresolved until future implementation.
- TypeScript consumer experience can be incomplete because props/types for many public candidates are not exported.

## Blockers

- PLRNUI-46 clean consumer validation now passes for packed-artifact root import, type declaration resolution and Node render smoke.
- PLRNUI-58 Expo/Metro validation now passes for packed-artifact root import, type declaration resolution and web export bundling.
- Proposed broader root API is not implemented.
- Public props/types policy is not implemented.

## Conclusion

Root package export metadata is present and points to current build output. The package is root-only and does not expose unapproved subpaths. PLRNUI-46 proves representative root API consumption from the packed artifact, and PLRNUI-58 proves representative Expo/Metro web bundling from the packed artifact. Broader API decisions and native runtime proof remain separate release gates.
