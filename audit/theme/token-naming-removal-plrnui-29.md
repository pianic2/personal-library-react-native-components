# PLRNUI-29 - Define token naming deprecation path

## Decision

Snapshot token names are removed from the public API now.

PLRNUI-29 uses aggressive removal: temporary snapshot/AURA token names are not kept as root-level deprecated aliases. The supported public token API is neutral:

- `defaultThemeTokens`
- `createThemeTokens`
- `ThemeTokens`

## Rationale

The package is in API-hardening phase. Keeping temporary snapshot or legacy token names would increase migration debt before the public token API is stabilized.

## Removed Names

| Removed public name | Kind | Replacement | Status |
| --- | --- | --- | --- |
| `auraTokens` | token value | `defaultThemeTokens` | removed now by PLRNUI-29 |
| `getAuraTokens` | token factory/accessor | `createThemeTokens` | removed now by PLRNUI-29 |
| `TokensSnapshot` | public type | `ThemeTokens` | removed now by PLRNUI-29 |

## Replacement Neutral Names

| Neutral public name | Kind | Notes |
| --- | --- | --- |
| `defaultThemeTokens` | token value | Default light theme token object. |
| `createThemeTokens` | token factory/accessor | Returns light or dark theme tokens for the requested mode. |
| `ThemeTokens` | public type | Public token object type for the neutral token API. |

## Compatibility Policy

No root-level deprecated aliases are provided.

The root API and token barrel must not export `auraTokens`, `getAuraTokens` or `TokensSnapshot`. Internal implementation may keep private snapshot terminology, but snapshot names must not leak through `src/index.ts` or `src/tokens/index.ts`.

## Migration Path

Consumers should migrate imports as follows:

```ts
import {
  createThemeTokens,
  defaultThemeTokens,
  type ThemeTokens,
} from "@personal-library/react-native-components";
```

| Before | After |
| --- | --- |
| `auraTokens` | `defaultThemeTokens` |
| `getAuraTokens(mode)` | `createThemeTokens(mode)` |
| `TokensSnapshot` | `ThemeTokens` |

## Breaking-Change Status

Breaking change: yes.

Removal milestone: now, PLRNUI-29.

The breaking change is registered in `audit/migration/breaking-change-register.md`.

## Coordination

PLRNUI-53 owns consumer-facing docs and policy follow-up. PLRNUI-29 owns the technical removal from the public/root token API.
