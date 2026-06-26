# PLRNUI-9 - Stability Labeling Audit

## Scopo

Verificare se docs e demo comunicano correttamente la maturity definita da PLRNUI-5 e la classificazione API definita da PLRNUI-4. Questo file registra gap e raccomandazioni senza modificare docs/demo.

## Maturity da PLRNUI-5

| Maturity | Componenti/API | Stato docs/demo |
| --- | --- | --- |
| stable | Nessuno | Non applicabile: PLRNUI-5 classifica `stable = 0`. |
| beta | `Button`, `Box`, `Column`, `Row`, `Divider`, `P`, `B`, `Small`, `Quote`, `Text`, `TextGroup`, `Heading`, `Spinner`, `Alert`, `Badge`, `Input`, `Switch`, `Checkbox`, `RadioGroup`, `FormField`, `NavProvider`, `Link`, `NavBar` | Documentati senza label `beta`; import legacy. |
| experimental | `Code`, `Page`, `ToastProvider`, `useToast`, `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Hero`, `Select`, `TopBar`, `BottomBar`, `SideBar` | Documentati senza label sistematica `experimental`; alcune note platform presenti ma non standardizzate. |
| internal | `CodeInline`, `ProgressBar`, `Card`, `PasswordInput`, `Textarea`, `Stack`/alias interno secondo PLRNUI-5 | Hanno pagine navigabili o citazioni docs/demo senza label `internal`. |
| deprecated non-component | `auraTokens`, `getAuraTokens` | Historical legacy/deprecated token names; PLRNUI-29 removed them and PLRNUI-53 forbids them in consumer examples. |

## Evidenze principali

- `stable = nessuno`: nessun componente puo essere documentato come stable oggi.
- I componenti beta sono documentati senza label `beta`.
- I componenti experimental sono documentati senza label `experimental`.
- I componenti internal hanno pagine navigabili in MkDocs o sono usati dalla demo.
- `auraTokens` e `getAuraTokens` are legacy/deprecated token names; PLRNUI-29 removed them and PLRNUI-53 confirms they are not stable public API and forbidden in consumer examples.

## Demo false-stability

| File | API/componenti coinvolti | Maturity | Rischio | Raccomandazione |
| --- | --- | --- | --- | --- |
| `demo/app/App.tsx` | `Card`, `Page`, `ToastProvider`, `liquidglassTheme` | internal/experimental | Demo shell comunica uso normale di API non stable. | Etichettare demo come preview harness e mostrare maturity. |
| `demo/app/App.tsx` | `ThemeProvider`, `Button`, `Column`, `Heading`, `Row`, `Small`, `Text` | beta | Demo non distingue beta da stable. | Aggiungere legenda maturity nella demo docs/artifact. |
| `demo/app/theme-toggle.tsx` | `Card` | internal | Usa componente internal come container principale. | Registrare gap finche `Card` non e stabilizzato o sostituito. |
| `demo/app/DemoStateMatrix.tsx` | `Card` | internal | Stato-matrix basata su API internal. | Registrare come demo-only helper, non consumer example. |
| `demo/screens/FoundationsScreen.tsx` | `getAuraTokens` | deprecated non-component | Historical deprecated/removed token was used as preview source of truth. | PLRNUI-53 forbids this legacy token name in consumer examples. |
| `demo/screens/FoundationsScreen.tsx` | `Code`, `CodeInline`, `Card` | experimental/internal | Preview mostra API non stable senza label. | Etichettare maturity e limiti. |
| `demo/screens/FeedbackScreen.tsx` | `ProgressBar` | internal | Componente con bug funzionale mostrato come normale. | Marcare internal/blocker. |
| `demo/screens/FeedbackScreen.tsx` | `ToastProvider`, `useToast`, `Tooltip` | experimental | Feature experimental mostrate senza warning. | Marcare experimental e platform limits. |
| `demo/screens/LayoutScreen.tsx` | `SideBar`, `TopBar`, `BottomBar` | experimental | Navigation experimental mostrata come normale demo. | Aggiungere label experimental e note native/web. |
| `demo/screens/FormsScreen.tsx` | `Select` | experimental | Select non stable mostrato come normale. | Marcare experimental. |
| `demo/screens/FormsScreen.tsx` | `PasswordInput`, `Textarea` | internal | Internal form components possono sembrare consumer API. | Marcare internal o rimuovere dai consumer examples futuri. |
| `demo/screens/ComponentsScreen.tsx` | componenti vari beta/internal/experimental | mixed | Previewability puo essere confusa con readiness. | Separare demo visuale da API readiness. |

## Sintesi gap

- PLRNUI-49 aggiunge una tassonomia visibile di maturity in README/docs e
  label per le pagine component/API correnti.
- PLRNUI-49 mantiene le pagine internal navigabili ma le marca
  `internal / non-stable — not part of the public consumer API`.
- PLRNUI-49 marca le pagine experimental con warning uniforme.
- PLRNUI-49 marca i componenti/API beta come beta.
- La demo comunica disponibilita visiva, non stato API.

## PLRNUI-49 application notes

- Nessun componente/API e stato promosso a `stable`; la label `stable` resta
  esplicitamente vuota.
- `CodeInline`, `ProgressBar`, `Card`, `PasswordInput`, `Textarea`, `Stack` e
  helper navigation hooks sono marcati internal / non-stable nelle superfici
  consumer correnti.
- `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Select`, `TopBar`,
  `BottomBar`, `SideBar`, `mergeStyles` e platform helpers sono marcati
  experimental.
- I simboli legacy `auraTokens` e `getAuraTokens` non compaiono in README/docs
  consumer correnti; le occorrenze residue restano audit storico/governance e
  sono gia marcate legacy/deprecated/removed/not stable.

## PLRNUI-60 current-state reconciliation

PLRNUI-60 reconciles this historical stability audit with the current
`src/index.ts` root surface:

- Current stable root surface remains `0`.
- Current beta root component/provider surface is tracked in
  `audit/components/component-maturity-matrix.md` and includes remediated
  root-visible components such as `Card`, `CodeInline`, `PasswordInput`,
  `ProgressBar`, `Textarea`, `Stack` and `TopBar` as beta/non-stable rather
  than internal stable candidates.
- Current experimental root component surface remains explicit for overlays and
  app-shell/platform-sensitive components: `BottomBar`, `BottomSheet`, `Modal`,
  `Popover`, `Select`, `SideBar`, `Tooltip`.
- `Code`, `Page`, `Hero` and `ToastProvider` are historical/source-tree
  inventory rows, not current root public API.

## Raccomandazioni di audit

- Introdurre un requisito di label obbligatoria per ogni pagina API/componente.
- Mantenere le API internal fuori dalle pagine consumer oppure marcarle esplicitamente come internal/non-stable.
- Documentare experimental come opt-in e non come root stable API.
- Collegare ogni pagina componente alla riga PLRNUI-5 corrispondente.
- PLRNUI-53 resolves alias policy for `auraTokens` e `getAuraTokens`: legacy/deprecated, removed, not stable public API, no compatibility aliases and forbidden in consumer examples.
