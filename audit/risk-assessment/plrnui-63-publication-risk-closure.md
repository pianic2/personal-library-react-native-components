# PLRNUI-63 — RC Publication Risk Closure

Date: 2026-09-09

## Scope

This record supersedes the PLRNUI-59 hardening-entry dispositions where PLRNUI-63
has now produced publication-preparation evidence for the first RC candidate
`0.1.0-rc.1`.

It does not broaden the native support boundary closed by PLRNUI-62 and does not
authorize npm publication, a Git tag, or a GitHub Release.

## Publication dispositions

| RA | PLRNUI-63 disposition | Publication evidence / boundary |
| --- | --- | --- |
| RA 0001 — package rename / legacy alias | **MITIGATED FOR FIRST RC** | Canonical npm identity is `@personal-library/react-native-components`; README/release notes use only the canonical consumer identity; historical AURA names remain migration evidence only. |
| RA 0002 — public API / deep import | **MITIGATED FOR FIRST RC** | Package exports remain root plus `./package.json`; release notes and docs prohibit `src/`, `dist/`, internal and repository-relative consumer imports; internal helpers remain fenced; beta/experimental root APIs remain explicitly labeled. |
| RA 0003 — stability misclassification | **MITIGATED FOR FIRST RC** | `stable` remains zero. Navigation wording is reconciled: `NavProvider` and `useNav` beta; `useNavigate` experimental. No PLRNUI-63 work promotes an API to stable. |
| RA 0004 — theme token regression | **MITIGATED FOR FIRST RC** | Existing theme/token tests remain green in the final 74-test suite; release notes carry the ThemeProvider/ThemeAppShell and token migration contract. |
| RA 0005 — native dependency/runtime | **OWNER-ACCEPTED RESIDUAL — CLOSED FOR SELECTED FIRST-RC BOUNDARY** | PLRNUI-62 remains authoritative: Expo Go Android PASS; native Android outside Expo Go and native iOS are accepted residuals, not PASS; prebuild/custom dev client/EAS are outside the selected claim. |
| RA 0006 — packaging / consumer installation | **MITIGATED FOR FIRST RC** | Versioned `0.1.0-rc.1` artifact passes release guard, typecheck, 74/74 tests, build, package dry-run, packed consumer smoke, Expo SDK 57 consumer smoke, and production dependency audit. Final tarball identity is recorded in the PLRNUI-63 closure report. |
| RA 0007 — documentation drift | **MITIGATED FOR FIRST RC** | README now states migration/hardening complete, exact RC posture and runtime limits; NavContext stability labels are reconciled; first-RC release notes are repository evidence. |
| RA 0008 — breaking-change governance | **MITIGATED FOR FIRST RC** | BC-002, BC-003, BC-004, BC-008 and BC-011 are `verified`; migration changelog contains the PLRNUI-63 publication-preparation entry; release notes expose relevant migration impact. |

## Supply-chain disposition

The first finalization attempt surfaced `shell-quote@1.8.4` as a high-severity
transitive audit finding. PLRNUI-63 did not accept it as a residual: the lockfile
was remediated through npm's available fix path and the final evidence run reports
zero vulnerabilities for both full-tree and `--omit=dev` audits.

The same run surfaced the `esbuild@0.28.1` install script. It is now explicitly
pinned in `allowScripts`, `.npmrc` enables `strict-allow-scripts=true`, `npm ci`
passes under that policy, and `npm install-scripts ls` reports no unreviewed
install scripts.

## External npm identity boundary

Repository automation can prove registry reachability, candidate-version absence,
package metadata and artifact reproducibility. It cannot prove the maintainer's
private npm authentication, `@personal-library` scope permission or account 2FA
state.

Those private checks are therefore a **fail-closed final PLRNUI-61 owner action**,
not a fabricated PLRNUI-63 PASS. See
`audit/release/plrnui-63-npm-bootstrap-disposition.md`.

If the authenticated owner/scope check fails, publication remains NO-GO and no tag
or release may be created.

## Verdict

**PLRNUI-63 publication risk preparation: COMPLETE, subject only to the separate
PLRNUI-61 owner authorization/authentication gate.**

No npm publish, Git tag, or GitHub Release is performed by this disposition.
