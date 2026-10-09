# E14-E17: Package architecture, Texo cutover, docs/OSS, release engineering

Scope audited: package.json, tsconfig*, scripts/*, .github/workflows/ci.yml, config/compatibility.json, audit/adr/*, audit/api/*, docs/migration.md, README, CONTRIBUTING, CODEOWNERS, LICENSE, mkdocs.yml, src/index.ts, tests/.
Tickets: `tickets/E14.json` (11), `E15.json` (16), `E16.json` (10), `E17.json` (13). Ticket type is "Task" per schema; human-only decisions carry labels `decision`, `human-only`, `blocked-decision`.

## 1. Findings (evidence)

| # | Finding | Evidence | Ticket |
|---|---|---|---|
| F1 | Only `"."` and `./package.json` exported; conditions are `types` + `import` only (no `default`, no `react-native`), so CJS/jest and non-bundler resolvers fail | package.json `exports` | E14-02 |
| F2 | No `sideEffects` field; Metro does not tree-shake by default, so the root barrel (src/index.ts, ~95 names) pulls everything; subpaths are the only reliable pruning in Metro | package.json, src/index.ts | E14-02/05/06 |
| F3 | Relative imports are extensionless (src/components/Button/index.ts `./Button`) with `moduleResolution: bundler`; emitted dist is not valid strict Node ESM (inferred, dist not built here) | tsconfig.json, tsconfig.build.json | E14-03 |
| F4 | Package name hardcoded in package.json, scripts/release-guard.mjs, consumer-smoke.mjs, expo-consumer-smoke.mjs, `PACKAGE_NAME` exported from src/index.ts, docs, README | grep | E14-07, E15-14 |
| F5 | `PACKAGE_NAME` is a public runtime export whose value is the legacy name; shim must decide what it returns | src/index.ts:1 | E15-02 (decision) |
| F6 | API snapshot is a regex over src/index.ts: blind to `export *`, prop shapes and per-subpath surfaces | scripts/public-api-snapshot.mjs | E14-11 |
| F7 | release-guard only allows `X.Y.Z-rc.N` + tag `rc`, forbids runtime deps, hardcodes name/repo/peers; cannot validate 1.0.0 or shim | scripts/release-guard.mjs | E17-03 |
| F8 | No release workflow, provenance, trusted publishing, changesets or CHANGELOG; publish is manual (PLRNUI-63 docs) | .github/workflows (ci.yml only) | E17-01/02/04/09 |
| F9 | CI: single ubuntu job, Node 24 only (engines >=22.13.0 untested), runs on every push and PR, no concurrency, actions not SHA-pinned | ci.yml | E17-05 |
| F10 | Support matrix: one validated consumer (Expo 57.0.21/RN 0.86.3/React 19.2.3, Expo Go Android); peers RN `>=0.86.0 <0.87.0`; iOS/dev client/EAS residual | config/compatibility.json, README | E17-06 |
| F11 | Consumer smokes cover the single package only; no shim mode | scripts/consumer-smoke.mjs, expo-consumer-smoke.mjs | E15-08 |
| F12 | CODEOWNERS `* @optimus` placeholder; mkdocs repo_url `niccolo/...` vs package repo `pianic2/...`; CONTRIBUTING is Jira-ticket-internal; docs/getting-started.md mixes Italian; ADR 0001 naming "Proposto", npm name "da definire"; stable count is zero | CODEOWNERS, mkdocs.yml, CONTRIBUTING.md, ADR 0001 | E16-* |
| F13 | audit/api/subpath-exports.md is an unreviewed proposal (all rows HUMAN REVIEW REQUIRED); lacks native/meta; assumes legacy AURA subpath rejected | audit/api/subpath-exports.md | E14-01 |
| F14 | No SECURITY/CoC/SUPPORT/PR template; no dependabot/SBOM | repo root, .github | E16-03/05, E17-10 |

## 2. Recommended architecture

Principle: ONE codebase = the Texo package (this repo's `src/`). The legacy name is a GENERATED, code-free re-export artifact, never a second source tree.

```
repo (single source of truth)
  src/ ──tsc──> dist/                      -> npm: <TEXO>            (1.0.0, dist-tag rc -> latest)
  config/exports.json  (subpath contract)
      ├─ generate-exports.mjs -> package.json "exports"/typesVersions/sideEffects
      └─ build-shim.mjs      -> dist-shim/ (gitignored, generated, no src)
                                  index.js   : export * from "<TEXO>"
                                  theme.js   : export * from "<TEXO>/theme"   (one per subpath)
                                  package.json: name=<LEGACY>, version=lockstep,
                                                dependencies:{ "<TEXO>": "<exact>" }, no scripts
                                  -> npm: @personal-library/react-native-components (shim, 1.x)
  config/package-identity.json (names live ONLY here; today: current name, shim disabled)

consumer app -> import {Button} from "<LEGACY>" -> shim -> <TEXO> (single copy of react/RN/Texo via peers)
```

Why no workspaces: a generated `dist-shim/` published with `npm publish ./dist-shim` needs no second package.json in git and no package.json edits. Revisit workspaces only if separate packages (CLI, codemod, `@texo/*`) are adopted (decision, section 5).

### Subpath exports (proposal, to ratify in ADR 0009)
| Subpath | Content | Notes |
|---|---|---|
| `.` | Curated common API (components, ThemeProvider/useTheme, hooks, tokens) | stays smaller than all-subpaths union |
| `./theme` `./tokens` `./hooks` `./utils` | existing src/theme, src/tokens, src/hooks, src/utils | cheap: directories already exist; Metro-friendly pruning |
| `./navigation`, `./experimental` | NavProvider/NavBar... ; Modal/BottomSheet/Popover/Tooltip/Select | experimental isolates instability (ADR 0003) |
| `./components/*` | only as generated allow-list, or omit | decision in ADR 0009; per-component subpaths are the strongest Metro pruning but each is semver surface |
| `./native` | E8 device capabilities | only place optional expo-* peers may be imported (E14-09) |
| `./meta` | JSON/ESM manifest for AI layer (E13), no react-native import | Node-consumable |
| `./package.json` | keep | |
Forbidden: `src/*`, `dist/*`, `internal` (ADR 0002/0006).

### Module format / tree-shaking / Metro
- Conditions order: `types`, `react-native`, `import`, `default`. Metro (RN 0.86) honors `exports`; Expo SDK 57 default is package exports on.
- ESM-first. Dual CJS is risky: ThemeProvider/NavProvider contexts would duplicate if both formats load (dual-package hazard). Decide via spike E14-04 (jest-expo needs transformIgnorePatterns if ESM-only).
- `sideEffects:false` only after E14-06 proves it; set via generator, not by hand.
- Emit valid Node ESM (E14-03) before any shim work; shim files are trivial `export *` and need that.
- Types: per-subpath `.d.ts` plus `typesVersions` for node10 resolution; `export *` preserves types, Texo must have no default exports.

### Shim dependency strategy
Shim declares exactly one dependency (`<TEXO>` exact version) and no peers; Texo's own peers (react, react-native) are satisfied by the app root (npm 7+ installs/validates peers via the dependency). No postinstall, no runtime warning; deprecation via `npm deprecate` and README. Exact pin means every Texo release triggers a shim republish (automated in the lockstep Changesets group, E17-01/02).

## 3. Shim strategy options

| Option | Single codebase | Consumer effort | Type/subpath parity | Risk | Verdict |
|---|---|---|---|---|---|
| A. Generated shim in same repo, deps on Texo exact, published lockstep | yes | zero (then codemod) | Enforced by generator + parity tests | Needs automation for lockstep | **Recommended** |
| B. Hand-written second package/workspace re-exporting | mostly | zero | manual, drifts | subpath drift | Reject |
| C. Shim bundles copy of dist | no (duplicate code, two contexts) | zero | trivially same | duplicate React contexts, size | Reject |
| D. No shim, deprecate old name, codemod only | yes | high, breaking | n/a | breaks all existing consumers; contradicts brief | Reject |
| E. npm alias in consumers (`"old": "npm:<TEXO>"`) | yes | low but manual | types identical | module paths/Metro and docs confusion; not a publish strategy | Document as fallback in migration guide only |
| F. Monorepo workspaces `packages/texo` + `packages/legacy` | yes | zero | enforced by tests | repo restructure + moves all history/paths now | Defer unless more packages arrive |

## 4. Gates (tests) for the shim
1. Export parity (E15-04): namespace keys equal per subpath, both directions, mutation-tested.
2. Type parity (E15-05): `Expect<Equal>` over every value and Props type, negative fixture.
3. Subpath compat (E15-06 + E14-10): resolver matrix Node / TS bundler / TS node16 / Metro; exports key set equality.
4. Compat suite (E15-07): component, theme, a11y tests through shim loader.
5. Real consumers (E15-08): `consumer:smoke` and `consumer:expo` with `--via-shim`, single copy of react/RN/Texo in `npm ls`.
6. Preparatory strategy: all run now against a tarball alias of the CURRENT package standing in for Texo, so the mechanism is proven without renaming.

## 5. Cutover sequence (E15-15 runbook, E17-12 rehearsal)
1 publish Texo `1.0.0-rc.N` tag rc -> 2 publish shim rc (exact dep) -> 3 shim-mode regression -> 4 promote Texo `latest` (E17-04, integrity-checked) -> 5 publish shim `1.0.0` latest -> 6 `npm deprecate "<LEGACY>@<1.0.0" "Moved to <TEXO>: <migration URL>"` (0.x/rc only; never deprecate the shim yet) -> 7 codemod + guide announced -> 8 after sunset, deprecate shim. Never unpublish; rollback via dist-tag/deprecate (E17-13). First publish of a new name cannot use trusted publishing; bootstrap is a human step.

## 6. Release engineering recommendations
- Changesets in pre mode (`rc`), fixed group target+shim; `1.0.0-rc.0` from `0.1.0-rc.2`; GA via `changeset pre exit`.
- Publish with OIDC trusted publishing + `--provenance` from GitHub Environment with required reviewer; no NPM_TOKEN.
- Semver policy: public API = subpaths in config/exports.json, props, tokens, a11y behavior; breaking = removed export, narrowed prop type, token rename, tightened peer range, raised Node/Expo floor; experimental/beta exempt per stability label; deprecation = `@deprecated` + docs + at least one minor and (proposed) 6 months before removal in a major. 1.0.0 requires a non-empty listed stable set (today zero), committed per-subpath API snapshots and a verified support matrix.
- Support matrix: tiers (supported / best-effort / unsupported) with evidence per entry; widen RN peer range only with verified entries; CI matrix generated from config (Node 22.13 + 24, Expo SDKs, consumer modes).

## 7. Human-only decisions (not decided here)
1. Final name/scope/repo/npm availability (E15-01, ticket label `blocked-decision`) -- BLOCKER for E15-10, E15-13, E15-14, E15-16.
2. Shim policy: version scheme (lockstep vs separate), exact pin, sunset window, runtime warning yes/no, `PACKAGE_NAME` value (E15-02).
3. Whether Texo 1.0.0 continues the old line or is a new package line; the 0.1.0-rc.2 -> 1.0.0-rc.0 jump.
4. Module format (ESM-only vs dual) after spike E14-04; per-component subpaths yes/no; navigation/experimental split (ADR 0009).
5. Codemod channel: standalone npx vs `texo migrate` (E15-11, tied to E13 CLI).
6. Deprecation windows in months; support matrix breadth for 1.0.0 (currently Expo 57 only).
7. License holder/NOTICE for Texo, SECURITY contact, CODEOWNERS handles, GitHub repo owner (pianic2 vs niccolo), npm org/2FA/trusted publisher setup.
8. Public/private fate of audit/ and ADR language (E16-10).

## 8. Ticket map
- E14 (package architecture): 01 subpath contract, 02 exports generator (owns package.json), 03 ESM emit, 04 module-format spike, 05 size harness, 06 side-effect audit, 07 identity config, 08 dev-link, 09 peer policy, 10 resolution matrix, 11 API snapshot rewrite. All executable now.
- E15 (cutover): executable now: 03 shim generator, 04-08 parity/compat/regression, 09 codemod engine, 11 migrate evaluation, 12 guide draft, 15 runbook. Human decision: 01, 02. `blocked-decision`: 10, 13, 14, 16.
- E16 (docs/OSS): 01-10, none blocked except human inputs (01 owner handles, 03 contact).
- E17 (release): 01-13, all executable now with placeholder names; real publish is E15-16.
- Shared file note: package.json is touched by E14-02, E17-01, E15-14; serialized by dependencies (E15-14 depends on both).
