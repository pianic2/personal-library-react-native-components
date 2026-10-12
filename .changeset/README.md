# Changesets

Release notes and version bumps come from changesets (`@changesets/cli`), one small Markdown file per change, committed with the pull request that makes the change. Nothing in this repository is published from a developer machine: `release:publish` exists for the release workflow and the maintainers' release procedure only.

## Add a changeset

```sh
npx changeset            # choose the bump and write the summary
npx changeset add --empty   # a change that needs no release note (docs, tooling, tests)
npx changeset status     # exit 0 when the branch has a changeset, exit 1 when it needs one
```

`status` compares the branch with `baseBranch` (`main`, see `config.json`), so it needs a checkout that has `main` (in CI a fetch with full history).

## Release flow

```sh
npm run changeset:version   # changeset version, then scripts/sync-shim-version.mjs
```

`changeset:version` bumps `package.json`, writes `CHANGELOG.md`, and copies the new version into `.changeset/shim-version.json`. That file records the version the legacy shim is generated with (`scripts/build-shim.mjs --target-version <version>`), so the shim and the package keep the same number (ADR 0013, lockstep). `npm run shim:version:check` (also part of `release:check`) fails when the record and `package.json` differ.

The script is called `changeset:version` and not `version` on purpose: npm runs a script named `version` on every `npm version`, which would start a release bump by accident.

The legacy shim is generated into `dist-shim/`, it is not a workspace package, so Changesets cannot hold it in a `fixed` group. `fixed` stays empty and the lockstep is enforced by `sync-shim-version.mjs` instead.

## Pre-release mode (`rc`)

The repository is in pre-release mode with tag `rc` (`pre.json`): `changeset version` produces `X.Y.Z-rc.N` versions and the changelog entries of a release candidate. A dry run, without touching the tree:

```sh
cp -r . /tmp/dry-run && cd /tmp/dry-run && npx changeset version && git diff
```

Snapshot releases (`changeset version --snapshot <tag>`) are refused in pre mode by Changesets itself; take a snapshot in a copy after `npx changeset pre exit`.

### Exit pre-release mode

Done once, when the first stable version is cut (the release plan decides when):

```sh
npx changeset pre exit      # sets "mode": "exit" in pre.json
npm run changeset:version   # the next version is a stable X.Y.Z
```

Commit `pre.json` with the stable version. `release:guard --channel latest` then checks the stable rules, including the changelog entry for the version.
