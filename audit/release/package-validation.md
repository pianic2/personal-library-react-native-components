# PLRNUI-8 - Package Validation

## Scope

Validation of build, typecheck and package dry-run for the React Native UI library.

Repository sources, package metadata, lockfile, TypeScript config and build config were not modified. Commands that can write generated output were executed in a temporary copy at `/tmp/plrnui8-validation.SC3SJW/repo`.

Current-state note for PLRNUI-45: this PLRNUI-8 report is historical evidence for an older package artifact. Current package metadata is reconciled by PLRNUI-45: `name` is `@personal-library/react-native-components`, `main` / `module` point to `./dist/index.js`, `types` points to `./dist/index.d.ts`, and root `exports["."]` points to the same emitted files.

Current-state note for PLRNUI-46: automated consumer validation now builds and packs the current package, installs `/tmp/plrnui-46-consumer-smoke/artifacts/personal-library-react-native-components-0.0.0.tgz` into a generated external fixture, and verifies root package import, type declaration resolution and Node render smoke for representative public components.

Current-state note for PLRNUI-58: automated Expo/Metro validation now builds and packs the current package, installs `/tmp/plrnui-58-expo-consumer/artifacts/personal-library-react-native-components-0.0.0.tgz` into a generated Expo fixture, and verifies TypeScript plus `expo export --platform web`.

## Evidence

- Repository state before report creation: branch `main` tracking `origin/main`; pre-existing dirty state `M package-lock.json` and `?? audit/`.
- Historical PLRNUI-8 artifact `package.json` declared package name `@aura/ui`, version `1.0.0`, root-only `exports["."]`, `main: "index.ts"`, `types: "index.ts"`, and package files limited to `dist`.
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
- Historical PLRNUI-8 artifact had a metadata mismatch: `exports["."].import` and `exports["."].types` pointed to `dist`, while `main` and `types` pointed to source `index.ts`. Current package metadata is aligned by PLRNUI-45.

## Risks

- npm commands may fail in this managed environment unless npm cache is redirected away from read-only `/home/optimus/.npm`.
- In the historical PLRNUI-8 artifact, including `index.ts` in the published tarball was unexpected when `files` was limited to `dist`; it was pulled in because package metadata referenced it.
- Current `main` and `types` fields point to `dist`; PLRNUI-46 adds consumer resolver proof for the packed artifact and PLRNUI-58 adds Expo/Metro web export proof.

## Blockers

- No build/typecheck/package command blocker was observed after using `/tmp` npm cache.
- Historical PLRNUI-8 packaging metadata was a release blocker because root `main`/`types` were not aligned with the built artifacts. Current package metadata is aligned; PLRNUI-46 adds packed-artifact consumer evidence and PLRNUI-58 adds Expo/Metro web export evidence.

## Conclusion

Build and typecheck were executable in the historical PLRNUI-8 validation, and dry-run packaging succeeded with a writable npm cache. Current package metadata no longer exposes source entry metadata alongside `dist` exports. PLRNUI-46 verifies clean consumer package resolution from the packed tarball, and PLRNUI-58 verifies Expo/Metro web export from the packed tarball.
