# PLRNUI-8 - Package Validation

## Scope

Validation of build, typecheck and package dry-run for the React Native UI library.

Repository sources, package metadata, lockfile, TypeScript config and build config were not modified. Commands that can write generated output were executed in a temporary copy at `/tmp/plrnui8-validation.SC3SJW/repo`.

## Evidence

- Repository state before report creation: branch `main` tracking `origin/main`; pre-existing dirty state `M package-lock.json` and `?? audit/`.
- `package.json` declares package name `@aura/ui`, version `1.0.0`, root-only `exports["."]`, `main: "index.ts"`, `types: "index.ts"`, and package files limited to `dist`.
- `tsup.config.ts` builds `index.ts` to `dist`, ESM only, with declarations enabled.
- `npm run typecheck` completed successfully in the temporary copy.
- `npm run build` completed successfully in the temporary copy.
- Initial `npm pack --dry-run` failed in the sandbox because npm tried to write cache files under read-only `/home/optimus/.npm`.
- Re-run with `npm_config_cache=/tmp/plrnui8-npm-cache` completed successfully.

Package dry-run tarball details:

| Field | Value |
| --- | --- |
| Package | `@aura/ui@1.0.0` |
| Filename | `aura-ui-1.0.0.tgz` |
| Package size | `54.8 kB` |
| Unpacked size | `252.0 kB` |
| Total files | `7` |

Tarball contents from `npm pack --dry-run`:

| File | Size |
| --- | --- |
| `LICENSE` | `1.1kB` |
| `README.md` | `1.7kB` |
| `dist/index.d.mts` | `30.3kB` |
| `dist/index.mjs` | `72.2kB` |
| `dist/index.mjs.map` | `144.8kB` |
| `index.ts` | `743B` |
| `package.json` | `1.2kB` |

Generated build output in temporary copy:

| File | Size |
| --- | --- |
| `dist/index.d.mts` | `30307 bytes` |
| `dist/index.mjs` | `72197 bytes` |
| `dist/index.mjs.map` | `144780 bytes` |

## Commands Executed

```bash
git status --short --branch
rg --files -g 'package.json' -g 'tsconfig*.json' -g '*tsup*' -g '*rollup*' -g '*vite*' -g '*babel*' -g 'README*' -g 'audit/api/*.md' -g 'audit/dependencies/*.md'
tmpdir=$(mktemp -d /tmp/plrnui8-validation.XXXXXX)
cp -a . "$tmpdir/repo"
npm run typecheck
npm run build
npm pack --dry-run
npm_config_cache=/tmp/plrnui8-npm-cache npm pack --dry-run
npm_config_cache=/tmp/plrnui8-npm-cache npm pack
find dist -maxdepth 2 -type f -printf '%p %s bytes\n' | sort
```

## Findings

- `npm run typecheck` passed.
- `npm run build` passed and emitted ESM plus declaration output.
- `npm pack --dry-run` passed only after setting npm cache to `/tmp`.
- The tarball includes `dist` artifacts, but also includes root `index.ts` because it is referenced by package metadata.
- `package.json` has a metadata mismatch: `exports["."].import` and `exports["."].types` point to `dist`, while `main` and `types` point to source `index.ts`.

## Risks

- npm commands may fail in this managed environment unless npm cache is redirected away from read-only `/home/optimus/.npm`.
- Including `index.ts` in the published tarball is unexpected when `files` is limited to `dist`; it is pulled in because package metadata references it.
- Source-facing `main` and `types` fields can confuse tools that ignore or partially support `exports`.

## Blockers

- No build/typecheck/package command blocker was observed after using `/tmp` npm cache.
- Packaging metadata remains a release blocker because root `main`/`types` are not aligned with the built artifacts.

## Conclusion

Build and typecheck are executable, and dry-run packaging succeeds with a writable npm cache. The package artifact is not release-clean because package metadata still exposes source entry metadata alongside `dist` exports.
