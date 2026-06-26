# PLRNUI-9 - Docs Update Inventory

## Scopo

Inventariare i path docs/demo/preview da aggiornare in una fase successiva. Questo file non applica modifiche ai documenti reali.

## PLRNUI-49 update

PLRNUI-49 applies visible stability labels to the current README/docs/examples
surface without promoting anything to stable.

- Current stable count remains `0`.
- Current component/API pages are labeled `beta`, `experimental` or
  `internal / non-stable`.
- `docs/getting-started.md` and `docs/migration.md` now include the shared
  stability-label taxonomy and call out beta/experimental/internal boundaries
  where their examples mention public surfaces.
- Internal pages are not removed; they are clearly marked as not part of the
  public consumer API.
- Legacy token names `auraTokens` and `getAuraTokens` remain absent from
  README/docs consumer examples; audit historical references are preserved.

## PLRNUI-50 update

PLRNUI-50 separates current copy-pasteable consumer examples from historical
repo-local demo/preview harness evidence.

- Current `examples/*.tsx` files import only from
  `@personal-library/react-native-components`.
- Current consumer examples no longer use internal/non-stable preview coverage
  components (`Card`, `CodeInline`, `ProgressBar`, `PasswordInput`,
  `Textarea`).
- `README.md` and `docs/migration.md` now state that consumer examples must use
  public package entrypoints and must not use repo-relative package paths,
  `src/*`, `dist/*` or non-public subpaths.
- No current `demo/` or `preview-web/` directories exist in this checkout.
  Historical rows below remain audit evidence only.
- Demo/preview harness success is not package validation; packed-artifact
  consumer validation remains owned by release/consumer-smoke gates.

## PLRNUI-54 execution status

PLRNUI-54 closes the PLRNUI-9 docs update inventory as a documentation/audit
container task. It does not replace PLRNUI-48, PLRNUI-49, PLRNUI-50, PLRNUI-51
or PLRNUI-52; it verifies their current outputs and records remaining deferrals.

### P0 closure matrix

| Inventory path/topic | Status | Resolution | Evidence |
| --- | --- | --- | --- |
| `README.md` | closed | Canonical package identity, root package import, stability taxonomy, preview/runtime boundary and troubleshooting links are present. | `README.md` |
| `mkdocs.yml` | closed | Canonical site metadata and navigation include platform support, preview runtime limits and Expo/RN/Metro troubleshooting. | `mkdocs.yml` |
| `docs/index.md` | closed | Canonical project/package identity, root import guidance and stability-label taxonomy are present. | `docs/index.md` |
| `docs/getting-started.md` | closed | Consumer setup uses `@personal-library/react-native-components`, includes stability labels and links troubleshooting/runtime-limit docs. | `docs/getting-started.md` |
| `docs/components/**/*.md` | closed | Current component pages use root package imports where examples are consumer-facing and carry visible beta, experimental or internal/non-stable labels. | `docs/components/**`, `audit/docs/stability-labeling-audit.md` |
| `docs/components/buttons/button.md` | closed | `Button` is labeled beta. | `docs/components/buttons/button.md` |
| `docs/components/layout/box.md`, `column.md`, `row.md` | closed | Layout component pages are labeled beta and avoid stable claims. | `docs/components/layout/*.md` |
| `docs/components/typography/text.md`, `code-inline.md` | closed | `Text` is labeled beta; `CodeInline` is labeled internal/non-stable. Historical `Code` and `Page` rows are not applicable to this checkout because those component docs/source paths are absent. | `docs/components/typography/*.md`, `src/components/` |
| `docs/components/feedback/progress-bar.md` | closed | `ProgressBar` is labeled internal/non-stable. Historical `ToastProvider` and `useToast` rows are not applicable to this checkout because those docs/source paths are absent. | `docs/components/feedback/progress-bar.md`, `src/components/` |
| `docs/components/overlay/modal.md`, `bottom-sheet.md`, `tooltip.md`, `popover.md` | closed | Overlay pages are labeled experimental and keep runtime/platform limitations visible. | `docs/components/overlay/*.md` |
| `docs/components/surfaces/card.md` | closed | `Card` is labeled internal/non-stable. Historical `Hero` row is not applicable to this checkout because the docs/source path is absent. | `docs/components/surfaces/card.md`, `src/components/` |
| `docs/components/form/input.md`, `password-input.md`, `textarea.md`, `select.md` | closed | `Input` is labeled beta; `PasswordInput` and `Textarea` are labeled internal/non-stable; `Select` is labeled experimental. | `docs/components/form/*.md` |
| `docs/components/navigation/nav-context.md`, `nav-bar.md`, `link.md`, `top-bar.md`, `bottom-bar.md`, `side-bar.md` | closed | Navigation docs carry beta or experimental labels and avoid stable claims. | `docs/components/navigation/*.md` |
| `docs/theme.md` | closed | Theme docs use the canonical root package import and beta/internal labels; runtime troubleshooting is covered by the dedicated Expo/RN/Metro page. | `docs/theme.md`, `docs/expo-rn-metro-troubleshooting.md` |
| `docs/theme/theme-storage.md` | not applicable | The historical internal storage helper page is absent. Current storage guidance is adapter-based and consumer-owned through `ThemeStorageAdapter`. | `docs/theme/theme-provider.md`, `docs/getting-started.md` |
| `docs/tokens/index.md` | closed | Legacy `auraTokens` / `getAuraTokens` are not recommended in consumer docs; historical audit references remain marked legacy/deprecated. | `docs/tokens/index.md`, `audit/docs/naming-legacy-audit.md` |
| `docs/utils/cn.md` | closed | `cn` remains documented only as internal/non-stable; the misleading root-package consumer import was removed. | `docs/utils/cn.md` |
| `demo/app/**`, `demo/screens/**` | not applicable | No `demo/` directory exists in the current checkout. Historical rows remain audit evidence only; current consumer examples live under `examples/`. | `examples/*.tsx`, `audit/docs/deep-import-demo-audit.md` |
| `preview-web/vite.config.ts`, `preview-web/shims/**` | not applicable | No `preview-web/` directory exists in the current checkout. Preview shim behavior is documented as browser docs/demo infrastructure only. | `docs/preview-runtime-limits.md`, `audit/docs/preview-shim-audit.md` |

### P1 residual matrix

| Inventory path/topic | Status | Rationale |
| --- | --- | --- |
| P1 component pages (`Divider`, typography variants, `Spinner`, `Alert`, `Badge`, `Checkbox`, `Switch`, `RadioGroup`, `FormField`) | closed by PLRNUI-49 | Pages exist in the current docs and now carry visible beta labels without stable promotion. |
| `docs/theme/theme-provider.md`, `use-theme.md`, `create-theme.md`, `types.md` | closed by PLRNUI-49/PLRNUI-52 | Theme pages use canonical imports and beta labels; runtime and resolver troubleshooting is centralized in `docs/expo-rn-metro-troubleshooting.md`. |
| `docs/tokens/**` | closed by PLRNUI-49/PLRNUI-53 | Token docs carry beta labels and avoid recommending legacy token aliases. |
| `docs/storage/**` | deferred / not applicable | No storage docs directory exists. Current persistence docs intentionally describe only consumer-owned `ThemeStorageAdapter`; separate storage docs should wait for a public storage API decision. |
| `docs/utils/merge-styles.md`, `docs/utils/platform.md` | closed by PLRNUI-49 | Utility pages carry experimental labels and use root package imports for root-exported utilities. |
| `docs/utils/safe-area.md`, `docs/utils/clipboard.md` | deferred / not applicable | No public safe-area or clipboard utility docs exist in this checkout. Native/runtime behavior is covered by preview limits and Expo/RN/Metro troubleshooting until a public API is approved. |
| `themes/liquidglass/README.md` | deferred / out of hard scope | The PLRNUI-54 hard scope covers README/mkdocs, docs root, component docs, token/theme/storage/utils docs, demo app/examples and preview web docs. Theme pack documentation remains outside this closure task. |
| `demo/index.ts`, `preview-web/preview.tsx`, `preview-web/index.html` | not applicable | Demo and preview-web directories are absent in the current checkout; future reintroduction must keep local harness paths clearly separate from consumer examples. |

PLRNUI-54 validation found no current consumer-facing deep imports from
`src/*`, `dist/*`, `preview-web/*`, `shims/*`, component internals or theme
internals in `README.md`, `docs/` or `examples/`. Historical audit references
remain as evidence and are not rewritten as current product docs.

## README/mkdocs

| Path | Motivo | Tipo aggiornamento | Priorita |
| --- | --- | --- | --- |
| `README.md` | Titolo e descrizione usano AURA; import `from "aura"`; API descritta come barrel generico. | naming, import, troubleshooting | P0 |
| `mkdocs.yml` | `site_name`, `site_description` e `repo_url` usano AURA. | naming | P0 |

## Docs root

| Path | Motivo | Tipo aggiornamento | Priorita |
| --- | --- | --- | --- |
| `docs/index.md` | Usa AURA come nome prodotto e import da `"AURA"`. | naming, import | P0 |
| `docs/getting-started.md` | Usa AURA/import legacy; non copre troubleshooting Expo/RN/Metro. | naming, import, troubleshooting | P0 |
| `docs/components.md` | Overview componenti senza legame a maturity/stability. | stability-label | P1 resolved by PLRNUI-49 |

## Component docs

| Path | Motivo | Tipo aggiornamento | Priorita |
| --- | --- | --- | --- |
| `docs/components/**/*.md` | Pagine componente usano import da `"AURA"` e non riportano label sistematiche beta/experimental/internal. | import, stability-label | P0 |
| `docs/components/buttons/button.md` | `Button` e beta PLRNUI-5, ma docs non indicano beta. | stability-label | P0 |
| `docs/components/layout/box.md` | `Box` e beta; manca support/platform matrix esplicita. | stability-label | P0 |
| `docs/components/layout/column.md` | Documenta `Stack`, ma PLRNUI-5 lo tratta come non-root/internal evidence. | stability-label | P0 |
| `docs/components/layout/row.md` | `Row` beta con prop behavior gap. | stability-label | P0 |
| `docs/components/layout/divider.md` | `Divider` beta senza label. | stability-label | P1 |
| `docs/components/typography/p.md` | `P` beta senza label. | stability-label | P1 |
| `docs/components/typography/b.md` | `B` beta senza label. | stability-label | P1 |
| `docs/components/typography/small.md` | `Small` beta senza label. | stability-label | P1 |
| `docs/components/typography/text.md` | `Text` beta senza label e public props naming unresolved. | stability-label | P0 |
| `docs/components/typography/heading.md` | `Heading` beta senza label. | stability-label | P1 |
| `docs/components/typography/text-group.md` | `TextGroup` beta senza label. | stability-label | P1 |
| `docs/components/typography/quote.md` | `Quote` beta senza label. | stability-label | P1 |
| `docs/components/typography/code.md` | `Code` experimental ma documentato come normale componente. | stability-label | P0 |
| `docs/components/typography/code-inline.md` | `CodeInline` internal per bug noto, ma pagina navigabile. | stability-label | P0 |
| `docs/components/typography/page.md` | `Page` experimental app-shell-like, ma pagina normale. | stability-label | P0 |
| `docs/components/feedback/spinner.md` | `Spinner` beta senza label. | stability-label | P1 |
| `docs/components/feedback/alert.md` | `Alert` beta con review contrast/action pending. | stability-label | P1 |
| `docs/components/feedback/progress-bar.md` | `ProgressBar` internal per bug funzionale, ma pagina navigabile. | stability-label | P0 |
| `docs/components/feedback/toast-provider.md` | `ToastProvider` experimental, web-specific behavior. | stability-label | P0 |
| `docs/components/feedback/use-toast.md` | `useToast` experimental, legato a provider experimental. | stability-label | P0 |
| `docs/components/overlay/modal.md` | `Modal` experimental. | stability-label | P0 |
| `docs/components/overlay/bottom-sheet.md` | `BottomSheet` experimental. | stability-label | P0 |
| `docs/components/overlay/tooltip.md` | `Tooltip` experimental; nota web/native presente ma manca label. | stability-label | P0 |
| `docs/components/overlay/popover.md` | `Popover` experimental; nota web/native presente ma manca label. | stability-label | P0 |
| `docs/components/surfaces/badge.md` | `Badge` beta senza label. | stability-label | P1 |
| `docs/components/surfaces/card.md` | `Card` internal per hook bug, ma pagina navigabile. | stability-label | P0 |
| `docs/components/surfaces/hero.md` | `Hero` experimental app-shell-like. | stability-label | P0 |
| `docs/components/form/input.md` | `Input` beta, docs presenti ma no label. | stability-label | P0 |
| `docs/components/form/password-input.md` | `PasswordInput` internal per props `any`/behavior incomplete. | stability-label | P0 |
| `docs/components/form/textarea.md` | `Textarea` internal per props `any`/token bug. | stability-label | P0 |
| `docs/components/form/checkbox.md` | `Checkbox` beta con accessibility gap. | stability-label | P1 |
| `docs/components/form/switch.md` | `Switch` beta con accessibility/animation gap. | stability-label | P1 |
| `docs/components/form/radio-group.md` | `RadioGroup` beta con option type/a11y gap. | stability-label | P1 |
| `docs/components/form/select.md` | `Select` experimental. | stability-label | P0 |
| `docs/components/form/form-field.md` | `FormField` beta con child contract gap. | stability-label | P1 |
| `docs/components/navigation/nav-context.md` | Include helper hooks, vari internal secondo PLRNUI-4. | stability-label, import | P0 |
| `docs/components/navigation/nav-bar.md` | `NavBar` beta con bug/behavior gap. | stability-label | P0 |
| `docs/components/navigation/link.md` | `Link` beta con router/platform gap. | stability-label | P0 |
| `docs/components/navigation/top-bar.md` | `TopBar` experimental. | stability-label | P0 |
| `docs/components/navigation/bottom-bar.md` | `BottomBar` experimental. | stability-label | P0 |
| `docs/components/navigation/side-bar.md` | `SideBar` experimental web/native-null. | stability-label | P0 |

## Token/theme/storage/utils docs

| Path | Motivo | Tipo aggiornamento | Priorita |
| --- | --- | --- | --- |
| `docs/theme.md` | Import legacy; manca troubleshooting provider/native deps. | import, troubleshooting | P0 |
| `docs/theme/theme-provider.md` | Import legacy e safe-area behavior da chiarire. | import, troubleshooting | P1 |
| `docs/theme/theme-storage.md` | `getStoredTheme`/`setStoredTheme` sono internal secondo PLRNUI-4. | stability-label | P0 |
| `docs/theme/use-theme.md` | Import legacy; `useTheme` beta/public. | import, stability-label | P1 |
| `docs/theme/create-theme.md` | Import legacy; `createTheme` beta/public. | import, stability-label | P1 |
| `docs/theme/types.md` | Import legacy; theme types public/beta. | import, stability-label | P1 |
| `docs/tokens/index.md` | Historical inventory: documented `auraTokens`/`getAuraTokens`; PLRNUI-53 now marks them legacy/deprecated, removed, not stable public API and forbidden in consumer examples. | naming, stability-label | P0 resolved for current PLRNUI-53 policy |
| `docs/tokens/**` | Token docs non distinguono public/deprecated/experimental. | stability-label | P1 |
| `docs/storage/**` | Storage e internal/uncertain in PLRNUI-4. | stability-label, missing-docs | P1 |
| `docs/utils/cn.md` | `cn` internal-helper secondo PLRNUI-4. | stability-label | P0 |
| `docs/utils/merge-styles.md` | `mergeStyles` experimental. | stability-label | P1 |
| `docs/utils/platform.md` | platform helpers experimental. | stability-label | P1 |
| `docs/utils/safe-area.md` | safe-area helper experimental. | stability-label | P1 |
| `docs/utils/clipboard.md` | Clipboard path richiede note Expo/native. | troubleshooting | P1 |
| `themes/liquidglass/README.md` | Theme pack experimental e import legacy. | naming, stability-label | P1 |

## Demo app

| Path | Motivo | Tipo aggiornamento | Priorita |
| --- | --- | --- | --- |
| `demo/app/App.tsx` | Import da `../../index`, import internal `../../theme/types`, legacy branding, usa internal/experimental components. | import, stability-label | P0 |
| `demo/app/theme-toggle.tsx` | Import da `../../index`, usa `Card` internal. | import, stability-label | P0 |
| `demo/app/DemoStateMatrix.tsx` | Import da `../../index`, usa `Card` internal. | import, stability-label | P0 |
| `demo/screens/FoundationsScreen.tsx` | Historical inventory: imported from `../../index` and used deprecated/removed `getAuraTokens`; PLRNUI-53 forbids this legacy token name in consumer examples. | import, stability-label | P0 resolved for current PLRNUI-53 policy |
| `demo/screens/ComponentsScreen.tsx` | Import da `../../index`; demo communicates previewability without stability labels. | import, stability-label | P0 |
| `demo/screens/FormsScreen.tsx` | Import da `../../index`; includes beta/experimental/internal form components. | import, stability-label | P0 |
| `demo/screens/FeedbackScreen.tsx` | Import da `../../index`; includes `ProgressBar`, `ToastProvider`, `Tooltip`, `useToast`. | import, stability-label | P0 |
| `demo/screens/LayoutScreen.tsx` | Import da `../../index`; previewa navigation experimental. | import, stability-label | P0 |
| `demo/index.ts` | Exports demo internals, could look reusable. | stability-label | P1 |

## Preview web

| Path | Motivo | Tipo aggiornamento | Priorita |
| --- | --- | --- | --- |
| `preview-web/vite.config.ts` | Alias/shim preview non documentati come tali in docs consumer. | shim-note, troubleshooting | P0 |
| `preview-web/shims/async-storage.ts` | AsyncStorage shim via `localStorage`, not native runtime. | shim-note | P0 |
| `preview-web/shims/expo-clipboard.ts` | Clipboard browser shim, not Expo runtime. | shim-note | P0 |
| `preview-web/shims/react-native-safe-area-context.tsx` | Safe area no-op shim, not device behavior. | shim-note | P0 |
| `preview-web/preview.tsx` | Preview imports demo internals. | shim-note | P1 |
| `preview-web/index.html` | Legacy title `AURA Preview`. | naming | P1 |

PLRNUI-50 status for demo/preview rows: retained as historical audit inventory
because the directories are absent in the current checkout. If a demo/preview
harness is reintroduced, local imports must be documented as demo-only
infrastructure and must not be represented as consumer examples or package
validation.
