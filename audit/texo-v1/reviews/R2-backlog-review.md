# R2 — Texo v1 backlog review (ticket quality & backlog engineering)

Reviewer: independent R2. Inputs: `audit/texo-v1/tickets/E1..E17.json` (all 17 streams present, incl. E2/E3/E10). Ticket files not modified. Analysis script kept outside the repo (scratchpad `analyze.py`, `decisions.py`, `after.py`, `render.py`). Machine-readable actions: `audit/texo-v1/reviews/R2-dedup-map.json`.

## 0. Headline numbers

| Metric | Value |
|---|---|
| Tickets | 363 |
| Size S / M / L | 167 / 189 / 7 |
| Schema violations (missing field, empty list, bad enum, title>100, non-kebab label) | 0 |
| Tickets whose stream prefix != epic (informational) | 19 |
| Acceptance criteria flagged vague / not objectively checkable | 61 (in 57 tickets) |
| Unresolved dependency ids | 0 |
| External deps (PLRNUI keys) | 3 (all PLRNUI-77) |
| Dependency cycles (before / after fixes) | 0 / 0 |
| Cross-stream dependency edges | 64 |
| Topological waves (before -> after fixes) | 8 -> 11 |
| Critical path, size-weighted S=1 M=2 L=4 (before -> after) | 15 (7 tickets) -> 18 (11 tickets) |
| filesTouched collisions between unordered tickets (before -> after fixes) | 163 -> 0 |
| Size L tickets to split | 7 |
| Duplicate clusters identified | 39 |
| Proposed drop / merge / rescope / split | 19 / 11 / 20 / 7 |
| Proposed added dependency edges | 115 |
| Backlog after dedup | 333 tickets (+9 from splits = 342) |
| UI tickets missing a coverage obligation (a11y/catalog/docs/tests) | 88 of 171 |
| Mission gaps (missing tickets) | 8 |

Verdict: schema hygiene is good (0 hard violations). The backlog is **not parallel-safe as drafted**: 163 unordered filesTouched collisions, 39 duplicate/overlap clusters across streams (30 tickets to drop or merge), and four competing component-metadata sources. All collisions are removable with the drop/merge/addDeps set below (re-check after fixes: 0 collisions, 0 cycles).

## 1. Counts

### 1a. Per stream file x size
| Stream | S | M | L | Total | Proposed drop/merge |
|---|---|---|---|---|---|
| E1 | 23 | 14 | 0 | 37 | 1 |
| E2 | 14 | 6 | 0 | 20 | 0 |
| E3 | 12 | 3 | 0 | 15 | 3 |
| E4 | 8 | 14 | 0 | 22 | 0 |
| E5 | 12 | 17 | 0 | 29 | 2 |
| E6 | 6 | 24 | 4 | 34 | 4 |
| E7 | 18 | 15 | 0 | 33 | 6 |
| E8 | 10 | 17 | 1 | 28 | 0 |
| E9 | 3 | 11 | 0 | 14 | 6 |
| E10 | 11 | 3 | 0 | 14 | 3 |
| E11 | 3 | 11 | 2 | 16 | 0 |
| E12 | 7 | 10 | 0 | 17 | 3 |
| E13 | 15 | 19 | 0 | 34 | 1 |
| E14 | 3 | 8 | 0 | 11 | 0 |
| E15 | 9 | 7 | 0 | 16 | 0 |
| E16 | 8 | 2 | 0 | 10 | 1 |
| E17 | 5 | 8 | 0 | 13 | 0 |
| **Total** | 167 | 189 | 7 | 363 | 30 |

### 1b. Per `epic` field x size (tickets filed by a stream into another epic are counted here)
| Epic | S | M | L | Total |
|---|---|---|---|---|
| E1 | 12 | 9 | 0 | 21 |
| E2 | 14 | 6 | 0 | 20 |
| E3 | 12 | 3 | 0 | 15 |
| E4 | 9 | 15 | 0 | 24 |
| E5 | 15 | 19 | 0 | 34 |
| E6 | 11 | 26 | 4 | 41 |
| E7 | 18 | 15 | 0 | 33 |
| E8 | 10 | 15 | 0 | 25 |
| E9 | 4 | 11 | 0 | 15 |
| E10 | 11 | 3 | 0 | 14 |
| E11 | 3 | 11 | 2 | 16 |
| E12 | 7 | 10 | 1 | 18 |
| E13 | 15 | 19 | 0 | 34 |
| E14 | 4 | 9 | 0 | 13 |
| E15 | 9 | 7 | 0 | 16 |
| E16 | 8 | 3 | 0 | 11 |
| E17 | 5 | 8 | 0 | 13 |

## 2. Schema check

Required fields checked: id, epic, type, title, priority, labels, problem, value, scope, outOfScope, acceptance, dependencies, validation, evidence, risks, dod, filesTouched, size, semver; enums for size/priority/semver/type; id pattern; kebab-case labels; title <=100 chars; non-empty acceptance/validation/dod/filesTouched/scope.

- Hard violations: **0**. Longest title: 91 chars (E8-05).
- Stream/epic mismatch (allowed by brief, but Jira import must use `epic`, not the id prefix): E1-12->E5, E1-16->E5, E1-17->E4, E1-18->E5, E1-21->E4, E1-22->E5, E1-23->E5, E1-25->E6, E1-26->E6, E1-28->E6, E1-29->E6, E1-30->E6, E1-32->E6, E1-33->E6, E1-35->E14, E1-36->E9, E8-02->E14, E8-27->E12, E8-28->E16.

### 2a. Vague / non-verifiable acceptance criteria
Heuristic: contains a subjective word (correctly, cleanly, properly, good, clean...) or has no command/test/inspection cue. Each needs a concrete check (command + expected output, named test, or file inspection).

| Ticket | Criterion | Flag | Rewrite hint |
|---|---|---|---|
| E1-05 | CI workflow step runs maturity:check (actionlint-clean) | clean | name the test file/assertion or command + exit code |
| E1-06 | B, P, Small, Quote, TextGroup, FormField are covered | no verification cue/too short | name the test file/assertion or command + exit code |
| E1-15 | Types declared once | no verification cue/too short | name the test file/assertion or command + exit code |
| E2-02 | themeTokens.ts compiles and createThemeTokens output keys unchanged | no verification cue/too short | name the test file/assertion or command + exit code |
| E2-06 | Override via theme.recipes changes output and is typed | no verification cue/too short | name the test file/assertion or command + exit code |
| E2-08 | Legacy stored value 'dark' restores correctly (test) | correctly | name the test file/assertion or command + exit code |
| E2-09 | Works without DensityProvider (falls back to theme) | no verification cue/too short | name the test file/assertion or command + exit code |
| E3-05 | Works without MotionProvider using defaults | no verification cue/too short | name the test file/assertion or command + exit code |
| E3-14 | Recommendation: go/no-go with conditions | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-01 | Portal renders children at OverlayHost, unmounts cleanly on host unmount | cleanly | name the test file/assertion or command + exit code |
| E6-05 | Respects reduce-motion | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-07 | Closes via back/Escape/backdrop/drag | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-07 | Reduce-motion disables spring animation | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-12 | Disabled items skipped | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-13 | Positions clamp within window | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-19 | Disabled prev on first and next on last | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-22 | Dismiss-on-tap-outside configurable | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-22 | Cleans up listeners on unmount | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-24 | Hidden when keyboard hidden | no verification cue/too short | name the test file/assertion or command + exit code |
| E6-31 | Theme tint colors used | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-06 | Action buttons use existing Button | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-07 | Technical detail hidden by default | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-10 | Card mode retains sort via a sort control and selection | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-16 | Fade animation uses native driver | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-17 | Colors drawn from theme tokens | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-21 | Adapters type-check against MediaEngine | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-27 | Animation native driver | no verification cue/too short | name the test file/assertion or command + exit code |
| E7-30 | Event rows use ListItem | no verification cue/too short | name the test file/assertion or command + exit code |
| E8-16 | useShare exposes pending state | no verification cue/too short | name the test file/assertion or command + exit code |
| E8-18 | Works without provider using module-level fallback stack | no verification cue/too short | name the test file/assertion or command + exit code |
| E8-25 | Without adapter gate still works (noop splash) | no verification cue/too short | name the test file/assertion or command + exit code |
| E9-12 | Runs on catalog routes list generated from registry | no verification cue/too short | name the test file/assertion or command + exit code |
| E10-01 | Boundary widths 479/480/767/768 resolve correctly (test) | correctly | name the test file/assertion or command + exit code |
| E10-05 | Works without provider (defaults) | no verification cue/too short | name the test file/assertion or command + exit code |
| E10-10 | Divider color from theme in light and dark | no verification cue/too short | name the test file/assertion or command + exit code |
| E10-12 | No new deps | no verification cue/too short | name the test file/assertion or command + exit code |
| E11-11 | Builds on web | no verification cue/too short | name the test file/assertion or command + exit code |
| E12-02 | 14 files exist | no verification cue/too short | name the test file/assertion or command + exit code |
| E12-02 | Each >=4 tests | no verification cue/too short | name the test file/assertion or command + exit code |
| E12-03 | Old shim path still works until migration done | no verification cue/too short | name the test file/assertion or command + exit code |
| E12-08 | CI runs it | no verification cue/too short | name the test file/assertion or command + exit code |
| E13-02 | Output byte-identical across two runs | no verification cue/too short | name the test file/assertion or command + exit code |
| E13-10 | Cards regenerate byte-identical | no verification cue/too short | name the test file/assertion or command + exit code |
| E13-16 | Mood tags drawn from fixed enum | no verification cue/too short | name the test file/assertion or command + exit code |
| E13-20 | Clean tree exits 0 | Clean | name the test file/assertion or command + exit code |
| E13-30 | Grader unit tests pass on golden good/bad outputs | good | name the test file/assertion or command + exit code |
| E14-09 | Policy states shim declares exactly one dependency: the target package | no verification cue/too short | name the test file/assertion or command + exit code |
| E14-11 | Output is deterministic across two runs | no verification cue/too short | name the test file/assertion or command + exit code |
| E15-02 | PACKAGE_NAME behavior stated | no verification cue/too short | name the test file/assertion or command + exit code |
| E15-03 | Re-running yields byte-identical output | no verification cue/too short | name the test file/assertion or command + exit code |
| E15-08 | Default (non-shim) mode unchanged | no verification cue/too short | name the test file/assertion or command + exit code |
| E15-09 | Idempotent: second run changes nothing | no verification cue/too short | name the test file/assertion or command + exit code |
| E15-12 | Code samples compile in a fixture with placeholders substituted by the existing name | no verification cue/too short | name the test file/assertion or command + exit code |
| E15-16 | Clean-room install of legacy name works via shim and imports resolve | Clean | name the test file/assertion or command + exit code |
| E16-03 | Contact address placeholder explicitly marked for human | no verification cue/too short | name the test file/assertion or command + exit code |
| E16-10 | secretlint (or gitleaks) run attached and clean | clean | name the test file/assertion or command + exit code |
| E17-01 | npx changeset status runs clean | clean | name the test file/assertion or command + exit code |
| E17-01 | sync-shim-version writes the same version into shim generation input | no verification cue/too short | name the test file/assertion or command + exit code |
| E17-02 | Dry run in a fork/branch with --dry-run completes both packages | no verification cue/too short | name the test file/assertion or command + exit code |
| E17-05 | Duplicate runs eliminated on PR push | no verification cue/too short | name the test file/assertion or command + exit code |
| E17-13 | Reviewed by a maintainer (human) | no verification cue/too short | name the test file/assertion or command + exit code |

## 3. Dependency graph

- Unresolved ids: **0**. External: E11-01->PLRNUI-77, E11-02->PLRNUI-77, E11-08->PLRNUI-77 (PLRNUI-77 must exist in Jira before import; otherwise replace with E11-02).
- Cycles: **0** before, **0** after applying all proposed edges.
- Missing ordering is the dominant defect: tickets that edit the same existing component in E1, E6 and E9 have **no** edges between them (e.g. Modal: E1-32, E6-02, E9-03). Fixed by `addDeps`.

### 3a. Cross-stream edges (64)
| From stream | Depends on stream | Edges | Examples |
|---|---|---|---|
| E5 | E4 | 36 | E5-01->E4-02, E5-08->E4-07, E5-09->E4-02, E5-10->E4-02 |
| E15 | E14 | 7 | E15-03->E14-01, E15-03->E14-07, E15-04->E14-11, E15-05->E14-11 |
| E10 | E2 | 4 | E10-01->E2-01, E10-10->E2-02, E10-12->E2-03, E10-13->E2-04 |
| E3 | E2 | 3 | E3-01->E2-01, E3-07->E2-02, E3-12->E2-01 |
| E12 | E11 | 3 | E12-06->E11-06, E12-07->E11-02, E12-14->E11-01 |
| E15 | E17 | 3 | E15-14->E17-01, E15-16->E17-02, E15-16->E17-04 |
| E17 | E14 | 3 | E17-01->E14-02, E17-03->E14-07, E17-11->E14-02 |
| E16 | E14 | 2 | E16-02->E14-07, E16-08->E14-11 |
| E9 | E11 | 1 | E9-12->E11-03 |
| E12 | E9 | 1 | E12-13->E9-12 |
| E16 | E17 | 1 | E16-06->E17-06 |

Cross-stream edges are valid but are coordination points: E2-01 (theme contract v2), E4-02/E4-03/E4-04/E4-05/E4-06/E4-11 (primitives) and E14-02/E14-07 (package identity/exports) are the most-depended-on hubs and must land in wave 0-1.

Top hubs after fixes (in-degree): E8-01 (22), E2-01 (18), E4-02 (15), E2-02 (12), E4-03 (12), E2-03 (11), E6-01 (11), E2-04 (10), E4-04 (10), E2-05 (9), E2-11 (9), E14-02 (9).

### 3b. Parallel waves (topological layers)
| Wave | Before: # | After fixes: # | After fixes: tickets |
|---|---|---|---|
| 0 | 97 | 69 | E1-01 E1-03 E1-04 E1-09 E1-10 E1-11 E1-12 E1-13 E1-14 E1-15 E1-17 E1-18 E1-22 E1-25 E1-26 E1-28 E1-30 E1-32 E1-33 E2-01 E3-02 E3-03 E3-10 E4-02 E4-04 E4-08 E4-11 E4-16 E4-18 E5-02 E5-04 E5-25 E5-28 E6-04 E6-15 E6-17 E6-19 E6-20 E6-31 E7-08 E7-13 E7-15 E7-19 E7-27 E7-31 E8-01 E9-01 E11-02 E12-04 E12-08 E12-11 E13-02 E13-04 E14-01 E14-03 E14-06 E14-07 E15-01 E15-02 E15-09 E16-01 E16-03 E16-04 E16-05 E16-09 E16-10 E17-06 E17-07 E17-10 |
| 1 | 106 | 67 | E1-02 E1-06 E1-07 E1-08 E1-16 E1-19 E1-20 E1-21 E1-23 E1-27 E1-29 E1-34 E1-35 E2-02 E2-03 E2-04 E2-06 E2-07 E3-01 E4-01 E4-05 E4-12 E5-01 E5-03 E5-09 E5-10 E5-26 E5-27 E6-03 E6-26 E6-32 E7-20 E7-21 E8-03 E8-05 E8-06 E8-07 E8-08 E8-09 E8-10 E8-11 E8-13 E8-15 E8-16 E8-18 E8-23 E8-24 E8-25 E9-07 E9-11 E10-01 E11-04 E12-07 E13-03 E13-16 E14-02 E14-04 E14-08 E14-09 E15-03 E15-11 E15-12 E15-15 E16-02 E16-06 E17-03 E17-08 |
| 2 | 70 | 44 | E1-24 E1-31 E2-05 E2-08 E2-09 E2-11 E3-04 E3-08 E4-03 E4-06 E4-07 E4-10 E4-19 E5-05 E5-11 E5-22 E6-01 E6-18 E6-24 E6-27 E6-28 E7-05 E8-02 E8-17 E8-19 E9-02 E9-08 E10-02 E10-03 E10-06 E10-12 E12-01 E13-05 E13-13 E14-05 E14-10 E14-11 E15-07 E15-08 E15-10 E15-13 E17-11 E17-12 E17-13 |
| 3 | 54 | 60 | E2-10 E2-12 E2-13 E2-14 E2-15 E2-16 E2-17 E2-18 E2-19 E3-05 E3-06 E3-11 E3-14 E4-09 E4-13 E4-15 E4-17 E4-20 E4-21 E5-06 E5-08 E5-12 E5-14 E5-15 E5-17 E5-21 E6-02 E6-05 E6-07 E6-09 E6-10 E6-25 E7-11 E7-16 E7-22 E8-04 E8-14 E8-20 E9-13 E10-04 E10-05 E10-08 E10-10 E11-01 E12-02 E12-03 E12-10 E12-16 E12-17 E13-06 E13-07 E13-08 E13-09 E13-10 E13-14 E13-30 E15-04 E15-05 E15-06 E16-08 |
| 4 | 18 | 28 | E2-20 E3-09 E4-14 E5-13 E5-16 E5-19 E5-23 E6-06 E6-08 E6-11 E6-14 E6-30 E6-33 E7-02 E7-23 E7-24 E7-25 E8-12 E9-14 E11-03 E11-07 E11-09 E11-14 E11-16 E12-14 E12-15 E13-01 E13-11 |
| 5 | 11 | 28 | E1-05 E3-15 E5-18 E5-20 E6-12 E6-34 E7-03 E7-04 E7-09 E7-12 E7-14 E7-18 E7-26 E7-32 E8-21 E8-22 E9-12 E11-05 E11-06 E11-08 E11-10 E11-11 E11-12 E11-13 E11-15 E13-17 E13-18 E13-21 |
| 6 | 5 | 21 | E1-37 E4-22 E6-13 E6-29 E7-10 E7-30 E7-33 E8-26 E12-06 E13-12 E13-19 E13-22 E13-23 E13-24 E13-25 E13-26 E13-27 E13-28 E13-29 E17-01 E17-05 |
| 7 | 2 | 10 | E5-29 E8-27 E10-11 E12-13 E13-20 E13-31 E13-32 E13-33 E17-02 E17-09 |
| 8 | 0 | 4 | E8-28 E10-14 E13-34 E17-04 |
| 9 | 0 | 1 | E15-14 |
| 10 | 0 | 1 | E15-16 |

### 3c. Critical path
- Before (as drafted): weight 15: E8-01 -> E8-06 -> E8-19 -> E8-20 -> E8-26 -> E8-27 -> E8-28. This is artificially short because shared-file conflicts were not encoded as edges.
- After fixes: weight 18: E8-01 -> E8-18 -> E6-01 -> E6-07 -> E6-08 -> E6-12 -> E6-29 -> E10-11 -> E10-14 -> E15-14 -> E15-16.
- Release-path view: E14-01/E14-03/E14-06 -> E14-02 -> E17-01 -> E17-02 -> E17-04 -> E15-14 -> E15-16; E14-02 is now also the head of the package.json serial chain, so it must be scheduled in wave 1-2.

## 4. filesTouched collisions between tickets not ordered by dependency

163 pairs. Hotspots: `package.json` (42), `mkdocs.yml` (9), `src/index.ts` (5), `.github/workflows/ci.yml` (3), `src/components/Tooltip/**` (3), `src/components/Popover/**` (3), `src/components/SideBar/**` (3), `src/components/Select/**` (3). Fix column says how the pair is resolved by the dedup map (drop/merge, rescope of filesTouched, or new dependency).

| Ticket A | Ticket B | Shared paths | Fix |
|---|---|---|---|
| E1-05 | E4-22 | mkdocs.yml | serialise: E4-22 after E1-05 |
| E1-05 | E5-29 | mkdocs.yml; package.json | serialise: E5-29 after E1-05 |
| E1-05 | E8-02 | package.json | files moved to config/exports.json (E14-02 generates package.json) |
| E1-05 | E12-01 | package.json | serialise: E1-05 after E12-01 |
| E1-05 | E12-03 | package.json | serialise: E1-05 after E12-03 |
| E1-05 | E12-09 | package.json | E12-09 dropped/merged into E14-05 |
| E1-05 | E12-12 | .github/workflows/ci.yml | E12-12 dropped/merged into E17-05 |
| E1-05 | E13-01 | package.json | serialise: E1-05 after E13-01 |
| E1-05 | E13-34 | mkdocs.yml | serialise: E13-34 after E1-05 |
| E1-05 | E14-02 | package.json | serialise: E1-05 after E14-02 |
| E1-05 | E15-14 | package.json | serialise: E15-14 after E1-05 |
| E1-05 | E16-02 | mkdocs.yml | serialise: E1-05 after E16-02 |
| E1-05 | E17-01 | package.json | serialise: E17-01 after E1-05 |
| E1-05 | E17-05 | .github/workflows/ci.yml | serialise: E17-05 after E1-05 |
| E1-08 | E4-22 | docs/components.md | serialise: E4-22 after E1-08 |
| E1-08 | E5-29 | docs/components.md | serialise: E5-29 after E1-08 |
| E1-09 | E9-07 | src/components/Button/** ~ src/components/Button/Button.tsx | serialise: E9-07 after E1-09 |
| E1-09 | E9-08 | src/components/Button/** ~ src/components/Button/Button.tsx | serialise: E9-08 after E1-09 |
| E1-12 | E9-08 | src/components/Input/** ~ src/components/Input/Input.tsx | serialise: E9-08 after E1-12 |
| E1-13 | E6-11 | src/components/Tooltip/** | serialise: E6-11 after E1-13 |
| E1-13 | E9-03 | src/components/Tooltip/** ~ src/components/Tooltip/Tooltip.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E1-14 | E6-10 | src/components/Popover/** | serialise: E6-10 after E1-14 |
| E1-14 | E9-03 | src/components/Popover/** ~ src/components/Popover/Popover.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E1-15 | E6-30 | src/components/SideBar/** | serialise: E6-30 after E1-15 |
| E1-15 | E9-05 | src/components/SideBar/** ~ src/components/SideBar/SideBar.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E1-16 | E9-06 | src/components/FormField/** ~ src/components/FormField/FormField.tsx | E9-06 dropped/merged into E1-16, E1-18, E1-23 |
| E1-17 | E9-08 | src/components/Text/** ~ src/components/Text/Text.tsx | serialise: E9-08 after E1-17 |
| E1-18 | E6-14 | src/components/Select/** | serialise: E6-14 after E1-18 |
| E1-18 | E9-06 | src/components/Select/** ~ src/components/Select/Select.tsx | E9-06 dropped/merged into E1-16, E1-18, E1-23 |
| E1-19 | E2-05 | src/components/Box/** ~ src/components/Box/Box.tsx | serialise: E2-05 after E1-19 |
| E1-19 | E11-07 | examples/layout-primitives.tsx | serialise: E11-07 after E1-19 |
| E1-19 | E15-14 | examples/layout-primitives.tsx ~ examples/** | serialise: E15-14 after E1-19 |
| E1-20 | E2-05 | src/components/Card/** ~ src/components/Card/Card.tsx | serialise: E2-05 after E1-20 |
| E1-20 | E9-04 | src/components/Badge/** ~ src/components/Badge/Badge.tsx | E9-04 dropped/merged into E1-25, E1-26, E1-20 |
| E1-20 | E15-14 | examples/surfaces.tsx ~ examples/** | serialise: E15-14 after E1-20 |
| E1-21 | E15-14 | examples/typography.tsx ~ examples/** | serialise: E15-14 after E1-21 |
| E1-22 | E9-07 | src/components/Checkbox/** ~ src/components/Checkbox/Checkbox.tsx; src/components/RadioGroup/** ~ src/components/RadioGroup/RadioGroup.tsx; src/components/Switc | serialise: E9-07 after E1-22 |
| E1-23 | E9-06 | src/components/PasswordInput/** ~ src/components/PasswordInput/PasswordInput.tsx; src/components/Textarea/** ~ src/components/Textarea/Textarea.tsx | E9-06 dropped/merged into E1-16, E1-18, E1-23 |
| E1-24 | E11-16 | examples/form-controls.tsx | serialise: E11-16 after E1-24 |
| E1-24 | E15-14 | examples/form-controls.tsx ~ examples/** | serialise: E15-14 after E1-24 |
| E1-25 | E6-03 | src/components/Alert/** | serialise: E6-03 after E1-25 |
| E1-25 | E9-04 | src/components/Alert/** ~ src/components/Alert/Alert.tsx | E9-04 dropped/merged into E1-25, E1-26, E1-20 |
| E1-26 | E9-04 | src/components/ProgressBar/** ~ src/components/ProgressBar/ProgressBar.tsx; src/components/Spinner/** ~ src/components/Spinner/Spinner.tsx | E9-04 dropped/merged into E1-25, E1-26, E1-20 |
| E1-27 | E11-07 | examples/feedback.tsx | serialise: E11-07 after E1-27 |
| E1-27 | E15-14 | examples/feedback.tsx ~ examples/** | serialise: E15-14 after E1-27 |
| E1-28 | E9-05 | src/components/Link/** ~ src/components/Link/Link.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E1-29 | E6-28 | src/components/TopBar/** | serialise: E6-28 after E1-29 |
| E1-29 | E6-29 | src/components/BottomBar/** | serialise: E6-29 after E1-29 |
| E1-29 | E9-05 | src/components/BottomBar/** ~ src/components/BottomBar/BottomBar.tsx; src/components/TopBar/** ~ src/components/TopBar/TopBar.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E1-30 | E6-26 | src/components/NavContext/** | serialise: E6-26 after E1-30 |
| E1-30 | E6-29 | src/components/NavBar/** | serialise: E6-29 after E1-30 |
| E1-30 | E9-05 | src/components/NavBar/** ~ src/components/NavBar/NavBar.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E1-31 | E11-16 | examples/navigation.tsx | serialise: E11-16 after E1-31 |
| E1-31 | E15-14 | examples/navigation.tsx ~ examples/** | serialise: E15-14 after E1-31 |
| E1-32 | E6-02 | src/components/Modal/** | serialise: E6-02 after E1-32 |
| E1-32 | E9-03 | src/components/Modal/** ~ src/components/Modal/Modal.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E1-33 | E6-07 | src/components/BottomSheet/** | serialise: E6-07 after E1-33 |
| E1-33 | E9-03 | src/components/BottomSheet/** ~ src/components/BottomSheet/BottomSheet.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E1-34 | E11-16 | examples/overlays.experimental.tsx | serialise: E11-16 after E1-34 |
| E1-34 | E15-14 | examples/overlays.experimental.tsx ~ examples/**; examples/overlays.tsx ~ examples/** | serialise: E15-14 after E1-34 |
| E1-35 | E4-22 | audit/api/public-root-api.snapshot; src/index.ts | serialise: E4-22 after E1-35 |
| E1-35 | E5-29 | audit/api/public-root-api.snapshot; src/index.ts | serialise: E5-29 after E1-35 |
| E1-35 | E12-04 | tests/types/public-api.contract.ts ~ tests/types/** | rescope E12-04: Narrow filesTouched tests/types/** to named files (collides with E1-35, E2-06, E15-05) |
| E1-35 | E15-14 | src/index.ts | serialise: E15-14 after E1-35 |
| E2-06 | E12-04 | tests/types/recipe.types.ts ~ tests/types/** | rescope E12-04: Narrow filesTouched tests/types/** to named files (collides with E1-35, E2-06, E15-05) |
| E2-20 | E15-14 | examples/theme-presets.tsx ~ examples/** | serialise: E15-14 after E2-20 |
| E3-07 | E4-12 | src/components/Skeleton/Skeleton.tsx ~ src/components/Skeleton/**; src/components/Skeleton/index.ts ~ src/components/Skeleton/** | E3-07 dropped/merged into E4-12 |
| E3-07 | E6-21 | src/components/Skeleton/Skeleton.tsx ~ src/components/Skeleton/**; src/components/Skeleton/index.ts ~ src/components/Skeleton/** | E3-07 dropped/merged into E4-12 |
| E3-07 | E7-05 | src/components/Skeleton/Skeleton.tsx ~ src/components/Skeleton/**; src/components/Skeleton/index.ts ~ src/components/Skeleton/** | E3-07 dropped/merged into E4-12 |
| E3-15 | E15-14 | examples/motion.tsx ~ examples/** | serialise: E15-14 after E3-15 |
| E4-07 | E6-25 | src/components/Screen/** | rescope E6-25: Remove Screen; AppShell only; filesTouched -> src/components/AppShell/** |
| E4-11 | E6-01 | src/components/Portal/** | rescope E6-01: Remove Portal; OverlayHost/useOverlay on E4-11; filesTouched -> src/components/OverlayHost/** |
| E4-12 | E6-21 | src/components/Skeleton/** | E6-21 dropped/merged into E4-12 |
| E4-12 | E7-05 | src/components/Skeleton/** | rescope E7-05: Presets only (SkeletonList/Card/Profile) on E4-12; filesTouched -> src/components/SkeletonPresets/** |
| E4-13 | E7-17 | src/components/Avatar/** | E7-17 dropped/merged into E4-13 |
| E4-16 | E7-02 | src/components/List/** | rescope E4-16: Rename to BulletList; filesTouched -> src/components/BulletList/** |
| E4-20 | E6-16 | src/components/Accordion/** | E6-16 dropped/merged into E4-20 |
| E4-21 | E7-01 | src/components/ListItem/** | E7-01 dropped/merged into E4-21 |
| E4-22 | E13-34 | mkdocs.yml | serialise: E13-34 after E4-22 |
| E4-22 | E15-14 | src/index.ts | serialise: E15-14 after E4-22 |
| E4-22 | E16-02 | mkdocs.yml | serialise: E4-22 after E16-02 |
| E5-15 | E7-29 | src/components/Calendar/** | E7-29 dropped/merged into E5-15 |
| E5-29 | E8-02 | package.json | serialise: E5-29 after E8-02 |
| E5-29 | E12-01 | package.json | serialise: E5-29 after E12-01 |
| E5-29 | E12-03 | package.json | serialise: E5-29 after E12-03 |
| E5-29 | E12-09 | package.json | E12-09 dropped/merged into E14-05 |
| E5-29 | E13-01 | package.json | serialise: E5-29 after E13-01 |
| E5-29 | E13-34 | mkdocs.yml | serialise: E13-34 after E5-29 |
| E5-29 | E14-02 | package.json | serialise: E5-29 after E14-02 |
| E5-29 | E15-14 | package.json; src/index.ts | serialise: E15-14 after E5-29 |
| E5-29 | E16-02 | mkdocs.yml | serialise: E5-29 after E16-02 |
| E5-29 | E17-01 | package.json | files moved to config/exports.json (E14-02 generates package.json) |
| E6-02 | E9-03 | src/components/Modal/** ~ src/components/Modal/Modal.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E6-03 | E9-04 | src/components/Alert/** ~ src/components/Alert/Alert.tsx | E9-04 dropped/merged into E1-25, E1-26, E1-20 |
| E6-07 | E9-03 | src/components/BottomSheet/** ~ src/components/BottomSheet/BottomSheet.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E6-10 | E9-03 | src/components/Popover/** ~ src/components/Popover/Popover.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E6-11 | E9-03 | src/components/Tooltip/** ~ src/components/Tooltip/Tooltip.tsx | E9-03 dropped/merged into E1-13, E1-14, E1-32, E1-33 |
| E6-14 | E9-06 | src/components/Select/** ~ src/components/Select/Select.tsx | E9-06 dropped/merged into E1-16, E1-18, E1-23 |
| E6-21 | E7-05 | src/components/Skeleton/** | E6-21 dropped/merged into E4-12 |
| E6-28 | E9-05 | src/components/TopBar/** ~ src/components/TopBar/TopBar.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E6-29 | E9-05 | src/components/BottomBar/** ~ src/components/BottomBar/BottomBar.tsx; src/components/NavBar/** ~ src/components/NavBar/NavBar.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E6-30 | E9-05 | src/components/SideBar/** ~ src/components/SideBar/SideBar.tsx | E9-05 dropped/merged into E1-15, E1-28, E1-29, E1-30 |
| E8-01 | E12-07 | tests/native/core/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-02 | E12-01 | package.json | files moved to config/exports.json (E14-02 generates package.json) |
| E8-02 | E12-03 | package.json | files moved to config/exports.json (E14-02 generates package.json) |
| E8-02 | E12-09 | package.json | E12-09 dropped/merged into E14-05 |
| E8-02 | E13-01 | package.json | files moved to config/exports.json (E14-02 generates package.json) |
| E8-02 | E14-02 | package.json | serialise: E8-02 after E14-02 |
| E8-02 | E14-03 | tsconfig.build.json | serialise: E8-02 after E14-03 |
| E8-02 | E15-14 | package.json | serialise: E15-14 after E8-02 |
| E8-02 | E17-01 | package.json | files moved to config/exports.json (E14-02 generates package.json) |
| E8-03 | E12-07 | tests/native/testing/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-04 | E12-07 | tests/native/appearance/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-05 | E12-07 | tests/native/accessibility/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-06 | E12-07 | tests/native/app-state/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-07 | E12-07 | tests/native/network/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-08 | E12-07 | tests/native/orientation/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-09 | E12-07 | tests/native/device/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-10 | E12-07 | tests/native/keyboard/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-11 | E12-07 | tests/native/safe-area/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-12 | E12-07 | tests/native/system-ui/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-13 | E12-07 | tests/native/haptics/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-14 | E12-07 | tests/native/haptic-pressable/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-15 | E12-07 | tests/native/clipboard/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-16 | E12-07 | tests/native/share/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-17 | E12-07 | tests/native/linking/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-18 | E12-07 | tests/native/back-handler/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-19 | E12-07 | tests/native/permissions/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-20 | E12-07 | tests/native/permissions-expo/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-21 | E12-07 | tests/native/image-picker/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-22 | E12-07 | tests/native/document-picker/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-23 | E12-07 | tests/native/storage/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-24 | E12-07 | tests/native/biometrics/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-25 | E12-07 | tests/native/app-ready/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E8-26 | E12-07 | tests/native/expo-preset/** ~ tests/native/** | rescope E12-07: Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E9-07 | E9-08 | src/components/Button/Button.tsx | serialise: E9-08 after E9-07 |
| E10-14 | E15-14 | examples/responsive.tsx ~ examples/** | serialise: E15-14 after E10-14 |
| E11-07 | E15-14 | examples/feedback.tsx ~ examples/**; examples/layout-primitives.tsx ~ examples/** | serialise: E15-14 after E11-07 |
| E11-16 | E15-14 | examples/basic-usage.tsx ~ examples/**; examples/form-controls.tsx ~ examples/**; examples/navigation.tsx ~ examples/**; examples/overlays.experimental.tsx ~ ex | serialise: E15-14 after E11-16 |
| E12-01 | E12-03 | package.json | serialise: E12-03 after E12-01 |
| E12-01 | E12-09 | package.json | E12-09 dropped/merged into E14-05 |
| E12-01 | E13-01 | package.json | serialise: E13-01 after E12-01 |
| E12-01 | E14-02 | package.json | serialise: E12-01 after E14-02 |
| E12-01 | E15-14 | package.json | serialise: E15-14 after E12-01 |
| E12-01 | E17-01 | package.json | serialise: E17-01 after E12-01 |
| E12-03 | E12-09 | package.json | E12-09 dropped/merged into E14-05 |
| E12-03 | E13-01 | package.json | serialise: E13-01 after E12-03 |
| E12-03 | E14-02 | package.json | serialise: E12-03 after E14-02 |
| E12-03 | E15-14 | package.json | serialise: E15-14 after E12-03 |
| E12-03 | E17-01 | package.json | serialise: E17-01 after E12-03 |
| E12-04 | E15-05 | tests/types/** ~ tests/types/shim-parity.ts | rescope E12-04: Narrow filesTouched tests/types/** to named files (collides with E1-35, E2-06, E15-05) |
| E12-08 | E15-08 | scripts/expo-consumer-smoke.mjs; tests/scripts/expo-consumer-smoke-script.test.tsx | serialise: E15-08 after E12-08 |
| E12-09 | E13-01 | package.json | E12-09 dropped/merged into E14-05 |
| E12-09 | E14-02 | package.json | E12-09 dropped/merged into E14-05 |
| E12-09 | E15-14 | package.json | E12-09 dropped/merged into E14-05 |
| E12-09 | E17-01 | package.json | E12-09 dropped/merged into E14-05 |
| E12-11 | E15-08 | scripts/consumer-smoke.mjs; tests/scripts/consumer-smoke-script.test.tsx | serialise: E15-08 after E12-11 |
| E12-12 | E17-05 | .github/workflows/ci.yml | E12-12 dropped/merged into E17-05 |
| E13-01 | E14-02 | package.json (files + ai:* scripts keys only) | serialise: E13-01 after E14-02 |
| E13-01 | E15-14 | package.json (files + ai:* scripts keys only) | serialise: E15-14 after E13-01 |
| E13-01 | E17-01 | package.json (files + ai:* scripts keys only) | serialise: E17-01 after E13-01 |
| E13-19 | E17-03 | scripts/release-guard.mjs | serialise: E13-19 after E17-03 |
| E13-34 | E16-02 | mkdocs.yml | serialise: E13-34 after E16-02 |

### 4a. Serialisation chains (also in JSON `serialiseFiles`)
| File(s) | Mode | Order | Fix |
|---|---|---|---|
| package.json | hard-deps + config indirection | E14-02 -> E12-01 -> E12-03 -> E13-01 -> E1-05 -> E17-01 -> E8-02 -> E5-29 -> E15-14 | E14-02 generates exports from config/exports.json; E8-02/E5-29 edit config/exports.json (not package.json) after E14-02. Script-only additions serialised in the listed order. |
| mkdocs.yml | hard-deps | E16-02 -> E1-05 -> E4-22 -> E5-29 -> E13-34 | E16-02 restructures nav first; area wiring tickets append nav in order. |
| docs/components.md | hard-deps | E1-08 -> E4-22 -> E5-29 | Generated from manifest by E1-08; wiring tickets regenerate. |
| src/index.ts + audit/api/public-root-api.snapshot | hard-deps | E1-35 -> E4-22 -> E5-29 -> E15-14 | Single barrel chain. E2-20/E3-15/E10-14/E6/E7 must declare src/index.ts if they add root exports (currently undeclared). |
| .github/workflows/ci.yml | hard-deps | E1-05 -> E17-05 -> E12-13 | E12-12 merged into E17-05. |
| examples/** | hard-deps | E1-19 -> E1-20 -> E1-21 -> E1-24 -> E1-27 -> E1-31 -> E1-34 -> E11-07 -> E11-16 -> E15-14 | E1 example edits land before E11 converts examples to stories; E15-14 last. |
| src/components/<Existing>/** | hard-deps | E1-x (demo) -> E6-x (upgrade) -> E9-07 -> E9-08 | E1 owner first, E6 upgrade second, cross-cutting E9-07 then E9-08 (both touch Button.tsx). |
| src/components/Box\|Card/** | hard-deps | E1-19 -> E1-20 -> E2-05 | Elevation resolver after demo work. |
| scripts/consumer-smoke.mjs, scripts/expo-consumer-smoke.mjs | hard-deps | E12-08 -> E12-11 -> E15-08 | Shim mode added after smoke hardening. |
| tests/types/** | narrow-glob | E12-04 -> E15-05 | E12-04 lists exact files; E15-05 after E12-04. |
| tests/native/** | narrow-glob | E12-07 | E12-07 uses tests/native-visual/**. |
| scripts/release-guard.mjs | hard-deps | E17-03 -> E13-19 | AI artifacts guard added after parameterisation. |
| tsconfig.build.json | hard-deps | E14-03 -> E8-02 | E8-02 after E14-03. |

Hidden collisions (not declared, so not detected): E2-20, E3-15, E10-14 and every E6/E7 component ticket will need `src/index.ts` (root export) and `mkdocs.yml` (nav) but do not list them. Rule: only wiring tickets may touch barrels/nav; component tickets must say "no barrel edits" (E4/E5 already do).

## 5. Size L tickets to split
| Ticket | Title | Split into |
|---|---|---|
| E6-05 | Add Toast/Snackbar system (ToastProvider, useToast, imperative toast API) | Add toast store, queue and imperative toast() API<br>Add ToastViewport rendering, swipe-dismiss and live-region a11y |
| E6-07 | Upgrade BottomSheet: snap points, drag, keyboard, safe area | Add BottomSheet snap points and drag gesture<br>Add BottomSheet keyboard, safe-area, reduce-motion and a11y |
| E6-25 | Add Screen and AppShell scaffolds (header, content, footer, insets, keyboard) | Add AppShell layout slots (header, nav region, banner, overlay host) on Screen<br>Add AppShell responsive sidebar region and screen presets |
| E6-32 | Add SwipeActions (swipeable row) with PanResponder core | Add SwipeActions row on useSwipe with left/right actions<br>Add SwipeActions a11y custom actions, web fallback and tests |
| E8-27 | Add native smoke matrix: clean Expo app, Expo Go, web, bare RN | Add native smoke: clean Expo app and web export<br>Add native smoke: Expo Go compatibility run<br>Add native smoke: bare React Native app |
| E11-12 | Create dashboard, settings and onboarding starter templates | Create dashboard starter template<br>Create settings starter template<br>Create onboarding starter template |
| E11-13 | Create e-commerce and social feed starter templates | Create e-commerce starter template<br>Create social feed starter template |

Borderline M (split if the agent cannot finish in one session): E2-20 (14 deps, docs+ADR+barrels), E5-29 and E4-22 (wiring 20+ items), E13-31 (eval tasks + uplift report), E6-12 (Menu with keyboard nav), E8-26 (13 adapters).

## 6. Near-duplicate tickets and canonical owner decisions
| Topic | Tickets | Canonical owner | Decision |
|---|---|---|---|
| Skeleton | E3-07, E4-12, E6-21, E7-05 | E4-12 | E4-12 owns the Skeleton primitive (text/rect/circle, shimmer, reduced-motion static). E7-05 rescoped to presets only (SkeletonList/Card/Profile) in src/components/SkeletonPresets/** depending on E4-12. Drop E3-07 and E6-21. |
| Avatar / AvatarGroup | E4-13, E4-14, E7-17 | E4-13 + E4-14 | E4 owns Avatar (initials, status dot) and AvatarGroup. Drop E7-17. E4-13 may use E7-16 Image later via optional prop (no hard dep). |
| Calendar | E5-15, E7-29 | E5-15 | E5-15 owns Calendar; fold 'marked dates' and 'today highlight' from E7-29 into E5-15 acceptance. Drop E7-29; E7-30 Agenda depends on E5-15. |
| Accordion / Collapsible | E4-19, E4-20, E6-16 | E4-19 + E4-20 | E4 owns Collapsible+Accordion. Drop E6-16. |
| Select | E1-18, E6-14, E9-06, E5-20 | E1-18 (demo) then E6-14 (upgrade) | E1-18 brings Select to demo; E6-14 becomes a follow-up depending on E1-18 and loses 'multi' (canonical E5-20 MultiSelect). E9-06 folded into E1-18/E1-16/E1-23. |
| Portal / overlay host | E4-11, E6-01 | E4-11 (Portal/PortalHost) | E4-11 owns Portal. E6-01 rescoped to OverlayHost stack manager (z-order, topmost back/Escape, useOverlay) built on E4-11, in src/components/OverlayHost/**; depends on E4-11 and E8-18 (back-handler layer stack). |
| Stepper / ProgressSteps | E6-17, E7-28 | E6-17 | E6-17 Stepper covers the display stepper; drop E7-28. |
| Toast | E6-05, E6-33 | E6-05 | Single owner already (E6-05); E6-33 consumes it. E6-05 is L: split. |
| Reduced-motion hook | E3-03, E8-05, E9-09 | E3-03 | E3-03 is the only export named useReducedMotion. E8-05 re-exports it (drop its own impl). Drop E9-09; gating of existing animated components goes into E1-26 (Spinner/ProgressBar), E6-02 (Modal), E6-07 (BottomSheet) acceptance. |
| Haptics adapter | E3-13, E8-13, E8-14 | E8-13 | E8-13 owns HapticsAdapter + useHaptics (native layer, expo adapter). Drop E3-13 and src/haptics barrel from E3-15. E8-14 keeps useHapticPress hook only; HapticPressable = Touchable(E4-03) + hook. |
| Pressable primitives | E4-03, E3-06, E8-14 | E4-03 Touchable | One pressable primitive. E3-06 keeps usePressFeedback + PressableScale built on Touchable (dep E4-03). E8-14 composes with Touchable (dep E4-03). |
| Keyboard hooks / avoiding screen | E5-07, E6-22, E8-10, E4-07, E5-08 | E8-10 (hooks) + E4-07 (Screen keyboardAvoiding) | Drop E5-07 and E6-22. E5-08, E6-07, E6-24 depend on E8-10. KeyboardAvoidingScreen behaviour = E4-07 Screen keyboardAvoiding prop. |
| Safe area | E6-23, E8-11, E10-07, E4-07 | E8-11 | E8-11 owns SafeAreaAdapter/useInsets. Drop E6-23 and E10-07 (fold ThemeAppShell safeArea prop into E8-11 scope, or a follow-up). E4-07, E6-25, E6-28, E6-29 depend on E8-11. |
| Screen / AppShell | E4-07, E6-25 | E4-07 (Screen) | E4-07 owns Screen. E6-25 loses Screen, becomes AppShell only (src/components/AppShell/**) depending on E4-07, E8-10, E8-11, E6-01. |
| EmptyState / ErrorState | E6-20, E7-06, E7-07 | E6-20 | E6-20 owns EmptyState/ErrorState/LoadingState/Result. Drop E7-06, E7-07; E7-22 and E7-33 depend on E6-20. |
| ListItem | E4-21, E7-01 | E4-21 | E4-21 owns ListItem. Drop E7-01; E7-02, E7-14, E7-30, E7-33 depend on E4-21. |
| List (name clash) | E4-16, E7-02 | E7-02 keeps `List` (virtualized) | Not a functional dup but both claim src/components/List/**. Rename E4-16 to BulletList (src/components/BulletList/**). |
| Container / PageContainer | E4-10, E10-13, E10-06 | E4-10 | E4-10 owns max-width Container; depends on E10-01 for breakpoint gutters. Drop E10-13. Rename E10-06 component (e.g. MeasuredContainer) to avoid the `Container` name clash. |
| Grid / AdaptiveGrid | E4-09, E10-09 | E4-09 | E4-09 owns Grid; uses E10-03 resolver (dep). Fold minItemWidth auto-fit into E4-09. Drop E10-09. |
| PullToRefresh | E3-12, E6-31 | E6-31 | E6-31 (web fallback) owns it; drop E3-12; fold themed tint colours into E6-31. |
| Swipe gesture | E3-10, E6-32 | E3-10 (useSwipe core) | E6-32 must consume E3-10 instead of its own PanResponder core (dep), and is L: split. |
| SegmentedControl / SegmentedTabs | E5-13, E6-15 | E5-13 | Drop SegmentedTabs from E6-15 scope; Tabs only. |
| Contrast checking | E2-11, E9-10, E1-09, E1-20 | E2-11 | E2-11 owns contrast util + CI script per preset/mode; merge E9-10 pair list into it. |
| Font scale / Dynamic Type | E8-05, E9-08, E10-12, E2-03 | E8-05 (useFontScale) | E10-12 keeps large-text layout switching only, depends on E8-05. E9-08 depends on E8-05 and E2-03. |
| Orientation / window metrics | E8-08, E10-02 | E8-08 (useOrientation, window metrics) | E10-02 keeps useWindowSizeClass, depends on E8-08. |
| System color scheme | E2-08, E8-04 | E2-08 | E8-04 is the adapter bridge only and depends on E2-08; no second system-mode implementation. |
| Image/document pickers | E5-23, E5-24, E8-21, E8-22 | E5-23 (FileField UI) + E8-21/E8-22 (adapters) | Drop E5-24. E8-21/E8-22 drop ImagePickerField/DocumentPickerField UIs and depend on E5-23. |
| Field vs FormField | E5-05, E1-16 | E5-05 (compound Field) | FormField stays as compat wrapper delegating to Field; E5-05 depends on E1-16 (ordering), follow-up recorded in E5-05 scope. |
| Existing-component a11y fixes | E9-03, E9-04, E9-05, E9-06 | E1 component tickets | Fold into E1-13/14/32/33, E1-25/26/20, E1-15/28/29/30, E1-16/18/23; E9-02 contract table is the verification. |
| a11y tests for all components | E1-36, E9-02 | E9-02 | Merge E1-36 into E9-02; E1-37 depends on E9-02. |
| API snapshot / tree-shaking / size | E12-05, E12-09, E14-05, E14-11, E17-11 | E14-11 (API snapshot), E14-05 (size + tree-shake) | Merge E12-05 and E12-09 into E14-05. E17-11 keeps tarball content checks, reads budgets from E14-05 config. |
| CI job split | E12-12, E17-05 | E17-05 | Merge E12-12 (caching, artifacts) into E17-05; E12-13 depends on E17-05. |
| Examples compile/render | E1-04, E16-07 | E1-04 | Merge E16-07 render-each-example test into E1-04 (or a follow-up owned by E1). |
| Templates & recipes | E11-09, E11-10, E11-11, E11-12, E11-13, E11-14, E11-15, E13-14, E13-15, E13-12 | E11 (runnable templates/ and recipes/) | Merge E13-15 into E11-14/E11-15; E13-12 registry and E13-23 skill read templates/ and recipes/ (deps on E11-09, E11-14, E11-15). E13-14 composition recipes stay (doc-level). |
| Component metadata sources | E1-01, E11-01, E13-05, E4-* *.catalog.ts, E12-14 | E1-01 inventory + one colocated sidecar | Four metadata sources (manifest, catalog registry, ai/meta JSON, *.catalog.ts). Decision: E1-01 manifest = inventory/maturity; colocated <Name>.catalog.ts = per-component metadata (E13-05 rescoped to define superset schema incl. whenToUse/composition/a11y); E11-01 registry and ai/meta/*.json are generated. E11-01 and E12-14 depend on E1-01; E11-01 on E13-05. |
| TS-compiler extractors | E13-02, E14-11, E16-08 | E13-02 | One extractor module; E14-11 and E16-08 depend on E13-02. |
| Router bridge | E6-26, E6-27, E8-17 | E6-26 adapter interface | E8-17 router bridge depends on E6-26 and uses its adapter interface. |
| Adaptive nav | E10-11, E6-29, E6-30 | E6-29/E6-30 own bars | E10-11 composes them; depends on E6-29, E6-30. |
| Wiring/barrel tickets | E1-35, E4-22, E5-29, E2-20, E3-15, E10-14, E8-02 | one per area, serialised on shared files | See serialiseFiles; E6 and E7 have no wiring ticket (gap). |

### 6a. Drops
| Ticket | Title | Reason | Canonical |
|---|---|---|---|
| E3-07 | Add Skeleton component with shimmer | Duplicate Skeleton | E4-12 |
| E6-21 | Add Skeleton and SkeletonScreen presets | Duplicate Skeleton (presets move to E7-05) | E4-12 |
| E7-17 | Add Avatar and AvatarGroup with overflow count | Duplicate Avatar/AvatarGroup | E4-13 |
| E7-29 | Add Calendar month grid with range and marked dates | Duplicate Calendar (fold marked dates into E5-15) | E5-15 |
| E6-16 | Add Accordion and Collapsible with animated height | Duplicate Accordion/Collapsible | E4-20 |
| E7-28 | Add ProgressSteps stepper for multi-step flows | Duplicate stepper | E6-17 |
| E9-09 | Add reduced-motion hook and gate animated components | Duplicate useReducedMotion; gating moved into E1-26/E6-02/E6-07 | E3-03 |
| E3-13 | Add haptics adapter contract: HapticsProvider and useHaptics | Duplicate haptics adapter | E8-13 |
| E5-07 | Add useKeyboard hook (visible, height, duration, dismiss) | Duplicate useKeyboard | E8-10 |
| E6-22 | Add useKeyboard and KeyboardAvoidingScreen | Duplicate useKeyboard; avoiding screen = Screen keyboardAvoiding | E8-10 |
| E6-23 | Add SafeArea context with optional react-native-safe-area-context adapter | Duplicate safe-area adapter | E8-11 |
| E10-07 | Add safe-area adapter: SafeAreaAdapterProvider, useSafeInsets, ThemeAppShell safeArea prop | Duplicate safe-area adapter (ThemeAppShell prop folded into E8-11) | E8-11 |
| E7-06 | Add EmptyState component with illustration slot and action | Duplicate EmptyState | E6-20 |
| E7-07 | Add ErrorState component with retry and error detail | Duplicate ErrorState | E6-20 |
| E7-01 | Add ListItem row primitive with slots, press and a11y | Duplicate ListItem | E4-21 |
| E10-13 | Add PageContainer with centered max width and responsive gutters | Duplicate max-width container | E4-10 |
| E10-09 | Add AdaptiveGrid with breakpoint-driven columns | Duplicate responsive grid | E4-09 |
| E3-12 | Add themed PullToRefresh wrapper | Duplicate PullToRefresh | E6-31 |
| E5-24 | Add optional expo-image-picker / expo-document-picker adapters for FileField | Duplicate expo picker adapters | E8-21 |

### 6b. Merges (fold unique scope/acceptance into target, close source)
| Ticket | Title | Into | Reason |
|---|---|---|---|
| E9-03 | Fix a11y semantics for Modal, BottomSheet, Popover, Tooltip | E1-13, E1-14, E1-32, E1-33 | Overlay a11y semantics belong with the E1 owner tickets of those files |
| E9-04 | Fix a11y semantics for Spinner, ProgressBar, Alert, Badge | E1-25, E1-26, E1-20 | Feedback a11y semantics belong with E1 owners |
| E9-05 | Fix a11y semantics for TopBar, SideBar, BottomBar, NavBar, Link | E1-15, E1-28, E1-29, E1-30 | Navigation a11y semantics belong with E1 owners |
| E9-06 | Fix a11y semantics for Select, Textarea, FormField, PasswordInput | E1-16, E1-18, E1-23 | Form a11y semantics belong with E1 owners |
| E1-36 | Extend accessibility tests to all demo components | E9-02 | Same deliverable: a11y contract over all components |
| E9-10 | Add token contrast checker and test every theme pair | E2-11 | Same contrast util; E2-11 also validates presets |
| E12-05 | Add public API snapshot test per export kind and tree-shaking check | E14-05 | Tree-shaking check is part of the bundle measurement harness |
| E12-09 | Add size-limit bundle budget and CI check | E14-05 | Size budget gate duplicates config/size-limits.json |
| E12-12 | Split CI into parallel jobs with caching and artifacts | E17-05 | Same .github/workflows/ci.yml job split |
| E16-07 | Examples compile check and run-in-CI | E1-04 | Examples compile config duplicates tsconfig.tests.json |
| E13-15 | Author page recipes and feature templates | E11-14, E11-15 | Second templates tree (ai/templates) duplicates templates/ and recipes/ |

### 6c. Rescopes (ticket kept, scope/filesTouched edited)
| Ticket | Title | Change |
|---|---|---|
| E7-05 | Add Skeleton primitive and SkeletonList presets | Presets only (SkeletonList/Card/Profile) on E4-12; filesTouched -> src/components/SkeletonPresets/** |
| E6-01 | Add Portal and overlay stack manager (OverlayHost, useOverlay) | Remove Portal; OverlayHost/useOverlay on E4-11; filesTouched -> src/components/OverlayHost/** |
| E6-25 | Add Screen and AppShell scaffolds (header, content, footer, insets, keyboard) | Remove Screen; AppShell only; filesTouched -> src/components/AppShell/** |
| E6-14 | Upgrade Select: listbox semantics, keyboard, search, multi, sizing | Remove multi-select (E5-20); follow-up after E1-18 |
| E6-15 | Add Tabs and SegmentedTabs (scrollable, controlled, a11y) | Remove SegmentedTabs (E5-13) |
| E8-05 | Add accessibility preference hooks: reduced motion, transparency, screen reader, font scale | Re-export useReducedMotion from E3-03; keep transparency/screen-reader/font-scale |
| E8-14 | Add HapticPressable and useHapticPress for haptic-feedback in Pressable | useHapticPress hook only, composed with Touchable |
| E8-21 | Add image picker/camera adapter, useImagePicker and ImagePickerField | Drop ImagePickerField UI; adapter + hook feed FileField (E5-23) |
| E8-22 | Add document picker adapter and DocumentPickerField | Drop DocumentPickerField UI; adapter + hook feed FileField (E5-23) |
| E3-06 | Add pressable feedback (usePressFeedback, PressableScale) | PressableScale built on Touchable (E4-03) |
| E3-15 | Motion docs, example screen, area barrels and public-API test | Remove src/haptics barrel and dropped items (Skeleton, PullToRefresh) |
| E10-02 | Add useWindowSizeClass and useOrientation | useOrientation from E8-08; keep useWindowSizeClass |
| E10-06 | Add container-aware hooks: useContainerSize and Container | Rename component away from `Container` |
| E10-12 | Add useFontScale and large-text layout switching | Large-text layout switching only; useFontScale from E8-05 |
| E4-16 | Add List and ListItemText for bulleted, numbered and checklist content | Rename to BulletList; filesTouched -> src/components/BulletList/** |
| E13-05 | Define component meta sidecar schema and lint | Define superset colocated <Name>.catalog.ts schema (catalog + AI fields); ai/meta generated |
| E11-01 | Create catalog component registry (metadata, variants, states) | Registry generated from E1-01 manifest + *.catalog.ts sidecars, not hand-seeded |
| E12-07 | Add native visual option via Maestro or Expo screenshots (evaluate, optional job) | Narrow filesTouched tests/native/** -> tests/native-visual/** (collides with every E8 ticket) |
| E12-04 | Expand type tests: props contracts, polymorphism and negative cases | Narrow filesTouched tests/types/** to named files (collides with E1-35, E2-06, E15-05) |
| E6-32 | Add SwipeActions (swipeable row) with PanResponder core | Consume useSwipe (E3-10); split |

## 7. Coverage obligations missing (UI-producing tickets)
Checked 171 tickets that add/change UI or hooks under `src/` (streams E1,E3-E8,E10) for: tests in acceptance/filesTouched; a11y mention; catalog story/example; docs. E4/E5 tickets are the model (catalog sidecar + docs page + named test). E7 lacks docs pages; E3/E8/E10 lack catalog/example; E8/E10 lack a11y notes.

Totals: catalog/example: 55, a11y: 46, docs: 48, tests(in acceptance/files): 1.

| Ticket | Title | Missing |
|---|---|---|
| E1-09 | Fix Button info variant and pressed-state contrast | catalog/example |
| E1-10 | Fix CodeInline discarding computed style when props passed | a11y, catalog/example |
| E1-11 | Fix Row dead flex prop and add rowGap on wrap | a11y, catalog/example |
| E1-12 | Fix Input label leak, root wrapper and optional label | catalog/example |
| E1-13 | Fix Tooltip timer leak, native behavior and positioning | catalog/example |
| E1-14 | Make Popover functional on native and fix nested Pressable | catalog/example |
| E1-16 | Harden FormField: tokenised spacing, color safe, typed props, tests | catalog/example |
| E1-17 | Change Text default alignment from justify and apply fontFamily token | catalog/example |
| E1-18 | Rework Select: a11y, long lists, Android back, exported types | catalog/example |
| E3-03 | Add useReducedMotion and MotionProvider | catalog/example, docs |
| E3-04 | Add animation primitives: useAnimatedValue and animate() honoring tokens | a11y, catalog/example, docs |
| E3-05 | Add Presence and enter/exit transition presets | catalog/example, docs |
| E3-06 | Add pressable feedback (usePressFeedback, PressableScale) | catalog/example, docs |
| E3-07 | Add Skeleton component with shimmer | catalog/example, docs (dropped) |
| E3-08 | Add layout transition helper over LayoutAnimation | a11y, catalog/example, docs |
| E3-09 | Add useStagger for list/entrance sequencing | a11y, catalog/example, docs |
| E3-10 | Add useSwipe gesture primitive on PanResponder | a11y, catalog/example, docs |
| E3-11 | Add useDrag and Draggable primitive | a11y, catalog/example, docs |
| E3-12 | Add themed PullToRefresh wrapper | catalog/example (dropped) |
| E3-13 | Add haptics adapter contract: HapticsProvider and useHaptics | a11y, catalog/example (dropped) |
| E7-01 | Add ListItem row primitive with slots, press and a11y | docs (dropped) |
| E7-02 | Add List wrapper over FlatList with virtualization defaults | a11y |
| E7-03 | Add SectionList wrapper with sticky headers and A-Z index hook | docs |
| E7-04 | Add optional FlashList adapter for List via subpath | a11y |
| E7-05 | Add Skeleton primitive and SkeletonList presets | docs |
| E7-06 | Add EmptyState component with illustration slot and action | docs (dropped) |
| E7-07 | Add ErrorState component with retry and error detail | docs (dropped) |
| E7-08 | Add useDataTable headless model: columns, sort, selection | a11y, docs |
| E7-09 | Add DataTable view: virtualized rows, sticky header, horizontal scroll | docs |
| E7-10 | Add DataTable responsive mode: collapse columns to cards | a11y, docs |
| E7-11 | Add Stat KPI card with delta, trend and sparkline slot | docs |
| E7-12 | Add Timeline component with status nodes and connectors | docs |
| E7-13 | Add DescriptionList for key-value pairs | docs |
| E7-14 | Add Tree view with expand/collapse and keyboard/a11y | docs |
| E7-15 | Add Pager and Carousel with page indicator | docs |
| E7-16 | Add Image with placeholder, fallback and optional blurhash adapter | a11y, docs |
| E7-17 | Add Avatar and AvatarGroup with overflow count | docs (dropped) |
| E7-18 | Add Gallery grid and Lightbox viewer | docs |
| E7-19 | Add VideoPlayer shell with controller UI and adapter contract | docs |
| E7-20 | Add AudioPlayer shell with compact and full variants | tests(in acceptance/files), docs |
| E7-21 | Add expo-video and expo-av MediaEngine adapters on subpath | a11y |
| E7-22 | Add chart core: scales, ticks, palette and accessible data summary | docs |
| E7-23 | Add BarChart (pure View) vertical, horizontal and stacked | docs |
| E7-24 | Add Sparkline with View-bar default and line variant | docs |
| E7-25 | Add LineChart and AreaChart via optional react-native-svg | a11y, docs |
| E7-26 | Add DonutChart and PieChart via optional react-native-svg | a11y, docs |
| E7-27 | Add CircularProgress with pure-View default | docs |
| E7-28 | Add ProgressSteps stepper for multi-step flows | docs (dropped) |
| E7-29 | Add Calendar month grid with range and marked dates | docs (dropped) |
| E7-30 | Add Agenda list grouped by day | a11y, docs |
| E7-31 | Add Markdown renderer for a safe subset without dependencies | docs |
| E7-32 | Add ChatBubble and MessageList with inverted virtualization | docs |
| E7-33 | Add NotificationList with grouping, read state and actions | docs |
| E8-04 | Add appearance and color-scheme hooks with theme system-mode bridge | a11y, catalog/example |
| E8-05 | Add accessibility preference hooks: reduced motion, transparency, screen reader, font scale | catalog/example |
| E8-06 | Add app-state hooks: useAppState, useOnForeground, useIsAppActive | a11y, catalog/example |
| E8-07 | Add network status adapter and useNetworkStatus hook | catalog/example |
| E8-08 | Add orientation and window metrics hooks | a11y, catalog/example |
| E8-09 | Add device info and platform helpers with Expo Go detection | a11y, catalog/example |
| E8-10 | Add keyboard hooks and keyboard-avoiding/dismiss-on-tap primitives | catalog/example |
| E8-11 | Add safe-area adapter with RN-core fallback and useInsets hook | a11y, catalog/example |
| E8-12 | Add status bar and system UI sync (useSystemBars) | a11y, catalog/example |
| E8-13 | Add haptics adapter: useHaptics with expo-haptics and Vibration fallback | a11y, catalog/example |
| E8-14 | Add HapticPressable and useHapticPress for haptic-feedback in Pressable | a11y, catalog/example |
| E8-15 | Add clipboard adapter and useCopyToClipboard (expo-clipboard, web, noop) | a11y, catalog/example |
| E8-16 | Add share adapter and useShare (RN Share and web navigator.share) | a11y, catalog/example |
| E8-17 | Add linking helpers: openURL, canOpen, deep-link parsing, router bridge | a11y, catalog/example |
| E8-18 | Add back-handler hook with prioritized layer stack | a11y, catalog/example |
| E8-20 | Add Expo permission adapters: camera, media library, location, notifications | a11y, catalog/example |
| E8-21 | Add image picker/camera adapter, useImagePicker and ImagePickerField | catalog/example |
| E8-22 | Add document picker adapter and DocumentPickerField | a11y, catalog/example |
| E8-23 | Add storage adapters: memory, async-storage, secure-store, web, useStoredState | a11y, catalog/example |
| E8-24 | Add biometric prompt adapter and useBiometricPrompt | a11y, catalog/example |
| E8-25 | Add splash/app-ready gate: AppReadyGate and useAppReady | a11y, catalog/example |
| E8-26 | Add createExpoCapabilities one-line preset (/native/expo) | a11y, catalog/example |
| E10-01 | Unify useBreakpoint: width-based on all platforms, breakpoint tokens, ResponsiveContext | a11y, catalog/example |
| E10-02 | Add useWindowSizeClass and useOrientation | a11y, catalog/example, docs |
| E10-03 | Add responsive value resolver and useResponsiveValue | a11y, catalog/example, docs |
| E10-04 | Add Show, Hide and Responsive components | a11y, catalog/example |
| E10-05 | Add ResponsiveProvider for breakpoint and size class overrides | a11y, catalog/example, docs |
| E10-06 | Add container-aware hooks: useContainerSize and Container | a11y, catalog/example, docs |
| E10-07 | Add safe-area adapter: SafeAreaAdapterProvider, useSafeInsets, ThemeAppShell safeArea prop | a11y, catalog/example (dropped) |
| E10-08 | Add useDeviceClass and foldable posture adapter | a11y, catalog/example, docs |
| E10-09 | Add AdaptiveGrid with breakpoint-driven columns | a11y, catalog/example, docs (dropped) |
| E10-10 | Add SplitView master-detail layout for tablets | catalog/example, docs |
| E10-11 | Add AdaptiveNav: bottom bar on compact, rail/sidebar on larger | catalog/example, docs |
| E10-12 | Add useFontScale and large-text layout switching | a11y, catalog/example |
| E10-13 | Add PageContainer with centered max width and responsive gutters | a11y, catalog/example, docs (dropped) |

Fix: add a shared DoD block to every UI ticket: "named test file; a11y role/label/state asserted (or explicit n/a for pure hooks); `<Name>.catalog.ts` sidecar + manifest entry; docs page under docs/components/<area>/".

## 8. Missing items versus the mission
- Every existing component to demo: **covered**. All 36 dirs in `src/components` are named in E1 tickets; E1-37 flips all 36 to demo; E11-07+E11-16 cover all 36 in the catalog (by family).
- Presets: **covered** (E2-12..E2-19: minimal, premium, saas, consumer, editorial, ecommerce, dashboard, social; registry E2-20; contrast gate E2-11; catalog switcher E11-04; AI manifest E13-16; skill E13-24).
- Skills: **partial** (8 skills E13-22..29 + harness E13-30/31).
- Shim: **covered** (E15-03 build, E15-04/05 parity, E15-06 subpaths, E15-07 compat, E15-08 smoke, E15-15/16 publish; E17-12 rehearsal).

| Gap | Evidence | Proposed ticket(s) |
|---|---|---|
| No catalog stories for ~120 new components (E3-E10) | E11-07/E11-16 cover only the 36 existing components; E6/E7/E8/E10 tickets have no catalog obligation | Add E11 tickets: 'Populate catalog stories: E4 primitives', '...E5 inputs', '...E6 overlays/nav', '...E7 data display', '...E10 responsive' (each depends on the area wiring ticket) or make *.catalog.ts sidecar a DoD item everywhere |
| No wiring/barrel ticket for E6 and E7 | E4-22, E5-29, E2-20, E3-15, E10-14 exist; E6 (34 tickets) and E7 (33) do not touch src/index.ts, docs nav or API snapshot | Add 'Wire E6 exports, API snapshot, docs nav' and 'Wire E7 exports...' at the end of each stream, in the src/index.ts serial chain |
| New components not registered in maturity manifest | E1-01 seeds 36; E1-37 gate covers only those | DoD rule: every new component adds a manifest entry at 'demo'; extend E1-02 checker to fail on unregistered component dirs |
| AI meta only for existing 36 components | E13-06..09 enumerate existing components; E13-05 --strict would fail once E4-E8 land | Generate from sidecars (rescope E13-05) or add E13 meta tickets per new area |
| Skills gap | E13-22..29 lack native capabilities, data display/lists/charts, overlays/feedback, and Texo migration (shim/codemod) | Add skills: texo-native-capabilities, texo-data-display, texo-overlays-feedback, texo-migration |
| Behavior tests only for existing components | E12-02/16/17 cover current families | Per-ticket tests already required in E4/E5 scope; enforce for E6-E8 via coverage matrix E12-14 gate |
| Presets in visual regression | E12-06 screenshots do not mention the 8 presets | Add preset x mode axis to E12-06 (or E12-15 theme-matrix) acceptance |
| Shim coverage for new subpaths/AI files | E15-06 subpath compat; no check that ai/ and skills ship via shim or are explicitly excluded | Add acceptance to E15-03: decision on ai/ artifacts in shim |

## 9. Apply order
1. Apply drops/merges (fold acceptance into targets first). 2. Apply rescopes and filesTouched edits. 3. Add dependency edges. 4. Split L tickets. 5. Add mission-gap tickets (E6/E7 wiring, catalog stories for new components, 4 skills). 6. Re-run the analysis: expected 0 collisions, 0 cycles, 0 L.
