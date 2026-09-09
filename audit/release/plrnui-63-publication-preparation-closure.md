# PLRNUI-63 — RC Publication Preparation Closure

Date: 2026-09-09

## Verdict

**PLRNUI-63: COMPLETE pending only merge of the reviewed branch with CI green.**

The repository, package metadata, release governance and versioned artifact are
prepared for the separate PLRNUI-61 final authorization gate.

PLRNUI-63 does **not** publish to npm, create `v0.1.0-rc.1`, or create a GitHub
Release.

## Selected release identity

- package: `@personal-library/react-native-components`
- version: `0.1.0-rc.1`
- intended tag after PLRNUI-61 authorization: `v0.1.0-rc.1`
- npm registry: `https://registry.npmjs.org/`
- access: `public`
- dist-tag: `rc`
- `latest`: forbidden for this RC by `scripts/release-guard.mjs`
- license: MIT
- repository metadata: canonical GitHub repository

`package.json` and `package-lock.json` are aligned to `0.1.0-rc.1`.

## CI and release automation

Canonical `.github/workflows/ci.yml` now uses Node 24, satisfying the package
engine floor `>=22.13.0`, and executes the full `npm run release:check`.

`release:check` now covers:

1. clean install;
2. release metadata guard;
3. TypeScript typecheck;
4. complete test suite;
5. build;
6. package dry-run;
7. isolated packed-artifact consumer smoke;
8. isolated Expo SDK 57 consumer smoke;
9. production dependency audit.

The package now has a real `prepack` hook that performs a clean production build
and release guard before any npm pack/publish path can create an artifact.

## Final evidence run

GitHub Actions finalization run: `34397537718`.

Environment:

- Ubuntu 24.04 runner;
- Node `v24.20.0`;
- npm `11.19.0`.

Results:

- lock/package version coherence: PASS;
- registry ping: PASS;
- `@personal-library/react-native-components@0.1.0-rc.1` not resolvable from the public registry before first publication: expected E404 / PASS for immutable-version preflight;
- `npm audit --audit-level=high`: PASS — 0 vulnerabilities;
- `npm audit --omit=dev --audit-level=high`: PASS — 0 vulnerabilities;
- strict install-script policy: PASS;
- `npm install-scripts ls`: `No packages with unreviewed install scripts.`;
- `npm run release:guard`: PASS;
- `npm run typecheck`: PASS;
- `npm test`: **74/74 PASS**, 14 suites, 0 failures;
- `npm run build`: PASS;
- `npm run package:dry-run`: PASS;
- `npm run consumer:smoke`: PASS; isolated consumer resolves the packed `0.1.0-rc.1` package with React `19.2.3` / React Native `0.86.3`;
- `npm run consumer:expo`: PASS; isolated consumer resolves Expo `57.0.21`, React/ReactDOM `19.2.3`, React Native `0.86.3`, typechecks and completes Metro web export;
- `git diff --check`: PASS.

## Certified RC artifact

Final evidence tarball:

- filename: `personal-library-react-native-components-0.1.0-rc.1.tgz`
- SHA256: `6e281d9fc2cabe8dd895415a6c6ce4ca1010514e33968c0a36fbafcccd29fa8d`
- size: `56,298` bytes
- npm package size: 56.3 kB
- unpacked size: 246.1 kB
- files: 407
- npm shasum: `6a1e0a2c04ec7da28597155be76ffe04d9191061`

Required package entries are present:

- `package/dist/index.js`
- `package/dist/index.d.ts`
- `package/package.json`
- `package/README.md`
- `package/LICENSE`

Leakage gate confirms no package paths under repository-only `src/`, `audit/`,
`tests/`, `scripts/`, `examples/`, `docs/`, or `.github/`.

The artifact identity above remains authoritative so long as no packed input
(`dist` source, `README.md`, `LICENSE`, or `package.json`) changes after the final
evidence run. Publication must fail closed and re-certify if any packed input
changes.

## Security and install-script remediation

An earlier PLRNUI-63 evidence attempt found a high-severity transitive
`shell-quote@1.8.4` audit issue. It was **remediated**, not accepted as residual.
The lockfile now resolves the available fixed dependency state and both full and
production-only final audits report zero vulnerabilities.

The earlier npm warning for the `esbuild@0.28.1` install script is also closed:

- `package.json` contains the reviewed pinned `allowScripts` entry;
- `.npmrc` sets `strict-allow-scripts=true`;
- clean `npm ci` succeeds under that policy;
- no unreviewed install scripts remain.

## Non-blocking tooling warnings

The test harness still emits React's `react-test-renderer` deprecation warning and
a Node experimental-loader warning. The generated Expo consumer also emits a
deprecation warning from a transitive Expo tooling dependency. These are
**tooling-maintenance findings, not first-RC publication blockers** because:

- all tests and consumer gates pass;
- they do not change package runtime dependencies;
- repository-only test/fixture tooling is excluded from the npm tarball.

They must not be presented as stable-platform certification and can be modernized
in later maintenance work.

## Breaking-change governance

The publication gate closes the previously candidate/current first-RC records:

- BC-002 — legacy AURA naming: `verified`;
- BC-003 — root public API governance: `verified`;
- BC-004 — deep import restriction: `verified`;
- BC-008 — register/changelog RC gate: `verified`;
- BC-011 — zero-stable stability labeling contract: `verified`.

The migration changelog includes the PLRNUI-63 publication-preparation entry.

## Stability and documentation

- `stable`: zero;
- `NavProvider`: beta;
- `useNav`: beta;
- `useNavigate`: experimental;
- README states migration/hardening complete and documents the first-RC support boundary;
- release notes exist at `audit/release/0.1.0-rc.1-release-notes.md`.

No API is promoted by PLRNUI-63.

## Native runtime boundary

PLRNUI-62 remains authoritative and unchanged:

- Expo Go Android on Expo SDK 57 / RN 0.86.3: PASS / maintainer approved;
- native Android outside Expo Go: owner-accepted residual, not PASS;
- native iOS: owner-accepted residual, not PASS;
- prebuild/custom dev client/EAS: outside the selected first-RC claim.

## npm ownership, authentication and provenance

PLRNUI-63 does not claim facts that require private npm account access.
Unauthenticated registry evidence proves reachability and that the candidate
package/version is not currently publicly resolvable; it cannot prove the
maintainer's scope permission, 2FA state or an npm Trusted Publisher relationship.

The first publication therefore uses the fail-closed bootstrap disposition in
`audit/release/plrnui-63-npm-bootstrap-disposition.md`:

- PLRNUI-61 must verify the private authenticated npm identity and scope permission immediately before release;
- if that check fails, publication is NO-GO;
- no credential, OTP or token is recorded in repository/Jira/Confluence evidence;
- no existing Trusted Publisher/OIDC configuration is invented;
- Trusted Publishing is deferred until its package-side trust relationship is actually configured and verified.

## Risk disposition

`audit/risk-assessment/plrnui-63-publication-risk-closure.md` records RA 0002,
0003, 0007 and 0008 as mitigated for first-RC publication preparation, RA 0006 as
mitigated by the versioned artifact/consumer gates, and preserves RA 0005's
explicitly scoped PLRNUI-62 owner-accepted residual boundary.

## Handoff to PLRNUI-61

After this branch is merged and canonical `main` CI passes, the remaining release
gate is intentionally small and human-controlled:

1. verify authenticated npm identity/scope permission and required account security;
2. verify `main` is the certified PLRNUI-63 merge state and no packed input drifted;
3. explicitly authorize publication;
4. create `v0.1.0-rc.1` from that exact authorized commit;
5. publish the certified `0.1.0-rc.1` package publicly under dist-tag `rc`;
6. verify registry package/version/dist-tag;
7. create the matching GitHub prerelease.

Until those PLRNUI-61 actions occur, **overall publication remains BLOCKED by
design even though PLRNUI-63 preparation is complete**.
