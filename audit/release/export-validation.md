# PLRNUI-8 - Export Validation

## Scope

File-based validation of root exports, subpath exports, deep imports, public types and package metadata coherence.

No source exports, package metadata or API files were changed.

## Evidence

- `index.ts` exports broad barrels from `components/navigation`, `components/layout`, `components/typography`, `components/feedback`, `components/overlay`, `components/surfaces`, `components/form`, `hooks`, `utils`, `storage`, `tokens`, `theme`, and `themes`, plus `Button`.
- `package.json` exposes only root `exports["."]` with `types: "./dist/index.d.mts"` and `import: "./dist/index.mjs"`.
- `package.json` does not expose subpaths.
- `audit/api/export-matrix.md` analyzes 92 exports: 40 public, 32 experimental, 18 internal and 2 deprecated.
- `audit/api/root-api-proposal.md` proposes a smaller stable root API and marks multiple decisions as `HUMAN REVIEW REQUIRED`.
- `audit/api/subpath-exports.md` proposes future subpaths, but confirms no `package.json` changes were made and current package exports expose only `"."`.
- `audit/api/public-types.md` documents missing public props/types for many proposed public components.
- `audit/api/deep-import-audit.md` records 10 concrete deep-import findings plus a grouped legacy docs import finding.

Current package export metadata:

| Metadata | Current value | Validation result |
| --- | --- | --- |
| `name` | `@aura/ui` | Legacy identity; not aligned with proposed `@personal-library/react-native-components`. |
| `main` | `index.ts` | Source entry, not aligned with built artifact. |
| `types` | `index.ts` | Source declaration entry, not aligned with built artifact. |
| `exports["."].import` | `./dist/index.mjs` | Aligned with build output. |
| `exports["."].types` | `./dist/index.d.mts` | Aligned with build output. |
| Subpath exports | None | Aligned with current metadata, not aligned with proposed future subpaths. |

## Commands Executed

```bash
sed -n '1,260p' audit/api/export-matrix.md
sed -n '1,260p' audit/api/root-api-proposal.md
sed -n '1,260p' audit/api/subpath-exports.md
sed -n '1,260p' audit/api/deep-import-audit.md
sed -n '1,260p' audit/api/public-types.md
sed -n '1,260p' package.json
sed -n '1,260p' index.ts
rg -n "from ['\"](src|dist|@aura/ui|AURA|\.\./\.\./|\.\./\.\./theme|\.\./\.\./index)|from ['\"]\.\./demo|from ['\"]\.\./\.\./" docs demo preview-web -g '*.ts' -g '*.tsx' -g '*.md'
```

## Findings

- The built root export exists and matches `exports["."]`.
- The source root barrel is broader than the proposed public root API and includes internal, experimental and deprecated symbols already identified by PLRNUI-4.
- No supported package subpaths exist today.
- Deep imports remain in demo files through repo-relative imports such as `../../index` and `../../theme/types`.
- Documentation snippets still import from legacy placeholder `"AURA"`.
- Public props/types are incomplete for many proposed public components, including core component prop types.

## Risks

- Consumers can only use the root package export; proposed subpath imports are not valid with current metadata.
- Tools that prefer `main` or top-level `types` over `exports` may resolve source `index.ts`.
- The root barrel exposes APIs whose stability status is not approved.
- TypeScript consumer experience can be incomplete because props/types for many public candidates are not exported.

## Blockers

- Package identity is unresolved: metadata is `@aura/ui`, while audit proposals target `@personal-library/react-native-components`.
- Root API is not stability-filtered.
- `main` and `types` point to source while export map points to `dist`.
- Public props/types policy is not implemented.

## Conclusion

Root package export metadata is present and build output exists, but export readiness is not complete. The package is root-only, API stability is not enforced in metadata or barrels, and source-oriented metadata remains inconsistent with the packaged `dist` entrypoint.
