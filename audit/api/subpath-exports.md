# PLRNUI-4 - Subpath Exports Proposal

No `package.json` changes were made. Current package exports expose only `"."`.

## Proposed subpaths

| Subpath | Purpose | Proposed status | Allowed symbols | Notes | Human review |
| --- | --- | --- | --- | --- | --- |
| `@personal-library/react-native-components` | Small stable root API for common consumer imports. | public | Approved public components, providers, hooks, tokens and props types from `root-api-proposal.md`. | Should remain intentional and smaller than current `index.ts`. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/components` | Public UI components grouped by component API. | public | `Button`, layout, typography, stable/beta feedback, form, surface and navigation components plus their props types. | May include more than root, but should still exclude broken/internal modules. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/theme` | Theme provider, hook and theme contracts. | public | `ThemeProvider`, `useTheme`, `Theme`, `ThemeMode`, `createTheme`. | Exclude storage persistence unless explicitly approved. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/tokens` | Token snapshots and token types. | public | `TokensSnapshot`, `TokenPair`; future neutral token names. | Legacy `auraTokens` / `getAuraTokens` need deprecation or alias policy. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/hooks` | Consumer hooks that are not root-critical. | public | `useBreakpoint`, `Breakpoint`, optional `useDebounce`, `useToggle`. | Exclude implementation helpers like `useIsMounted` unless approved. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/navigation` | Navigation provider, components and supported navigation hooks. | experimental | `NavProvider`, `NavItem`, `useNav`, `Link`, `NavBar`, selected props types. | Useful if navigation is considered optional module. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/experimental` | Opt-in unstable components and theme packs. | experimental | `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `ToastProvider`, `useToast`, `Select`, `Hero`, `Page`, `Code`, `liquidglass*`. | Makes instability explicit and avoids root stable confusion. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/legacy` | Temporary compatibility exports for AURA naming. | deprecated | `auraTokens`, `getAuraTokens`, possible legacy aliases. | Only if migration strategy chooses compatibility over immediate removal. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/internal` | Internal implementation access. | internal | None recommended. | Should not be exposed; publishing it makes refactors breaking. | HUMAN REVIEW REQUIRED |
| `@personal-library/react-native-components/src/*` | Direct source access. | internal | None. | Should not be exposed; conflicts with ADR 0002 and ADR 0006. |  |
| `@personal-library/react-native-components/dist/*` | Direct build output access. | internal | None. | Should not be documented; consumers should use package exports. |  |

## Explicit non-exposure recommendation

Do not expose:

```txt
@personal-library/react-native-components/internal
@personal-library/react-native-components/src/*
@personal-library/react-native-components/dist/*
```

Rationale: ADR 0002 says deep imports from internal folders are not part of the contract, and ADR 0006 requires controlled package entrypoints that match generated artifacts.

## Human review required

- Decide whether experimental APIs use one `experimental` subpath or area-specific experimental subpaths.
- Decide whether legacy AURA names get a temporary `legacy` subpath.
- Decide whether navigation is core root API or optional `navigation` subpath API.
- Decide whether utilities get a public subpath or remain internal.
