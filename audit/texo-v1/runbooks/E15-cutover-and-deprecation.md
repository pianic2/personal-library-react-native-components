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
4. The RO is logged in with 2FA enabled (`npm whoami`), or the release runs through the trusted-publishing workflow (E17-02, OIDC with provenance).

## Sequence

Run each step only when the previous one is verified. "Owner" is the role that runs the command; the Reviewer repeats the verification.

| # | Step | Command | Expected output | Owner |
| --- | --- | --- | --- | --- |
| 1 | Dry run of both tarballs | `npm publish --dry-run --access public` in the Texo package and in the generated shim | Lists only `dist`, `README.md`, `LICENSE`; version `1.0.0`; no error | RO |
| 2 | Publish Texo | `npm publish --access public --provenance` (manual publish adds `--otp=<code>`; with OIDC no OTP is needed) | `+ <TEXO>@1.0.0` | RO |
| 2v | Verify Texo | `npm view <TEXO> version dist-tags --json` | `"version": "1.0.0"`, `"latest": "1.0.0"` | Reviewer |
| 3 | Shim-mode regression against the real registry | In a clean consumer: `npm install <TEXO>@1.0.0`, then the consumer smoke of E15-08 | Exit 0 | Reviewer |
| 4 | Publish the shim | `npm publish --access public --provenance` in the shim (dependency `<TEXO>: ^1.0.0`, no `postinstall`) | `+ <LEGACY>@1.0.0` | RO |
| 4v | Verify the shim | `npm view <LEGACY> version dependencies --json` | `"version": "1.0.0"`, dependencies exactly `{ "<TEXO>": "^1.0.0" }` | Reviewer |
| 5 | Check both installs | In a clean consumer: `npm install <LEGACY>@1.0.0` then the shim consumer smoke | Exit 0; one copy of `<TEXO>` in `npm ls <TEXO>` | Reviewer |
| 6 | Deprecate the old legacy versions | `npm deprecate "<LEGACY>@<1.0.0" "Moved to <TEXO>. Migration guide: <URL>"` | No output; exit 0 | RO |
| 6v | Verify the deprecation | `npm view <LEGACY>@0.1.0-rc.2 deprecated` | The message above | Reviewer |
| 7 | Announce | GitHub Release notes and README notice (E15-13, E17-09), created by the RO | Links resolve | PO / RO |
| 8 | After the sunset (12 months from the date set by the release plan, H4): deprecate the shim | `npm deprecate "<LEGACY>@1.x" "Deprecated. Use <TEXO>. Migration guide: <URL>"` | Exit 0; `npm view <LEGACY>@latest deprecated` shows the message | RO, PO decision |

Notes:
- Until step 2v passes, step 4 must not run: the shim would resolve nothing.
- If both packages must appear together, publish Texo first and the shim second; installs of the shim between steps 2 and 4 simply do not exist yet.
- The `<URL>` of the migration guide is a placeholder until E15-12 and E15-13 land; step 6 must not run with a placeholder.

## Rollback (covers every step)

Never `npm unpublish`: it breaks lockfiles and is restricted by npm policy. Deprecate and move dist-tags instead.

| Step | Rollback | Verification |
| --- | --- | --- |
| 1 | Nothing was published; fix and repeat. | `npm view <TEXO> version` unchanged |
| 2 | `npm deprecate <TEXO>@1.0.0 "Do not use: <reason>. Use <fixed version>"`; if an earlier good version exists, `npm dist-tag add <TEXO>@<good> latest`; publish the fix as `1.0.1` (never reuse `1.0.0`). | `npm view <TEXO> dist-tags deprecated` |
| 3 | A failed regression stops the sequence; apply the step 2 rollback. | consumer smoke exit code |
| 4 | `npm deprecate <LEGACY>@1.0.0 "Do not use: <reason>"`, `npm dist-tag add <LEGACY>@<previous> latest`, publish the fix as `1.0.1` in lockstep with Texo (D10). | `npm view <LEGACY> dist-tags deprecated` |
| 5 | Same as step 4 for the shim, or step 2 for Texo, depending on where the failure is. | clean consumer install |
| 6 | Reset the message: `npm deprecate "<LEGACY>@<1.0.0" ""` (an empty message removes the deprecation). | `npm view <LEGACY>@0.1.0-rc.2 deprecated` prints nothing |
| 7 | Edit or delete the announcement; correct the README notice by PR. | links |
| 8 | `npm deprecate "<LEGACY>@1.x" ""` to remove the shim deprecation; the sunset date is then re-decided by the PO. | `npm view <LEGACY>@latest deprecated` prints nothing |

## 2FA and OIDC notes

- Manual publishing needs an account with 2FA for writes; pass the one-time code with `--otp`. Never store tokens in the repository or the workflow file.
- Trusted publishing (E17-02) removes the long-lived token: the workflow publishes with `--provenance` through OIDC, and the package must be linked to the repository and workflow on npmjs.com first. Use it for `npm publish`; `npm deprecate` and `npm dist-tag` still need an authenticated human session.
- The first publish of a new scope or package name may require the organisation owner to create the package or grant access; check with `npm access list packages <scope>` before the release day.

## Verification set

`npm view <pkg> version`, `npm view <pkg> dist-tags --json`, `npm view <pkg> dependencies --json`, `npm view <pkg>@<version> deprecated`, `npm ls <TEXO>` in a clean consumer, `npm audit signatures` for provenance.

## Open points for the PO

- Confirm the owner of the `@theopificium` scope and the release operator.
- Set the calendar start of the 12-month sunset (step 8) in the release plan.
- The rehearsal evidence of E17-12 does not exist yet; this runbook stays a draft until it does.
