# E16-10 report: review of `audit/` for public release

- Ticket: PLRNUI-161 (E16-10)
- Scope: classify each `audit/` subtree, scan for secrets and personal data, propose the ADR layout and an English index, flag the human-only decisions.
- Status of the policy decision: H7 ("public/private fate of `audit/`") is recorded as "Default accepted" in `audit/texo-v1/DECISIONS.md` without saying which default. This report therefore gives a recommendation and flags the choice for the owner (see "Human-only decisions").

## Facts

- `audit/` is 3.4 MB, 168 files (before this report). It is **not** published to npm (`package.json` `files` is `dist`, `README.md`, `LICENSE`); it is public only if the Git repository is public.
- Some tooling reads `audit/` paths, so those paths cannot move or be excluded without changing code:
  - `scripts/public-api-snapshot.mjs` reads and writes `audit/api/public-root-api.snapshot` (`npm run api:snapshot[:check]`, part of `release:check`);
  - the execution protocol reads `audit/adr/0020-ticket-execution-protocol.md`, `audit/texo-v1/STATE.md`, `DECISIONS.md`, `jira-map.json` and `backlog/*.json` (`docs/policies/*`, `skills/*`, `scripts/check-ownership.mjs`).
- Most files are the migration-era audit (Italian prose, internal ticket keys); the Texo V1 material under `audit/texo-v1/` is English.

## Secret and personal-data scan

| Check | Result |
| --- | --- |
| `secretlint` 13.0.7, `@secretlint/secretlint-rule-preset-recommend`, all of `audit/**` | **exit 0, no findings** |
| Positive control: same command on a file with a fake GitHub token and a fake Slack token | exit 1, both reported (so the scan is not vacuous) |
| Credentials, API keys, tokens, private keys | none found |
| Email addresses | one: `info@theopificium.it` in `audit/texo-v1/DECISIONS.md` (the security contact chosen for publication, H1) |
| Internal URLs (Atlassian, Confluence, Slack, localhost, private IPs) | none; the only "atlassian" hit is prose; "confluence" appears 114 times as a word in migration plans, not as a link |
| Local absolute paths | `/home/optimus/Documenti/GitHub/personal-library-react-native-components` and `/home/optimus/.npm` in 13 files (`audit/release/*`, `audit/theme/*`, `audit/api/internal-experimental-export-fencing-plrnui-26.md`, and similar). These expose a local username and folder layout; low risk but should be scrubbed or accepted |
| Personal name | "Niccolo Piazzi" in `audit/texo-v1/backlog/E16.json` and `tickets/E16.json` (quoting the MIT `LICENSE` holder, which is public anyway); first names/handle `niccolo` in 3 files discussing the GitHub owner mismatch |
| Internal project names | `AURA` (55 files) and `UI Experience` (11 files) refer to the source product the library was extracted from; confirm the owner is fine naming it publicly |

Command used (config kept outside the repository because the ticket owns only this report):

```sh
secretlint --secretlintrc <rc with the recommend preset> --secretlintignore /dev/null "audit/**"
```

`gitleaks` is not installed in this environment; `secretlint` was used as the ticket allows. The repository has no `.secretlintrc` today, so `npx secretlint "audit/**"` as written in the ticket needs a config file (not owned by this ticket).

## Classification per subtree

Decision key: **keep** = stays in `audit/`, public; **keep (tooling)** = cannot move without a code change; **move** = candidate for `docs/internal/` or a history branch; **scrub** = needs edits before publication.

| Subtree | Files | KB | Ticket-key mentions | Content | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `audit/` root files (`00`-`10`, `README`, `audit-index`, `adr-review`) | 14 | 69 | 13 | Italian static audit of the original package and the Jira/Confluence migration plan | **move** to `docs/internal/` (or leave as history); not useful to external contributors; contains Atlassian/Confluence planning language |
| `adr/` | 12 | 38 | 35 | ADRs 0001-0008 (status "Proposto", Italian body), new English ADRs 0012, 0013, 0020, index `README.md` | **keep** (D1 location); add the English index below; translate or mark 0001-0008 as historical |
| `api/` | 8 | 65 | 130 | export matrix, root API proposal, deep-import audit; `public-root-api.snapshot` | **keep (tooling)** for the snapshot file; other files **move** or keep as history; **scrub** the local path in `internal-experimental-export-fencing-plrnui-26.md` |
| `backlog/` | 1 | 14 | 0 | older Jira backlog plan | **move**; superseded by `texo-v1/backlog/` |
| `components/` | 10 | 77 | 126 | component audits per ticket | **move** (history); **scrub** if kept |
| `dependencies/` | 10 | 70 | 114 | native dependency gate, peer policy, strategies | **keep**: live policy referenced by ADR 0012/0013 and tickets (`native-dependency-gate.md`, `peer-dependency-policy.md`, `motion-dependency-strategy.md`) |
| `docs/` | 11 | 70 | 136 | audit-era documentation notes | **move**; overlaps `docs/` |
| `migration/` | 3 | 66 | 264 | breaking-change register, migration governance | **keep**: the breaking-change register is a gate in `native-dependency-gate.md` |
| `release/` | 20 | 137 | 397 | per-RC release notes, validation reports, readiness reviews | **keep** the two release notes and `release-readiness-current.md`; **move** the per-ticket validation reports; **scrub** local paths (6 files) |
| `risk-assessment/` | 10 | 31 | 43 | risk assessments referenced by the dependency gate | **keep** |
| `texo-v1/` | 57 | 2335 | 548 | V1 program: backlog JSON (generated), tickets, STATE, DECISIONS, reviews, spikes, scripts | **keep (tooling)** while the E18 execution protocol runs; revisit after 1.0 (history branch or private); 2.3 MB of generated JSON is the bulk of `audit/` |
| `theme/` | 12 | 54 | 118 | theme/token audits per ticket | **move** (history); **scrub** local paths (2 files) |

Totals: keep or keep (tooling): `adr`, `dependencies`, `migration`, `risk-assessment`, `texo-v1`, the snapshot in `api`, selected `release` files. Move candidates: root files, `backlog`, `components`, `docs`, most of `api`, `theme`, per-ticket `release` reports. No subtree needs to be excluded for security reasons.

## Proposed ADR layout and English index

Keep `audit/adr/NNNN-slug.md` (D1: numbers allocated centrally, `docs/adr/` is not used). Replace the body of `audit/adr/README.md` after the naming/status/template sections with this index (owned by a later ticket):

| ADR | Title | Status | Language of body |
| --- | --- | --- | --- |
| 0001 | Package Identity and Naming | Proposed (historical; superseded in part by the Texo naming decision H1) | Italian |
| 0002 | Public API Export Policy | Proposed | Italian |
| 0003 | Component Stability Classification | Proposed | Italian |
| 0004 | Theme Token Architecture | Proposed | Italian |
| 0005 | Expo and React Native Compatibility Baseline | Proposed | Italian |
| 0006 | Build, Packaging and Release Strategy | Proposed | Italian |
| 0007 | Documentation and Example App Strategy | Proposed | Italian |
| 0008 | Migration Governance and Breaking Change Policy | Proposed | Italian |
| 0009 | Subpath exports (reserved, E14-01) | not written | |
| 0010 | Peer and optional dependencies (reserved) | not written | |
| 0011 | Semver, API stability and deprecation (reserved, E17-07) | not written | |
| 0012 | Motion engine and optional peers | Proposed, pending owner sign-off | English |
| 0013 | Legacy shim policy | Accepted (D10 items), Pending H4 section | English |
| 0014 | API conventions (reserved) | not written | |
| 0015 | Overlay architecture (reserved) | not written | |
| 0016 | Metadata single source (reserved, E1-01) | not written | |
| 0020 | Jira-driven ticket execution protocol | Accepted | English |

Notes: ADRs 0001-0008 are still "Proposto"; the owner decides whether to mark them Accepted/Superseded and whether to translate them. The reserved numbers come from D1 in `DECISIONS.md`.

## Human-only decisions (flagged)

1. **H7: public or private `audit/`?** The recorded answer is "Default accepted" without the value. The owner must state it (recommended: keep the tooling-referenced parts public, move the rest to `docs/internal/` or a history branch).
2. Whether the internal product names `AURA` and `UI Experience` and the ticket keys may appear in the public repository.
3. Whether to scrub the local paths (`/home/optimus/...`, 13 files) or accept them. Scrubbing edits files outside this ticket and needs its own ticket.
4. Whether ADRs 0001-0008 are translated, accepted, or marked historical.
5. Whether `texo-v1/` (2.3 MB of generated backlog JSON, ticket keys, review notes) stays public after 1.0.
6. A `.secretlintrc` (or gitleaks config) in the repository so the scan can run in CI (`npx secretlint "audit/**"` needs it).

## Not done in this ticket

No `audit/` file was moved, deleted or edited: the ticket owns only this report. The moves, scrubs, README index and secretlint config need follow-up tickets once the owner answers H7.
