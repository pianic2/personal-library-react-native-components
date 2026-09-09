# PLRNUI-63 — npm Authentication and Provenance Bootstrap Disposition

Date: 2026-09-09

## Scope

This record defines the first-publication authentication and provenance boundary
without claiming credentials, organization membership, package ownership, 2FA
state, or a Trusted Publisher configuration that repository evidence cannot prove.

## Registry target

- package: `@personal-library/react-native-components`
- version candidate: `0.1.0-rc.1`
- registry: `https://registry.npmjs.org/`
- visibility: public
- dist-tag: `rc`
- forbidden dist-tag for this RC: `latest`

`package.json` and `scripts/release-guard.mjs` fail closed if those metadata values
drift.

## Authentication boundary

Repository and unauthenticated registry checks cannot prove who controls the npm
scope `@personal-library`. PLRNUI-63 therefore **does not invent an npm ownership
PASS**.

The first-publication owner gate must be executed in an authenticated npm session
immediately before publication authorization. At minimum it must establish:

```sh
npm whoami --registry=https://registry.npmjs.org/
npm access list packages @personal-library --json --registry=https://registry.npmjs.org/
```

The authenticated identity must have permission to create/publish a public package
inside `@personal-library`. No token value, OTP, recovery code, or credential is to
be copied into Jira, Confluence, repository evidence, or CI logs.

## 2FA policy

The first RC must use an npm-supported publishing authentication path that satisfies
npm's current publishing security requirements. The preferred bootstrap is an
interactive maintainer session protected by account 2FA. A long-lived classic
publish token is not part of this plan.

## Provenance / Trusted Publishing disposition

A package-side npm Trusted Publisher configuration has not been proven by current
evidence and is not assumed to exist.

For **the first publication bootstrap**, PLRNUI-63 therefore records:

- authentication: interactive owner session with 2FA after PLRNUI-61 approval;
- publication: public package with `rc` dist-tag;
- provenance: no claim is made unless the final authorized publication path is
  actually executed from a provenance-capable GitHub Actions/OIDC configuration;
- Trusted Publishing: **DEFERRED until the npm package exists and the package-side
  trust relationship is explicitly configured and verified**.

For subsequent RC/stable publications, prefer npm Trusted Publishing with GitHub
Actions OIDC, GitHub-hosted runners, Node/npm versions satisfying npm's Trusted
Publishing requirements, `id-token: write`, and automatic provenance.

## Fail-closed rule

PLRNUI-63 prepares and certifies the repository artifact but does not publish it.
If the authenticated npm identity/scope check fails at the PLRNUI-61 authorization
gate, publication is **NO-GO** and the package must not be tagged or released.

This external identity check is intentionally kept at the final owner gate because
it requires a private authenticated npm session and must not be simulated by
repository automation.
