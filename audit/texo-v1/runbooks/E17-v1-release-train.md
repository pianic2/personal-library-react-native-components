# V1 release train plan (PLRNUI-163, E17-08)

Status: proposal for the product owner (PO). Every date, count or window in this file that is not taken from `audit/texo-v1/DECISIONS.md` is a proposal and is marked as such. Sources: DECISIONS.md H1, H3, H4, H6, D10, D15; ADR 0011 (semver, stability, deprecation), ADR 0013 (legacy shim), ADR 0020 (execution protocol); `audit/release/`.

## 1. Version path

| Step | Package | Version | Where | Status today |
| --- | --- | --- | --- | --- |
| Current line | `@personal-library/react-native-components` | `0.1.0-rc.2` (tags `v0.1.0-rc.1`, `v0.1.0-rc.2` exist in the repository) | dist-tag `rc` only, `latest` forbidden by `scripts/release-guard.mjs` | Whether these tags were published to npm is recorded in `audit/release/`; verify with `npm view @personal-library/react-native-components dist-tags` before relying on it. |
| Rehearsal | Texo + shim | `1.0.0` | local registry only (E17-12, Verdaccio) | Planned. No public `rc` publish (H6). |
| GA | `@theopificium/texo` (H1) | `1.0.0` | npm, dist-tag `latest` | Not started; needs the gates in section 3 and the PO go decision. |
| GA, legacy name | `@personal-library/react-native-components` (shim) | `1.0.0` (lockstep with Texo, D10) | npm, dist-tag `latest`; shim depends on `^1.0.0` of Texo | Planned (E15-03, E15-14, E15-16). |
| Hotfix | both | `1.0.1`, `1.0.2`, ... | same | See section 5. |

Decisions this path relies on: Texo launches as `1.0.0`, not as an rc line (H6, PO decision of 2026-10-09); the jump from `0.1.0-rc.2` to the legacy shim `1.0.0` is intentional and is explained in the shim README and the migration guide. Tag history: the legacy repository keeps its `v0.1.0-rc.*` tags; the Texo repository starts at `v1.0.0`. The `next` dist-tag is not used unless the PO asks for a pre-GA public channel.

Note on the ticket text: the ticket asks for an "rc.N cadence". H6 supersedes it. If the PO later reintroduces a public rc line, the same freeze and bug-only rules below apply to `1.0.0-rc.N`, and the release guard (E17-03) must allow it.

## 2. Freeze and bug-only rules

1. **Candidate.** The release candidate is a commit on the integration branch `texo/v1` where all P0 tickets of the epics are merged (JQL set in `docs/policies/jql.md`, rows in `audit/texo-v1/STATE.md`) and `npm run release:check` is green.
2. **Freeze starts** when the PO declares the candidate. From then on only bug fixes, documentation corrections and release-process fixes are merged; no new component, no API change, no dependency bump except a security fix. Each such change keeps the ticket protocol of ADR 0020 and carries a note that it is a freeze change.
3. **Rehearsal** (E17-12) runs on the candidate: publish Texo and the shim to a local registry, install both in a clean consumer, deprecate and roll back.
4. **Unfreeze** happens only by the PO (no-go) or by the GA publish.
5. **After GA** the branch for `1.x` accepts bug-only changes and additive features per ADR 0011; breaking changes wait for `2.0.0`.

## 3. GA checklist (go/no-go inputs)

Each item names the command or artifact that proves it. "Available" means it exists on `texo/v1` today; "planned" names the ticket that will deliver it. A planned item with no artifact is a no-go.

| # | Item | Command or artifact | State |
| --- | --- | --- | --- |
| 1 | All P0 tickets of all epics done | Ready/done queries in `docs/policies/jql.md`; execution rows in `audit/texo-v1/STATE.md` | Available |
| 2 | Stable set listed and non-empty | `docs/components.md` (stability column); criteria in `docs/policies/versioning.md` (ADR 0011); stable bar E17-14 | Bar planned (E17-14) |
| 3 | Release check green from a clean install | `npm run release:check` (clean, `npm ci`, guard, compat docs, API snapshot, typecheck, contract types, tests, build, pack dry run, consumer smokes, security gate) | Available |
| 4 | Release guard accepts a stable `1.0.0` | `npm run release:guard` after E17-03 (today it only accepts an rc version and tag `rc`) | Planned (E17-03) |
| 5 | Public API unchanged except intended | `npm run api:snapshot:check` | Available |
| 6 | Subpath export contract valid | `node scripts/lib/validate-exports-config.mjs` and the generated `exports` (E14-02) | Contract available, generation planned |
| 7 | Accessibility gate (E9) | `npm test` (accessibility harness and contract tests); E9 tickets done in STATE.md | Partly available |
| 8 | Consumer smokes: Node/TS tarball | `npm run consumer:smoke` | Available |
| 9 | Consumer smoke: Expo SDK 57 | `npm run consumer:expo`; native runtime evidence in `audit/release/` | Available, runtime lanes planned (E12-08) |
| 10 | Consumer smoke in shim mode | E15-08 command (not yet defined) | Planned (E15-08) |
| 11 | Export and type parity of the shim | E15-04, E15-05 tests | Planned |
| 12 | Size budgets | Pack verification of the tarball (E17-11) | Planned (E17-11) |
| 13 | Docs strict build | `mkdocs build --strict` in CI (E16-02) | Planned (E16-02) |
| 14 | Security audit clean or excepted | `npm run release:security` (`scripts/audit-gate.mjs`; exceptions with expiry in `scripts/audit-gate-lib.mjs`); Dependabot and SBOM (E17-10, needs the repository security features enabled) | Available |
| 15 | Licenses and NOTICE | `node scripts/license-check.mjs` and `NOTICE` (`docs/policies/licensing.md`) | Available (not in `release:check`) |
| 16 | Token usage | `node scripts/check-token-usage.mjs` (currently reports `src/components/Modal/Modal.tsx`) | Available; must pass or be allowlisted with a reason |
| 17 | API conventions | `node scripts/check-api-conventions.mjs` and its baseline (E14-13) | Available |
| 18 | Compatibility matrix | `npm run docs:compat:check`; supported entry with evidence in `config/compatibility.json` | Available |
| 19 | Package identity | `config/package-identity.json` valid (`scripts/lib/identity.mjs`); name and repository decision H1 applied (E15-01, E15-10) | Name decided, cutover pending |
| 20 | Migration guide tokens resolved | No placeholder token left in the migration guide (E15-12, E15-10) | Planned |
| 21 | Rehearsal on a local registry passed | E17-12 evidence | Planned |
| 22 | Release notes and changelog | Format of E17-09; notes for `1.0.0` | Planned |
| 23 | Publishing path | Release workflow with npm trusted publishing and provenance (E17-02); tags and GitHub Release created by the release operator, never by an agent | Planned |
| 24 | Rollback runbook exists | E17-13 | Planned |
| 25 | Open human decisions closed | No `HUMAN REVIEW REQUIRED` marker left in the ADRs that gate the release (ADR 0009, ADR 0002); `grep -rn "HUMAN REVIEW" audit/adr` | Open today |

## 4. Go/no-go

- **Go/no-go owner: the product owner (PO).** Only a human decides GA. No agent applies `po-approved`, publishes, tags, creates a GitHub Release or merges `texo/v1` into `main`.
- **Release operator: a human with npm publish rights** for the package scope (the PO owns the `@personal-library` scope, H1; the `@theopificium` scope is to be confirmed by the PO). The operator runs or approves the release workflow and the 2FA/OIDC step.
- **Security contact: `info@theopificium.it`** (H1), consulted when item 14 has an exception.
- **Reviewer of record:** the independent review required by ADR 0020 for every merged ticket; items 1 and 25 are checked against its evidence.
- **Meeting output:** a dated go/no-go note in `audit/texo-v1/` listing each checklist row as pass, fail or accepted exception (with expiry), signed off by the PO.

A single failed row without a PO-accepted exception is a no-go. Planned items whose artifact does not exist are failures, not exceptions.

## 5. Rollback and hotfix (outline; detail belongs to E17-13)

1. **Stop.** Do not publish further versions until the cause is known. The release operator decides, with the PO, whether to deprecate.
2. **Deprecate, do not unpublish.** `npm deprecate <package>@<bad-version> "<reason and fixed version>"` for both Texo and the shim; unpublishing is a last resort and limited by the npm policy.
3. **Move `latest` back** if needed: `npm dist-tag add <package>@<previous> latest`.
4. **Hotfix `1.0.1`.** Branch from the `v1.0.0` tag, apply the minimal fix with its test, run the checklist rows that the fix can affect plus `npm run release:check`, publish Texo and the shim in lockstep (same version, D10), and write a changelog entry.
5. **Record.** A short incident note with cause, affected versions, detection and follow-up tickets.

## 6. Open points for the PO

- Confirm the freeze rules and the checklist rows that are blocking (all rows) versus advisory.
- Name the release operator and the npm scope that will hold Texo (`@theopificium`).
- Decide the dated go/no-go meeting and who attends besides the PO.
