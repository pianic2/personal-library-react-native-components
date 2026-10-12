# Release process

A release is published by `.github/workflows/release.yml` with npm trusted publishing (OIDC): the npm registry trusts the workflow file, so the repository holds no npm token. Every publish carries a provenance attestation (`npm publish --provenance`). A human approves each real publish.

## Flow

1. Changes carry changesets ([Changesets](https://github.com/changesets/changesets); the repository's `.changeset/README.md` has the commands).
2. A maintainer runs `npm run changeset:version` (with `GITHUB_TOKEN` exported) on a branch, which bumps `package.json`, writes `CHANGELOG.md` and keeps the lockfile and the shim version record in step, and opens the version pull request.
3. Merging that pull request pushes `package.json` and `CHANGELOG.md` to `main`, which starts the `Release` workflow:
   - `plan` reads the version and asks npm whether `<name>@<version>` exists. If it does, the run stops there and publishes nothing.
   - `build` runs `npm run release:check` and the publication guard (`release:guard`, channel `rc` for `X.Y.Z-rc.N`, `latest` for `X.Y.Z`), packs the target and, when the shim is enabled, generates and packs the shim. The tarballs are uploaded as artifacts, so what is published is what was tested.
   - `publish-target` waits for a reviewer of the `npm-publish` environment, publishes the tarball with `--provenance` and the dist-tag of the channel, then checks that `npm view <name>@<version> --json` shows `dist.attestations` (retrying for about five minutes).
   - `publish-shim` runs after `publish-target` succeeded (and waits for the reviewer again), only when `config/package-identity.json` enables the shim.
   - `github-release` creates the tag and the GitHub release `v<version>` with generated notes (categories in `.github/release.yml`, template in [Release notes template](release-notes-template.md)); a release candidate is marked as a pre-release.

Only a run on `main` can publish for real; a manual run on another branch must be a dry run. While `package.json` holds a version that is not on npm yet, every push to `main` that changes `package.json` or `CHANGELOG.md` starts a run that waits for the reviewer: reject it unless it is the release you want.

The workflow uses no third-party action. The version pull request is the one `npm run changeset:version` produces, so `changesets/action` is not needed.

## Dry run

Run the workflow from the Actions tab (`Release`, `Run workflow`) with `dry-run` left at its default `true`. It runs `plan` and `build`, then logs `npm publish --dry-run` for the target and, when enabled, the shim, and publishes nothing. Nothing in a dry run needs the `npm-publish` environment. A workflow can be started by hand only when the file is on the default branch.

## One-time setup (the repository owner)

### GitHub environment

In the repository settings create the environment `npm-publish`: add the maintainers who may approve as **required reviewers**, enable **prevent self-review** if more than one maintainer exists, and limit **deployment branches** to `main`. Without required reviewers a publish would start without a human check.

### npm trusted publisher, for each package

For the target package and, later, for the legacy shim: on npmjs.com open the package, **Settings**, **Trusted Publisher**, choose **GitHub Actions** and enter

| Field | Value |
| --- | --- |
| Organization or user | the GitHub owner of the repository |
| Repository | the repository name |
| Workflow filename | `release.yml` |
| Environment name | `npm-publish` |

then set the package's publishing access to require two-factor authentication and disallow tokens. The values change with the repository rename at the cutover (E15): update both trusted publisher entries then.

### Bootstrap exception: the first publish of a package

npm allows a trusted publisher only on a package that already exists. The first version of a new package name (for example `@theopificium/texo`) is therefore published once by a maintainer from an authenticated npm session with two-factor authentication, as recorded in `audit/release/plrnui-63-npm-bootstrap-disposition.md` for the legacy name: `npm publish --access public --tag rc` (or `latest` for a stable version), without provenance claims. Right after that, configure the trusted publisher above, and from the next version on publish only through this workflow. No long-lived token is created for the bootstrap; if one is unavoidable, revoke it as soon as the trusted publisher is verified.

## When a release only half succeeds

Publishing a version is final, so a failed job after `publish-target` cannot be repeated: re-running the failed jobs stops at `npm publish` (the version exists) and a full re-run finds the version published and does nothing. Fix forward by case:

- the provenance check timed out: look at `npm view <name>@<version> --json`; if `dist.attestations` is there, nothing is missing;
- the shim publish failed: fix the cause, bump the version with a new changeset, and release the next version (target and shim stay in lockstep);
- only the GitHub release failed: create it by hand from the tag `v<version>` (`gh release create v<version> --generate-notes`).

## Checks and limits

- npm 11.5.1 or newer is required for trusted publishing; the publish jobs fail early when it is older (Node 24 ships a recent npm).
- `release:guard` rejects versions that do not match the channel and a stable release without a changelog entry and consumer smoke evidence.
- A published version is never unpublished: fix forward, and use `npm deprecate` for a bad version.
- The workflow was validated with `actionlint` only. It has not run: a dry run needs the file on `main`, and the first real run needs the environment and the trusted publisher set up as above.
