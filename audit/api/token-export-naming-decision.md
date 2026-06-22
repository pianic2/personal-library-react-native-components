# Token Export Naming Decision

## Issue

PLRNUI-16 - Resolve token naming after export matrix

## Scope

This document records the API/export naming decision for token symbols only.

No runtime implementation, alias creation, demo cleanup or consumer docs cleanup is performed by this issue.

## Sources Reviewed

- `audit/api/export-matrix.md`
- `audit/api/root-api-proposal.md`
- `audit/api/subpath-exports.md`
- `audit/api/public-types.md`
- `audit/api/deep-import-audit.md`
- `audit/migration/legacy-naming-map.md`
- `audit/migration/breaking-change-register.md`
- `audit/migration/migration-changelog.md`
- `audit/theme/token-mapping-matrix.md`
- `audit/theme/theme-token-verification.md`
- `audit/theme/theme-provider-responsibility.md`
- `audit/theme/hardcoded-values-register.md`
- `audit/theme/light-dark-mode-verification.md`
- `audit/docs/stability-labeling-audit.md`
- `audit/docs/docs-update-inventory.md`
- `audit/docs/plrnui-9-readiness-report.md`

All expected source audit files were found and read. Runtime source paths referenced by prior audits, such as `tokens/snapshot.ts`, `tokens/index.ts`, `theme/types.ts`, `themes/liquidglass/*`, `docs/**` and `demo/**`, are not present at the repository root in this checkout. Current runtime inspection found only `src/index.ts`, which does not export token symbols.

## Repository Evidence

- `auraTokens`: `audit/api/export-matrix.md` classifies it as a root token export from `tokens/snapshot.ts` with deprecated/deprecated status because legacy AURA naming conflicts with the recommended package identity. `audit/theme/token-mapping-matrix.md`, `audit/theme/theme-token-verification.md`, `audit/docs/stability-labeling-audit.md`, `audit/docs/docs-update-inventory.md` and `audit/docs/plrnui-9-readiness-report.md` also identify it as legacy/deprecated or still documented in token docs. Current checkout source inspection did not find a live `auraTokens` export under `src/`.
- `getAuraTokens`: `audit/api/export-matrix.md` classifies it as a root utility export from `tokens/snapshot.ts` with deprecated/deprecated status. `audit/theme/light-dark-mode-verification.md` records accessor behavior for dark snapshots, but notes the public name is AURA legacy. Docs/demo audits report it as still documented or used in demo evidence. Current checkout source inspection did not find a live `getAuraTokens` export under `src/`.
- `themeTokens`: no existing repository or audit evidence found for a current implementation. It is selected by PLRNUI-16 as the neutral canonical target name for the future stable token snapshot export.
- `getThemeTokens`: no existing repository or audit evidence found for a current implementation. It is allowed only as a conditional target if PLRNUI-29 or later implementation evidence shows a function accessor remains necessary, for example to select by mode.
- Other token-related exports: `TokenPair` and `TokensSnapshot` are classified public/beta in `audit/api/export-matrix.md` and `audit/api/public-types.md`. `TokenStorage` is classified internal. `GlassMaterialTokens` and `liquidglass*` token/theme-pack exports are classified experimental. The proposed `tokens` subpath exists only as a package export proposal in `audit/api/subpath-exports.md`; no current subpath export is implemented.

## Token Export Classification

| Symbol | Current location | Evidence | Current role | Proposed classification | Target name | Root API decision | Migration impact |
|---|---|---|---|---|---|---|---|
| `auraTokens` | Audit-reported root export from `tokens/snapshot.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/theme/token-mapping-matrix.md`; `audit/theme/theme-token-verification.md`; docs audits | Token snapshot value with AURA legacy naming | deprecated / removed from future API contract | `themeTokens` | Not allowed. No compatibility alias. No future root export. | Consumers must migrate; removal is intentional breaking cleanup if previously exposed. |
| `getAuraTokens` | Audit-reported root export from `tokens/snapshot.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/theme/light-dark-mode-verification.md`; `audit/theme/theme-token-verification.md`; docs audits | Function accessor for token snapshot by mode with AURA legacy naming | deprecated / removed from future API contract | `getThemeTokens`, only if accessor semantics are required | Not allowed. No compatibility alias. No future root export. | Consumers must migrate; removal is intentional breaking cleanup if previously exposed. |
| `themeTokens` | Not currently implemented | PLRNUI-16 decision; prior audits leave neutral replacement unresolved | Future canonical token snapshot value | replacement target | `themeTokens` | Allowed as future stable root token export after implementation and verification | Non-breaking as additive; replaces legacy AURA names in migration docs |
| `getThemeTokens` | Not currently implemented | PLRNUI-16 decision; `getAuraTokens(mode)` behavior is audit-reported but not present in current source checkout | Future optional accessor if mode/function semantics remain necessary | replacement target | `getThemeTokens` | Allowed only if implementation evidence shows accessor semantics are required | Non-breaking as additive; replacement for `getAuraTokens` if needed |
| `tokens` | No current root symbol found; proposed only as package subpath concept | `audit/api/subpath-exports.md`; grep evidence | Generic subpath/category term, not a specific root symbol | unknown / needs owner decision | Avoid as root symbol | Not allowed as generic root export name in PLRNUI-16 decision | Avoids future collision with spacing, typography, semantic tokens, runtime tokens or design-system token families |
| `TokenPair` | Audit-reported root type from `tokens/types.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/api/public-types.md` | Token helper type | public | `TokenPair` | Allowed if token types remain part of public API | No naming migration impact from PLRNUI-16 |
| `TokensSnapshot` | Audit-reported root type from `tokens/snapshot.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/api/public-types.md`; `audit/theme/token-mapping-matrix.md` | Token snapshot type with neutral name | public | `TokensSnapshot` | Allowed if token types remain part of public API | No AURA naming migration impact |
| `TokenStorage` | Audit-reported root type from `storage/tokenStorage.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/api/public-types.md` | Storage implementation type | internal | None | Not allowed in future stable root API | Removal from root may be breaking if consumers used it; belongs to API governance, not token naming |
| `GlassMaterialTokens` | Audit-reported root type from `theme/types.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/api/public-types.md` | Liquid/glass theme material type | experimental | None decided by PLRNUI-16 | Not allowed in stable root API without experimental/theme-pack decision | No AURA naming migration impact; remains experimental |
| `liquidglassLightColors` | Audit-reported root export from `themes/liquidglass/tokens/colors.base.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/theme/token-mapping-matrix.md` | Theme-pack token export | experimental | None decided by PLRNUI-16 | Not allowed in stable root API as core token export | Theme-pack API decision remains separate |
| `liquidglassDarkColors` | Audit-reported root export from `themes/liquidglass/tokens/colors.base.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/theme/token-mapping-matrix.md` | Theme-pack token export | experimental | None decided by PLRNUI-16 | Not allowed in stable root API as core token export | Theme-pack API decision remains separate |
| `resolveLiquidglassColors` | Audit-reported root export from `themes/liquidglass/tokens/colors.base.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/theme/token-mapping-matrix.md` | Theme-pack token resolver | experimental | None decided by PLRNUI-16 | Not allowed in stable root API as core token export | Theme-pack API decision remains separate |
| `liquidglassGlassTokens` | Audit-reported root export from `themes/liquidglass/tokens/glass.ts`; not found in current `src/` checkout | `audit/api/export-matrix.md`; `audit/theme/token-mapping-matrix.md` | Theme-pack token export | experimental | None decided by PLRNUI-16 | Not allowed in stable root API as core token export | Theme-pack API decision remains separate |

## Decision

AURA-branded token symbols are deprecated legacy names and are removed from the future API contract.

Canonical target:

- `themeTokens`

Conditional target:

- `getThemeTokens`, only if a function accessor remains necessary.

Removed/deprecated legacy names:

- `auraTokens`
- `getAuraTokens`

No compatibility aliases will be introduced for AURA-branded token names.

## Root API Decision

Allowed in the future stable root API:

- `themeTokens`, as the canonical public token snapshot export after implementation and verification.
- `getThemeTokens`, only if an accessor is still necessary.
- `TokensSnapshot` and `TokenPair`, if public token typing remains approved.

Not allowed in the future stable root API:

- `auraTokens`
- `getAuraTokens`
- `tokens` as a generic root export name.
- `TokenStorage`.
- Experimental theme-pack token exports such as `GlassMaterialTokens`, `liquidglassLightColors`, `liquidglassDarkColors`, `resolveLiquidglassColors` and `liquidglassGlassTokens`.

AURA-branded token exports must not be reintroduced as compatibility aliases.

## Migration Impact

Consumers using legacy AURA-branded token exports must migrate to neutral theme-oriented names.

Migration target:

- `auraTokens` -> `themeTokens`
- `getAuraTokens` -> `getThemeTokens`, only if accessor semantics are required

No AURA compatibility aliases will be added.

If legacy root exports existed in previous package states, their removal is an intentional breaking cleanup and must be tracked in the breaking-change register.

## Boundary With Related Issues

- PLRNUI-29 owns technical cleanup, residual reference removal, deprecation tracking and breaking-change registration.
- PLRNUI-29 does not own a decision to keep AURA compatibility aliases, because PLRNUI-16 explicitly rejects them.
- PLRNUI-53 owns consumer-facing docs/policy and must ensure AURA token names are not presented as stable API.

## Open Questions

- Whether an accessor remains necessary after the token implementation is revisited. If mode-specific snapshot lookup remains part of the API contract, `getThemeTokens` is the approved target; otherwise only `themeTokens` should be used.
- Whether residual references to AURA token names exist in docs/demo/audit-derived examples and need cleanup under PLRNUI-29 or PLRNUI-53.
- Whether public token types remain root exports or move to a `tokens` subpath. This is broader root/subpath API governance and not resolved by PLRNUI-16.

## Verdict

PLRNUI-16 can be considered complete as an API/export naming decision.

AURA-branded token names are deprecated legacy names and are removed from the future API contract.

The canonical target is `themeTokens`.

`getThemeTokens` is allowed only if accessor semantics remain necessary.

No AURA compatibility aliases will be introduced.

Implementation cleanup, residual reference removal and breaking-change tracking are deferred to PLRNUI-29.

Consumer-facing documentation policy is deferred to PLRNUI-53.
