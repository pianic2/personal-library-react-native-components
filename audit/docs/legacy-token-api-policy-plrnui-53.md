# PLRNUI-53 - Define legacy deprecated token API policy

## Decision

`auraTokens` and `getAuraTokens` are legacy/deprecated token API names.

They are not stable public API, are not supported consumer-facing token names, and must not be reintroduced as runtime exports or compatibility aliases.

## Consumer-Facing Policy

README, docs, examples and demo/public sample code must not recommend, import, or use `auraTokens` or `getAuraTokens`.

Historical audit, migration and governance references may mention those names only when the surrounding text clearly marks them as legacy, deprecated, removed, not stable, or not current consumer API.

The supported consumer-facing token naming must use the neutral token API established by PLRNUI-29:

- `defaultThemeTokens`
- `createThemeTokens`
- `ThemeTokens`

## Ownership Split

| Ticket | Responsibility |
| --- | --- |
| PLRNUI-16 | API/export naming decision for legacy token names and neutral replacements. |
| PLRNUI-29 | Technical deprecation/removal path: aggressive removal from root/token barrels with no compatibility aliases. |
| PLRNUI-53 | Consumer-facing docs/demo policy: removed legacy token names must not appear as recommended consumer API. |

## Acceptance Criteria Mapping

| Acceptance criterion | Status | Evidence |
| --- | --- | --- |
| `auraTokens` and `getAuraTokens` are documented as legacy/deprecated token API names. | satisfied | This policy and migration governance files mark them legacy/deprecated. |
| They are documented as not stable public API. | satisfied | This policy marks them not stable and not supported consumer-facing token names. |
| README/docs/examples/demo do not recommend or use them. | satisfied | Final grep of `README.md docs examples src tests` is expected to return no matches. |
| Historical audit references remain only with clear legacy/deprecated/removed/not stable context. | satisfied | Updated governance files describe the names as removed, deprecated, not stable, and not allowed as aliases. |
| PLRNUI-16/29/53 ownership is explicit. | satisfied | Ownership split table above. |
| Compatibility aliases are not introduced. | satisfied | Source/runtime API is unchanged by PLRNUI-53; PLRNUI-29 removal policy remains authoritative. |
