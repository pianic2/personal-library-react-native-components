# PLRNUI-26 - Internal and Experimental Export Fencing

## Objective

Fence internal helpers and reconcile experimental/public-candidate root API documentation before stable release.

PLRNUI-26 keeps the package root as an explicit named export surface. It does not add `/experimental` or `/internal` entrypoints, does not introduce root `export *`, does not change package metadata and does not promote any component to `stable`.

## Baseline

- Path: `/home/optimus/Documenti/GitHub/personal-library-react-native-components`
- Branch: `main`
- Initial `git status --short`: clean
- Node: `v20.19.2`
- npm: `9.2.0`
- Engine note: `package.json` requires `node >=22`; the local validation environment is below that engine target.

## Root API Findings

- `src/index.ts` used explicit named root exports and no root `export *`.
- Experimental overlays were already explicit root runtime exports: `BottomSheet`, `Modal`, `Popover`, `Select`, `Tooltip`.
- Navigation/app-shell APIs were explicit root exports: `BottomBar`, `SideBar`, `TopBar`, `NavBar`, `Link`, `NavProvider`, `useNav`, `useNavigate`.
- Local broad barrels exist in `src/utils/index.ts`, `src/theme/index.ts` and `src/hooks/index.ts`, but root does not re-export those barrels with `export *`.
- Internal helpers `cn` and `useIsMounted` were root-exported before PLRNUI-26 and are now fenced out of the root API.

## Decisions

| Symbol | Previous state | PLRNUI-26 decision | Root API result | Notes |
|---|---|---|---|---|
| Stack | root-exported/docs internal | public candidate layout primitive | remains root-exported | docs reconciled |
| useNavigate | root-exported/docs internal | experimental navigation hook | remains root-exported | not stable |
| useIsMounted | root-exported/internal helper | internal helper | removed from root | not consumer-facing |
| cn | root-exported/internal helper | internal helper | removed from root | not consumer-facing |
| getAuraTokens | formerly root-exported legacy | deprecated/removed by PLRNUI-29 | removed from root | PLRNUI-53 forbids consumer examples and aliases |
| BottomSheet/Modal/Popover/Select/Tooltip | experimental overlays | explicit experimental root exports | remain root-exported | no broad export |
| BottomBar/SideBar/navigation shell | experimental app-shell | explicit experimental root exports | remain root-exported | no stable promotion |

## Files Updated

- `src/index.ts`
- `tests/components/component-smoke.test.tsx`
- `audit/api/export-matrix.md`
- `audit/api/root-api-proposal.md`
- `audit/api/public-types.md`
- `audit/components/component-maturity-matrix.md`
- `audit/components/component-blockers.md`
- `audit/components/stable-promotion-requirements.md`
- `audit/migration/breaking-change-register.md`
- `audit/migration/migration-changelog.md`
- `audit/release/release-readiness-report.md`
- `audit/api/internal-experimental-export-fencing-plrnui-26.md`

## Acceptance Criteria Coverage

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| No internal component/helper is exposed as stable/public by mistake | PASS | `cn` and `useIsMounted` removed from root; no component promoted to `stable`. |
| Experimental components are fenced or clearly documented | PASS | Overlay and app-shell exports remain explicit and documented as experimental/pre-stable. |
| Root API proposal updated | PASS | PLRNUI-26 section records explicit named root surface and excluded helpers. |
| Breaking-change register updated | PASS | PLRNUI-26 register section records pre-stable root helper removals and future deprecation risk. |
| Migration notes present for moves/removals | PASS | Migration changelog records internal helper fencing and consumer guidance. |

## Validation Results

- `npm test`: exit 0.
- `npm run typecheck`: exit 0.

## Remaining Risks

- Global release readiness remains `NOT READY` until clean consumer, resolver and native runtime evidence are regenerated.
- Experimental root exports remain root-exposed until a future package entrypoint, removal or stable API decision is approved.
- `getAuraTokens` was later removed by PLRNUI-29; PLRNUI-53 confirms it is legacy/deprecated, not stable public API, forbidden in consumer examples and not reintroduced as an alias.
- Local Node is `v20.19.2`, below the package `engines.node >=22` target.
