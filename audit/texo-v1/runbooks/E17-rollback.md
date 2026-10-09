# Rollback and incident runbook for bad releases (PLRNUI-259, E17-13)

Status: draft for the product owner (PO). Companion of `audit/texo-v1/runbooks/E17-v1-release-train.md` (GA plan, PLRNUI-163) and `audit/texo-v1/runbooks/E15-cutover-and-deprecation.md` (publish and deprecation sequence, PLRNUI-275). Nothing here is executed by an agent: every `npm` command that changes the registry is run by the human release operator (RO) in an authenticated session with 2FA (`--otp=<code>`); only `npm publish` may run through the CI workflow (E17-02).

Names: `<TEXO>` = `@theopificium/texo` (H1), `<LEGACY>` = `@personal-library/react-native-components` (the shim after 1.0.0), `<BAD>` = the broken version, `<GOOD>` = the last good version, `<FIX>` = the next patch version. Quote specs that contain `<` or `>` in a shell.

## Principles

1. **Never `npm unpublish`.** It breaks lockfiles and is restricted by npm. Deprecate and move dist-tags instead; a version number is never reused.
2. **Stop the line first.** Pause further publishes and the promotion of dist-tags until the cause is known.
3. **Texo and the shim move together** (lockstep, D10): if one of them is bad, check the other before declaring the incident closed.
4. **Fix forward by default.** A patch release is the normal fix. Moving a dist-tag only changes what a plain `npm install <pkg>` gets: consumers whose range matches the bad version (the shim's `^1.0.0` on Texo, an app's `^1.0.0` on either package) keep resolving to the highest matching version, `<BAD>` included, until a higher fixed version exists. Only the patch release (or a consumer pin / `overrides`) protects them.
5. **Do not deprecate to a version that does not exist yet.** Deprecation messages that name `<FIX>` are written only after `<FIX>` is installable (`npm view "<TEXO>@<FIX>" version`); before that use the neutral message below.
6. **Security first means silence first.** For a vulnerability, nothing public (deprecation text, release notes, README, incident note, issue) describes the problem until the fixed version and the advisory are published.
7. **Record everything**: one incident note per event (section 8), kept private for a security incident until the advisory is published.

## Decision tree

1. Is the **npm account, token or publishing pipeline compromised** (unknown versions, unexpected publishes)? Yes: scenario G first, then C.
2. Is the problem a **security vulnerability** (confidentiality, integrity, supply chain)? Yes: scenario C (which tells you which parts of A, B, E to apply, with neutral wording). No: continue.
3. Was something **published by mistake** (wrong content, secrets, wrong package)? Yes: scenario F. (A leaked secret is F first, then C.)
4. Does the installed package **fail for everyone** (does not install, does not import, missing files, wrong entry points)? Yes: scenario A.
5. Does it fail **only for some consumers** (a platform, a bundler, a peer range)? Yes: scenario B.
6. Is only the **dist-tag wrong** (the right version exists but `latest` or another tag points elsewhere)? Yes: scenario D.
7. Is **only the shim** affected (Texo installs and works)? Yes: scenario E.
8. Did a **CI publish, provenance or the registry** fail, with nothing wrong published? Yes: scenario H.
9. None of the above: stop, record the facts in the incident note and ask the PO; do not improvise registry changes.

For every scenario, the first move is the same: `npm view <pkg> dist-tags --json` and `npm view <pkg>@<BAD> deprecated` to see the current state.

## Scenarios and commands

### A. Package is broken for everyone

1. Move `latest` of **Texo** back so plain installs get the good version: `npm dist-tag add "<TEXO>@<GOOD>" latest --otp=<code>`. There is no `<GOOD>` for the very first release: skip this step. Do the same for `<LEGACY>` only if the shim itself is bad (scenario E); a Texo-only defect does not move the shim, because its previous versions are the deprecated 0.x line.
2. Deprecate the bad version neutrally first: `npm deprecate "<TEXO>@<BAD>" "Broken release, do not use. A fixed version follows." --otp=<code>`. When `<FIX>` is installable, replace the message with `"Broken release: <reason>. Use <FIX>."`.
3. Patch release (fast path, section 4) as `<FIX>`, published first under a temporary dist-tag and then promoted to `latest` when the checks pass. The temporary tag (for example `hotfix`) is an exception to the no-rc/next rule of H6 for incidents only and is removed afterwards with `npm dist-tag rm <TEXO> hotfix --otp=<code>`.
4. Verify: `npm view <TEXO> dist-tags --json`, `npm view "<TEXO>@<BAD>" deprecated`, a clean install of `<TEXO>@latest` in the consumer smoke project.

### B. Package is broken for some consumers

1. Reproduce with the smallest consumer (platform, bundler, peer range) and record it in the incident note.
2. Do not move `latest` unless a majority is affected; deprecate the version only if no workaround exists: `npm deprecate "<TEXO>@<BAD>" "Does not work with <condition>. Use <FIX>." --otp=<code>`.
3. Patch release as `<FIX>` (section 4) and add the case to the consumer smoke matrix so it cannot return.

### C. Security vulnerability

1. Contain: apply the containment steps of A, B or E with a **neutral** deprecation wording only: nothing public until `<FIX>` is installable, and then only "Deprecated, update to the latest version" (never the nature of the vulnerability) until the advisory is published. Treat any leaked credential as compromised and rotate it first.
2. Do not discuss exploit details in public issues. Use the private channel of `SECURITY.md` (GitHub private vulnerability reporting, or info@theopificium.it). Develop the fix in a temporary private fork of the advisory when possible.
3. Create a draft GitHub Security Advisory for the repository, with affected and patched version ranges; request a CVE through the advisory if appropriate.
4. Publish the patch release (section 4). Publish the advisory **after** the fixed version is installable (`npm view <TEXO>@<FIX> version`), so that the advisory points to a fix.
5. Deprecate the affected versions with the advisory link: `npm deprecate "<TEXO>@<range>" "Security: <short description>, see <advisory URL>. Use <FIX>." --otp=<code>`.
6. If the vulnerability sits in a dependency, the audit gate (`npm run release:security`) is the check; an exception in `scripts/audit-gate-lib.mjs` expires on its `reviewBy` date and must not be extended during an incident without the PO.

### D. Wrong dist-tag

`npm dist-tag add "<TEXO>@<right>" latest --otp=<code>`; verify with `npm view <TEXO> dist-tags --json`. No version is changed or deprecated. If a tag was removed by mistake, add it back the same way. Under H6 there is no public `rc` or `next` line; do not create one during an incident.

### E. Only the shim is affected

1. Check that Texo is healthy: install `<TEXO>@<version>` alone in the consumer smoke project.
2. Roll the shim back only if its previous version is a good 1.x: `npm dist-tag add "<LEGACY>@<previous 1.x>" latest --otp=<code>`, and deprecate `<LEGACY>@<BAD>`.
3. Because the shim depends on `<TEXO>` with `^<major>.0.0`, a Texo patch is picked up automatically. ADR 0013 requires lockstep versions and a shim republished at every Texo version; the operational consequence is that a shim-only fix is released together with a Texo version of the same number (a Texo release with no code change), which the PO confirms for the first such case. For the first release there is no previous shim version to move `latest` back to: deprecate and fix forward.
4. Consumers who already ran the codemod do not depend on the shim: tell them in the communication whether they are affected.

### F. Published by mistake

1. If a secret or personal data was published: treat it as leaked (rotate), deprecate the version with a neutral message ("Published in error, do not use"), and ask npm support to remove the version if the content cannot stay public. Do not describe the content in the deprecation message.
2. If the wrong package or wrong content was published and nothing sensitive is involved: deprecate, publish the correct version, and move `latest`.
3. Add the cause to the (private) incident note; extend `npm run package:dry-run` or the pack verification (E17-11) so the file cannot be included again.

### G. Compromised npm account, token or pipeline

1. Revoke all tokens, reset the password and 2FA of the affected accounts, and review the organisation members and the trusted publisher (OIDC) configuration of each package; remove what is unknown.
2. List the published versions and compare with the release tags: `npm view <pkg> versions --json` against `git tag`. Any unknown version is hostile.
3. Deprecate unknown versions with a neutral message ("Do not use"), contact npm security/support to remove malicious versions, and publish a clean higher version.
4. Open a GitHub Security Advisory (scenario C) and treat every secret that was reachable from the pipeline as leaked.

### H. CI publish, provenance or registry failure

1. If `npm publish` failed before anything was published, nothing is wrong on the registry: fix the cause and re-run; check `npm view <pkg> versions --json` first so a version is never published twice.
2. A publish without provenance is a deviation: it needs the PO's approval and the incident note records it. Do not work around a failed OIDC step by pasting a long-lived token into the workflow.
3. A registry outage is waited out; do not publish elsewhere. If Texo was published and the shim step failed (half-published lockstep), retry the shim publish; if it cannot be published, deprecate the new Texo version with a neutral message only if consumers are affected, otherwise leave it and complete the shim as soon as the registry recovers.

## 4. Patch release fast path

1. Branch from the tag of the bad version (`v<BAD>`), apply the minimal fix with its test; no unrelated changes.
2. Run the checks that the fix can affect plus `npm run release:check`; the PO (go/no-go owner) approves the release.
3. Bump both packages to the same `<FIX>` version, publish Texo, verify, then the shim (sequence of the E15 cutover runbook).
4. Publish under the temporary tag of scenario A, promote `latest` only after the clean-install verification passes, then remove the temporary tag. If `npm run release:check` fails only on `release:security` because of a newly published advisory in a dependency, record it and ask the PO; do not extend an exception on your own.
5. Add the changelog entry (E17-09 format) and the incident note.

## 5. Communication template

```
Subject: [<TEXO>] <BAD> is deprecated - please use <FIX>

What happened: <one sentence, no speculation>
Who is affected: <versions, platforms, install path (shim or direct)>
What to do: update to <FIX> (npm install <TEXO>@<FIX>). Ranges such as ^1.0.0 resolve to the highest matching version, so a lockfile or range may still select <BAD>: update the lockfile, or pin <GOOD> / use `overrides` until you can.
Status: fixed in <FIX> (published <date>). Details: <issue or advisory URL>.
Contact: info@theopificium.it
```

Channels: the GitHub Release notes of the fixed version and, for a non-security incident, a README banner while the incident is open. For a vulnerability the message is sent only after the fixed version and the advisory are published, and it points to the advisory. The npm deprecation message carries the same pointer.

## 6. Shim implications (summary)

- A deprecated Texo version must also be checked through the shim; the lockstep rule means the fixed shim version number equals the fixed Texo version number.
- The shim has no runtime warning, so the deprecation message and the README are the only places consumers learn about an incident through that name.
- Deprecating the old legacy versions (`<1.0.0`) is part of the cutover and is not an incident action; do not remove it during a rollback unless the cutover itself is being rolled back (see the E15 runbook).

## 7. Verification set

`npm view <pkg> dist-tags --json`, `npm view "<pkg>@<version>" deprecated`, `npm view <pkg> dependencies --json` (shim: exactly the target), a clean install of `<pkg>@latest` plus `npm run consumer:smoke` and `npm run consumer:expo` in the smoke projects, `npm audit signatures` inside an installed project (it verifies registry signatures and provenance attestations of what is installed; it does not show that a release is good or free of vulnerabilities).

## 8. Incident note (template)

`audit/texo-v1/incidents/<date>-<slug>.md` (the directory is created by the first incident; for a security incident the note is kept outside the public repository until the advisory is published) with: detection time and source, affected versions and packages, scenario and actions with timestamps, who ran each registry command, root cause, user impact, follow-up tickets. Written by the RO, reviewed by the PO.

## Open points for the PO

- Name the release operator and a second person able to run the commands when the RO is unavailable.
- Confirm the first-release limitation: for `1.0.0` there is no `<GOOD>` to revert to, so the first-release fix is always deprecate plus patch.
- The ticket asks that the PR adding this file carries an approving review from a CODEOWNERS maintainer. That approval is a human action and is not provided by the independent agent review; it is left to the PO.
