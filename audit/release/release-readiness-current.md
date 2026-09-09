# Current Release Readiness — PLRNUI-63 Supersession

Date: 2026-09-09

This record supersedes older PLRNUI-8, PLRNUI-59, PLRNUI-60 and PLRNUI-62
headline wording for the current first-RC publication-gate state. Historical
records remain evidence but are not the current consolidated verdict where they
conflict with this page.

## Current decision

- **PLRNUI-62 / G9 / RA 0005: CLOSED** for the selected `0.1.0-rc.1` runtime boundary.
- **PLRNUI-63 publication preparation: COMPLETE** once its reviewed branch is merged to canonical `main` with CI green.
- Candidate package version: **`0.1.0-rc.1`**.
- Intended Git tag after final authorization: **`v0.1.0-rc.1`**.
- npm registry: `https://registry.npmjs.org/`; public access; dist-tag **`rc`**. The release guard rejects implicit `latest`.
- Canonical CI is moved to Node 24 and executes the complete `release:check` rather than the historical partial check.
- Final PLRNUI-63 evidence reports: typecheck PASS; 74/74 tests PASS; build PASS; package dry-run PASS; packed consumer smoke PASS; Expo SDK 57 consumer smoke PASS; full and production-only npm audit with zero vulnerabilities; strict install-script policy with no unreviewed scripts.
- Final versioned evidence artifact: `personal-library-react-native-components-0.1.0-rc.1.tgz`, SHA256 `6e281d9fc2cabe8dd895415a6c6ce4ca1010514e33968c0a36fbafcccd29fa8d`, 56,298 bytes, 407 files.
- Package leakage inspection confirms required `dist/index.js`, `dist/index.d.ts`, `package.json`, `README.md` and `LICENSE`, with no repository-only `src/`, `audit/`, `tests/`, `scripts/`, `examples/`, `docs/` or `.github/` content in the tarball.
- BC-002, BC-003, BC-004, BC-008 and BC-011 are `verified` for the first-RC publication boundary.
- RA 0002, 0003, 0007 and 0008 are mitigated for first-RC publication preparation; RA 0005 keeps the scoped PLRNUI-62 owner-accepted residual boundary and must not be represented as broad native PASS.

## Remaining gate

**Overall RC publication is still BLOCKED only by the separate PLRNUI-61 final owner authorization/authentication gate.**

Immediately before any tag or publication, the owner must use a private authenticated
npm session to prove the publishing identity and permission for the
`@personal-library` scope and satisfy npm account authentication/2FA requirements.
Repository automation cannot prove those private account facts and PLRNUI-63 does
not fabricate them.

If that authenticated scope/owner check fails, the result is NO-GO. No tag,
GitHub Release or npm publish is authorized until PLRNUI-61 explicitly approves
the exact certified commit/artifact and controlled release sequence.

## Runtime boundary carried forward from PLRNUI-62

- Expo Go Android — Expo SDK 57 / RN 0.86.3: **PASS / maintainer approved**.
- Native Android outside Expo Go: **owner-accepted residual**, not PASS.
- Native iOS: **owner-accepted residual**, not PASS.
- Prebuild: N/A to selected first-RC claim.
- Custom dev client: N/A to selected first-RC claim.
- EAS build: N/A to current publication plan.

## Evidence index

- `audit/release/plrnui-62-native-runtime-publication-closure.md`
- `audit/release/plrnui-63-publication-preparation-closure.md`
- `audit/release/plrnui-63-npm-bootstrap-disposition.md`
- `audit/release/0.1.0-rc.1-release-notes.md`
- `audit/risk-assessment/plrnui-63-publication-risk-closure.md`
- `audit/migration/breaking-change-register.md`
- `audit/migration/migration-changelog.md`
