# Rollback and incident runbook for bad releases (PLRNUI-259, E17-13)

Status: draft for the product owner (PO). Companion of `audit/texo-v1/runbooks/E17-v1-release-train.md` (GA plan, PLRNUI-163) and `audit/texo-v1/runbooks/E15-cutover-and-deprecation.md` (publish and deprecation sequence, PLRNUI-275). Nothing here is executed by an agent: every `npm` command that changes the registry is run by the human release operator (RO), with 2FA (`--otp=<code>`) or the CI workflow where the step says so.

Names: `<TEXO>` = `@theopificium/texo` (H1), `<LEGACY>` = `@personal-library/react-native-components` (the shim after 1.0.0), `<BAD>` = the broken version, `<GOOD>` = the last good version, `<FIX>` = the next patch version. Quote specs that contain `<` or `>` in a shell.

## Principles

1. **Never `npm unpublish`.** It breaks lockfiles and is restricted by npm. Deprecate and move dist-tags instead; a version number is never reused.
2. **Stop the line first.** Pause further publishes and the promotion of dist-tags until the cause is known.
3. **Texo and the shim move together** (lockstep, D10): if one of them is bad, check the other before declaring the incident closed.
4. **Fix forward by default.** A patch release is the normal fix; a dist-tag revert only buys time.
5. **Record everything**: one incident note per event (section 8).

## Decision tree

1. Is the problem a **security vulnerability** (confidentiality, integrity, supply chain, leaked secret)? Yes: scenario C, in parallel with the scenario below that matches the symptom. No: continue.
2. Does the installed package **fail for everyone** (does not install, does not import, missing files, wrong entry points)? Yes: scenario A.
3. Does it fail **only for some consumers** (a platform, a bundler, a peer range)? Yes: scenario B.
4. Is only the **dist-tag wrong** (the right version exists but `latest` or another tag points elsewhere)? Yes: scenario D.
5. Is **only the shim** affected (Texo installs and works)? Yes: scenario E.
6. Was something **published by mistake** (wrong content, secrets, wrong package)? Yes: scenario F.

For every scenario, the first move is the same: `npm view <pkg> dist-tags --json` and `npm view <pkg>@<BAD> deprecated` to see the current state.

## Scenarios and commands

### A. Package is broken for everyone

1. Move `latest` back so new installs get the good version: `npm dist-tag add "<TEXO>@<GOOD>" latest --otp=<code>` (and the same for `<LEGACY>`). There is no `<GOOD>` for the very first release: skip this step and go to 2.
2. Deprecate the bad version with a pointer: `npm deprecate "<TEXO>@<BAD>" "Broken release: <reason>. Use <FIX or GOOD>." --otp=<code>`.
3. Patch release (fast path, section 4) as `<FIX>`; promote it to `latest` when the checks pass.
4. Verify: `npm view <TEXO> dist-tags --json`, `npm view "<TEXO>@<BAD>" deprecated`, a clean install of `<TEXO>@latest` in the consumer smoke project.

### B. Package is broken for some consumers

1. Reproduce with the smallest consumer (platform, bundler, peer range) and record it in the incident note.
2. Do not move `latest` unless a majority is affected; deprecate the version only if no workaround exists: `npm deprecate "<TEXO>@<BAD>" "Does not work with <condition>. Use <FIX>." --otp=<code>`.
3. Patch release as `<FIX>` (section 4) and add the case to the consumer smoke matrix so it cannot return.

### C. Security vulnerability

1. Contain: follow A or B for the symptom, and treat any leaked credential as compromised (rotate it first).
2. Do not discuss exploit details in public issues. Use the private channel of `SECURITY.md` (GitHub private vulnerability reporting, or info@theopificium.it).
3. Create a draft GitHub Security Advisory for the repository, with affected and patched version ranges; request a CVE through the advisory if appropriate.
4. Publish the patch release (section 4). Publish the advisory **after** the fixed version is installable (`npm view <TEXO>@<FIX> version`), so that the advisory points to a fix.
5. Deprecate the affected versions with the advisory link: `npm deprecate "<TEXO>@<range>" "Security: <short description>, see <advisory URL>. Use <FIX>." --otp=<code>`.
6. If the vulnerability sits in a dependency, the audit gate (`npm run release:security`) is the check; an exception in `scripts/audit-gate-lib.mjs` expires on its `reviewBy` date and must not be extended during an incident without the PO.

### D. Wrong dist-tag

`npm dist-tag add "<TEXO>@<right>" latest --otp=<code>`; verify with `npm view <TEXO> dist-tags --json`. No version is changed or deprecated. If a tag was removed by mistake, add it back the same way. Under H6 there is no public `rc` or `next` line; do not create one during an incident.

### E. Only the shim is affected

1. Check that Texo is healthy: install `<TEXO>@<version>` alone in the consumer smoke project.
2. Roll the shim back: `npm dist-tag add "<LEGACY>@<previous>" latest --otp=<code>` and deprecate `<LEGACY>@<BAD>`.
3. Because the shim depends on `<TEXO>` with `^<major>.0.0`, a Texo patch is picked up automatically; a shim fix is published in lockstep with the same version number as Texo, so a shim-only fix still bumps both packages (publish Texo with no code change if the process requires equal versions, as decided in ADR 0013).
4. Consumers who already ran the codemod do not depend on the shim: tell them in the communication whether they are affected.

### F. Published by mistake

1. If a secret or personal data was published: treat it as leaked (rotate), deprecate the version with a neutral message ("Published in error, do not use"), and ask npm support to remove the version if the content cannot stay public. Do not describe the content in the deprecation message.
2. If the wrong package or wrong content was published and nothing sensitive is involved: deprecate, publish the correct version, and move `latest`.
3. Add the cause to the incident note; extend `npm run package:dry-run` or the pack verification (E17-11) so the file cannot be included again.

## 4. Patch release fast path

1. Branch from the tag of the bad version (`v<BAD>`), apply the minimal fix with its test; no unrelated changes.
2. Run the checks that the fix can affect plus `npm run release:check`; the PO (go/no-go owner) approves the release.
3. Bump both packages to the same `<FIX>` version, publish Texo, verify, then the shim (sequence of the E15 cutover runbook).
4. Promote `latest` only after the clean-install verification passes.
5. Add the changelog entry (E17-09 format) and the incident note.

## 5. Communication template

```
Subject: [<TEXO>] <BAD> is deprecated - please use <FIX>

What happened: <one sentence, no speculation>
Who is affected: <versions, platforms, install path (shim or direct)>
What to do: update to <FIX> (npm install <TEXO>@<FIX>). If you cannot update: <workaround or "pin <GOOD>">.
Status: fixed in <FIX> (published <date>). Details: <issue or advisory URL>.
Contact: info@theopificium.it
```

Channels: the GitHub Release notes of the fixed version, the repository README banner while the incident is open, and the advisory when it is a vulnerability. The npm deprecation message carries the same pointer.

## 6. Shim implications (summary)

- A deprecated Texo version must also be checked through the shim; the lockstep rule means the fixed shim version number equals the fixed Texo version number.
- The shim has no runtime warning, so the deprecation message and the README are the only places consumers learn about an incident through that name.
- Deprecating the old legacy versions (`<1.0.0`) is part of the cutover and is not an incident action; do not remove it during a rollback unless the cutover itself is being rolled back (see the E15 runbook).

## 7. Verification set

`npm view <pkg> dist-tags --json`, `npm view "<pkg>@<version>" deprecated`, `npm view <pkg> dependencies --json` (shim: exactly the target), a clean install of `<pkg>@latest` plus `npm run consumer:smoke` and `npm run consumer:expo` in the smoke projects, `npm audit signatures` inside an installed project.

## 8. Incident note (template)

`audit/texo-v1/incidents/<date>-<slug>.md` with: detection time and source, affected versions and packages, scenario and actions with timestamps, who ran each registry command, root cause, user impact, follow-up tickets. Written by the RO, reviewed by the PO.

## Open points for the PO

- Name the release operator and a second person able to run the commands when the RO is unavailable.
- Confirm the first-release limitation: for `1.0.0` there is no `<GOOD>` to revert to, so the first-release fix is always deprecate plus patch.
- The ticket asks that the PR adding this file carries an approving review from a CODEOWNERS maintainer. That approval is a human action and is not provided by the independent agent review; it is left to the PO.
