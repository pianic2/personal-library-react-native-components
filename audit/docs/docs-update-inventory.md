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
