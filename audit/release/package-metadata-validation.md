# PLRNUI-14 Package Metadata Validation

## Issue

PLRNUI-14 — Define canonical package metadata.

## Canonical Repository Identity

Repository: `personal-library-react-native-components`.

## Canonical Package Name

Package: `@personal-library/react-native-components`.

## Metadata Decision

Package metadata is aligned to the artifacts produced by the current TypeScript build.

Current build output:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/index.js.map`
- `dist/index.d.ts.map`

Metadata decision:

- `name`: `@personal-library/react-native-components`
- `description`: `Personal Library React Native Components.`
- `private`: `false`
- `type`: `module`
- `main`: `./dist/index.js`
- `module`: `./dist/index.js`
- `types`: `./dist/index.d.ts`

No `@aura/ui` alias is defined.

## Root-Only Exports Policy

The package exposes only the root entrypoint and package metadata:

- `.` with `types: ./dist/index.d.ts` and `import: ./dist/index.js`
- `./package.json`

No subpath exports are introduced for `./theme`, `./tokens`, `./components`, `./internal`, or any other unvalidated path.

## Files Whitelist Policy

The package whitelist is intentionally minimal:

- `dist`
- `README.md`
- `LICENSE`

The package must not include:

- `audit/`
- `src/`
- `preview/`
- `example/`
- `docs/`
- `coverage/`
- `node_modules/`

## Package-Lock Regeneration Rule

`package-lock.json` must be regenerated with:

```bash
npm install --package-lock-only
```

The lockfile must reflect the canonical root package name without unrelated dependency updates.

## Validation Commands Executed

Environment:

- `git status --short`: clean before PLRNUI-14 edits.
- `node -v`: `v20.19.2`
- `npm -v`: `9.2.0`
- `cat package.json`: inspected before and after metadata update.

Commands:

- `npm_config_cache=/tmp/plrnui14-npm-cache npm install --package-lock-only`: passed; lockfile remained on canonical package name and no dependency updates were introduced.
- `npm_config_cache=/tmp/plrnui14-npm-cache npm install`: passed; dependencies were already up to date.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm_config_cache=/tmp/plrnui14-npm-cache npm pack --dry-run`: passed; dry-run tarball contained 7 files.
- `npm_config_cache=/tmp/plrnui14-npm-cache npm pack --json`: passed; generated `personal-library-react-native-components-0.0.0.tgz` for inspection.

Note: the first plain `npm pack --dry-run` attempt failed with `EROFS` because npm tried to write to `/home/optimus/.npm`; validation was rerun with a writable cache under `/tmp`.

## Tarball Expected Inclusions

Expected and observed package contents:

- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

Observed files from `npm pack --json`:

- `LICENSE`
- `README.md`
- `dist/index.d.ts`
- `dist/index.d.ts.map`
- `dist/index.js`
- `dist/index.js.map`
- `package.json`

## Tarball Expected Exclusions

Expected and observed excluded paths:

- `audit/`
- `src/`
- `preview/`
- `example/`
- `docs/`
- `coverage/`
- `node_modules/`

None of these paths appeared in the generated tarball.

## Explicit Out-of-Scope Boundaries

PLRNUI-14 does not:

- create legacy aliases;
- introduce compatibility for `@aura/ui`;
- stabilize public API classifications;
- add subpath exports;
- migrate source naming;
- refactor components;
- change token naming;
- modify Jira;
- modify Confluence.
