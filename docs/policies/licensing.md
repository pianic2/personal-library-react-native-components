# Licensing policy

This policy covers third-party packages and vendored assets (fonts, icons). The package itself is MIT (`LICENSE`).
It is enforced by `node scripts/license-check.mjs`, which reads `package-lock.json`, an optional assets list and `NOTICE`.

## Packages

Allowed SPDX licenses: `MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `0BSD`, `CC0-1.0`, `BlueOak-1.0.0`, `CC-BY-4.0`.

- `0BSD` and `CC-BY-4.0` are in the allow-list because the current tree contains them (`jsc-safe-url`; `caniuse-lite`, which is browser-support data, not code).
- SPDX expressions are evaluated: `A OR B` passes when either side is allowed (the consumer may choose); `A AND B` passes only when both are; `WITH` exceptions are never approved automatically.
- Anything else fails: GPL, AGPL, LGPL, SSPL, CC-BY-NC, CC-BY-SA, "UNLICENSED" and "SEE LICENSE IN ..." until a person approves them.
- A package with no license information fails. The check first uses the lockfile, then the installed `package.json` under `node_modules`. The only exceptions are listed with a reason in the script (`EXCEPTIONS`) and apply only to optional platform binaries that are **not installed** on the host: the `@esbuild/*` scope and the single package `fsevents` (an exception for one package never covers a longer name, and never covers an installed package).
- About a fifth of the lockfile entries have no `license` field, so the check needs an installed tree: run `npm ci` first. Without `node_modules` it reports those packages as having no license information.
- The `license` field in the lockfile is the source of truth; the installed `package.json` is only read when the lockfile has none.
- The lockfile must be npm lockfile version 2 or 3 and list at least one package, otherwise the check exits 2.
- Adding a license to the allow-list or an exception needs a ticket and a reason in the change.

The package has no runtime `dependencies`; `react` and `react-native` are peers owned by the consumer. The check still covers development dependencies, so build tooling does not introduce a surprising license.

## Fonts, icons and other vendored assets

The package ships no fonts, icons or images today. If one is ever added:

1. Add an entry to `assets/licenses.json`: `{ "path": "...", "license": "<SPDX id>", "source": "<url>" }`.
2. Add the path, author and license text or link to `NOTICE`.
3. Allowed asset licenses are the package allow-list plus `OFL-1.1` (SIL Open Font License, for fonts). Assets that are "free for personal use", unlicensed, share-alike or non-commercial are not allowed.
4. Prefer a package that is already in the lockfile (such as an icon font) over copying files into the repository.

`node scripts/license-check.mjs` fails when an asset has a disallowed license, is missing a field, or its path is not mentioned in `NOTICE` as a whole token (not as part of a longer path).

## Running the check

```sh
node scripts/license-check.mjs              # audit the current tree
node scripts/license-check.mjs --self-test  # built-in fixtures: GPL, AND/OR, malformed expressions, exceptions, assets, installed tree, exit codes
node scripts/license-check.mjs --lockfile <file> --assets <file> --notice <file>
```

Exit codes: 0 ok, 1 license violations, 2 unreadable or malformed input.

## Not wired yet

The check is not part of `npm run release:check` or CI: that needs a change to `package.json`, which belongs to the release tickets. `NOTICE` is also not yet listed in the `files` of `package.json`, so it is not shipped in the npm tarball until that field is updated.
