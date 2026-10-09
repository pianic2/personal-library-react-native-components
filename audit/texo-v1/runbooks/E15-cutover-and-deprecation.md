# Runbook: Texo publish, legacy shim publish and deprecation (PLRNUI-275, E15-15)

Status: draft for the product owner (PO). **Not rehearsed.** It must be rehearsed on a local registry (Verdaccio) by E17-12 (`audit/texo-v1/backlog/E17.json`, E17-12) before the first real publish; the rehearsal evidence is a prerequisite of step 1. Nothing in this runbook is executed by an agent: publishing, tagging, `npm deprecate`, `npm dist-tag` and GitHub Releases are done by a human release operator.

Inputs: `audit/texo-v1/DECISIONS.md` (H1 names, H4 sunset, H6 launch as 1.0.0, D10 shim), ADR 0013 (legacy shim policy), `audit/texo-v1/runbooks/E17-v1-release-train.md` (checklist and go/no-go, PLRNUI-163).

## Names and roles

- `<TEXO>` = `@theopificium/texo` (H1; the npm scope must be owned by the organisation, to be confirmed by the PO).
- `<LEGACY>` = `@personal-library/react-native-components` (the PO owns the scope, H1).
- **Release operator (RO):** a human with publish rights on both packages. **PO:** go/no-go. **Reviewer:** the person who runs the verification commands independently of the RO.

## Differences from the ticket text

The ticket lists "publish Texo rc, publish the shim rc depending on the exact Texo rc, then promote". Two accepted decisions replace that: H6 (launch as `1.0.0`, no public rc; the rc/`next` dist-tag flow is rehearsed on the local registry instead) and D10 / ADR 0013 (the shim depends on the target with a caret range `^1.0.0`, not an exact pin). The sequence below follows them. Ordering rule that does not change: **never deprecate before the replacement is installable.**

## Preconditions (all must hold)

1. GA checklist of the release train plan passed and the PO recorded "go".
2. Rehearsal on the local registry (E17-12) passed for steps 1 to 6, including the rollback commands.
3. Release commit tagged by the RO, `npm run release:check` green on it, `package.json` of Texo at `1.0.0` and of the shim at `1.0.0`.
4. Publishing identity: the **first publish of `<TEXO>` is manual** (a new package cannot use trusted publishing yet; the RO is logged in with 2FA, `npm whoami`, and uses `--otp`, without `--provenance`). Trusted publishing (E17-02, OIDC with provenance, only inside the CI workflow) is configured on the package afterwards and is used for later releases. The shim `<LEGACY>` already exists, so its trusted publisher can be linked beforehand.
5. npm 7 or newer on the RO machine; the prerelease behaviour of `npm deprecate` (step 6) is confirmed in the rehearsal, whose fixture must contain a `0.1.0-rc.x` version.

## Sequence

Run each step only when the previous one is verified. "Owner" is the role that runs the command; the Reviewer repeats the verification.

| # | Step | Command | Expected output | Owner |
| --- | --- | --- | --- | --- |
| 1 | Dry run of both tarballs | `npm publish --dry-run --access public` in the Texo package and in the generated shim | Lists only `dist`, `README.md`, `LICENSE`; version `1.0.0`; no error | RO |
| 2 | Publish Texo (first publish, manual) | `npm publish --access public --otp=<code>` (no `--provenance` from a shell: it only works inside CI with OIDC) | `+ <TEXO>@1.0.0` | RO |
| 2v | Verify Texo | `npm view <TEXO> version dist-tags --json` | `"version": "1.0.0"`, `"latest": "1.0.0"` | Reviewer |
| 3 | Shim-mode regression against the real registry | In a clean consumer: `npm install <TEXO>@1.0.0`, then the consumer smoke of E15-08 | Exit 0 | Reviewer |
| 4 | Publish the shim | Manual: `npm publish --access public --otp=<code>`. CI with trusted publishing: `npm publish --access public --provenance` (shim dependency `<TEXO>: ^1.0.0`, no `postinstall`) | `+ <LEGACY>@1.0.0` | RO |
| 4v | Verify the shim | `npm view <LEGACY> version dependencies --json` | `"version": "1.0.0"`, dependencies exactly `{ "<TEXO>": "^1.0.0" }` | Reviewer |
| 5 | Check both installs | In a clean consumer: `npm install <LEGACY>@1.0.0` then the shim consumer smoke | Exit 0; one copy of `<TEXO>` in `npm ls <TEXO>` | Reviewer |
| 6 | Deprecate the old legacy versions | `npm deprecate "<LEGACY>@<1.0.0" "Moved to <TEXO>. Migration guide: <URL>" --otp=<code>` | No output; exit 0 | RO |
| 6v | Verify the deprecation | `npm view <LEGACY>@0.1.0-rc.2 deprecated` | The message above. If it prints nothing, the range did not match the prerelease: run `npm deprecate "<LEGACY>@0.1.0-rc.2" "<same message>" --otp=<code>` (and for `0.1.0-rc.1`) | Reviewer |
| 7 | Announce | GitHub Release notes and README notice (E15-13, E17-09), created by the RO | Links resolve | PO / RO |
| 8 | After the sunset (12 months from the date set by the release plan, H4): deprecate the shim | `npm deprecate "<LEGACY>@1.x" "Deprecated. Use <TEXO>. Migration guide: <URL>" --otp=<code>` | Exit 0; `npm view <LEGACY>@latest deprecated` shows the message | RO, PO decision |

Notes:
- Until step 2v passes, step 4 must not run: the shim would resolve nothing.
- Under H6 there is no promotion step: Texo `1.0.0` goes straight to `latest` (no `npm dist-tag add` in the forward path). The consequence is deliberate: the real-registry regression of step 3 runs after `latest` moved, so a failure is handled by the rollback of step 2, not by a gate. The `next` to `latest` promotion is rehearsed on the local registry (E17-12); the PO may instead choose `npm publish --tag next` followed by `npm dist-tag add "<TEXO>@1.0.0" latest` after step 3.
- If both packages must appear together, publish Texo first and the shim second; installs of the shim between steps 2 and 4 simply do not exist yet.
- The `<URL>` of the migration guide is a placeholder until E15-12 and E15-13 land; step 6 must not run with a placeholder.

## Rollback (covers every step)

Never `npm unpublish`: it breaks lockfiles and is restricted by npm policy. Deprecate and move dist-tags instead.

| Step | Rollback | Verification |
| --- | --- | --- |
| 1 | Nothing was published; fix and repeat. | `npm view <TEXO> version` unchanged |
| 2 | `npm deprecate "<TEXO>@1.0.0" "Do not use: <reason>. Use <fixed version>" --otp=<code>`; publish the fix as `1.0.1` (never reuse `1.0.0`). For the first release no earlier version exists, so there is no `dist-tag` revert: deprecate and fix forward. For later releases, if a good version exists, also `npm dist-tag add "<TEXO>@<good>" latest --otp=<code>`. | `npm view <TEXO> dist-tags deprecated` |
| 3 | A failed regression stops the sequence; apply the step 2 rollback. | consumer smoke exit code |
| 4 | `npm deprecate "<LEGACY>@1.0.0" "Do not use: <reason>" --otp=<code>`, `npm dist-tag add "<LEGACY>@<previous>" latest --otp=<code>` (the previous legacy version exists), publish the fix as `1.0.1` in lockstep with Texo (D10). | `npm view <LEGACY> dist-tags deprecated` |
| 5 | Same as step 4 for the shim, or step 2 for Texo, depending on where the failure is. | clean consumer install |
| 6 | Reset the message: `npm deprecate "<LEGACY>@<1.0.0" "" --otp=<code>` (an empty message removes the deprecation; add `--otp=<code>`). | `npm view <LEGACY>@0.1.0-rc.2 deprecated` prints nothing |
| 7 | Edit or delete the announcement; correct the README notice by PR. | links |
| 8 | `npm deprecate "<LEGACY>@1.x" "" --otp=<code>` to remove the shim deprecation; the sunset date is then re-decided by the PO. | `npm view <LEGACY>@latest deprecated` prints nothing |

## 2FA and OIDC notes

- Manual publishing, `npm deprecate` and `npm dist-tag` need an account with 2FA for writes; pass the one-time code with `--otp`. Never store tokens in the repository or the workflow file.
- Trusted publishing (E17-02) removes the long-lived token: the CI workflow publishes with `--provenance` through OIDC, and the trusted publisher is configured on an **existing** package on npmjs.com (repository and workflow). It cannot be used for the very first publish of a package. `npm deprecate` and `npm dist-tag` still need an authenticated human session.
- The first publish of a new scope or package name may require the organisation owner to create the package or grant access; check with `npm access list packages <scope>` before the release day.

## Verification set

`npm view <pkg> version`, `npm view <pkg> dist-tags --json`, `npm view <pkg> dependencies --json`, `npm view <pkg>@<version> deprecated`, `npm ls <TEXO>` in a clean consumer, `npm audit signatures` (run inside an installed consumer project) for registry signatures and provenance.

## Open points for the PO

- Confirm the owner of the `@theopificium` scope and the release operator.
- Set the calendar start of the 12-month sunset (step 8) in the release plan.
- The rehearsal evidence of E17-12 does not exist yet; this runbook stays a draft until it does.
