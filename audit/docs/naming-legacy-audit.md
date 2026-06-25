# PLRNUI-9 - Naming Legacy Audit

## Scopo

Censire i riferimenti legacy o ambigui in documentazione, demo, preview e audit rilevante per preparare l'allineamento di PLRNUI-9 senza modificare docs reali, demo, sorgenti o package metadata.

Questo file registra gap e raccomandazioni. Non applica cleanup.

## Scope analizzato

- `README.md`
- `mkdocs.yml`
- `docs/**`
- `demo/**`
- `preview-web/**`
- `themes/liquidglass/README.md`
- audit rilevante: `audit/adr/**`, `audit/api/**`, `audit/components/**`, `audit/risk-assessment/0007-documentation-drift-risk.md`, `audit/migration/**`

Token cercati:

- `AURA`
- `Aura`
- `aura`
- `@aura/ui`
- `@personal-library/react-native-components`
- `personal-library-react-native-components`
- `react-native-components`

## Tabella riferimenti legacy

| File | Riga | Riferimento | Categoria | Azione raccomandata |
| --- | ---: | --- | --- | --- |
| `mkdocs.yml` | 1-3 | `AURA`, `AURA UI library`, repo URL `AURA` | legacy-blocker | Aggiornare metadata docs quando package identity e approvata. |
| `README.md` | 1,3 | `# AURA`, descrizione AURA | legacy-blocker | Allineare al nome progetto canonico. |
| `README.md` | 23 | `import { Button } from "aura";` | legacy-blocker | Sostituire con package pubblico approvato. |
| `docs/index.md` | 1,3 | `AURA` come titolo/prodotto | legacy-blocker | Allineare a `react-native-components`. |
| `docs/index.md` | 24 | `from "AURA"` | legacy-blocker | Usare import pubblico approvato. |
| `docs/getting-started.md` | 14,18,24,37 | `AURA`, `from "AURA"` | legacy-blocker | Aggiornare naming e import nel getting started. |
| `docs/theme.md` | 18,38 | `from "AURA"` | legacy-blocker | Aggiornare import documentati. |
| `docs/components/**/*.md` | prevalentemente riga 8 | `from "AURA"` | legacy-blocker | Aggiornare tutte le pagine componente dopo decisione package/API. |
| `docs/components/navigation/index.md` | 3 | `componenti di navigazione in AURA` | legacy-blocker | Allineare naming del testo descrittivo. |
| `docs/tokens/index.md` | historical audit lines 19-20,26-29 | `auraTokens`, `getAuraTokens`, `from "AURA"` | legacy/deprecated/removed by later policy | PLRNUI-53 resolves the policy: these token names are not stable public API and must not appear in consumer examples. |
| `docs/storage/token-storage.md` | 8 | `from "AURA"` | legacy-blocker | Storage e internal/uncertain secondo PLRNUI-4: non documentarlo come root API senza decisione. |
| `docs/utils/cn.md` | 8 | `from "AURA"` | legacy-blocker | Allineare import e stability. |
| `docs/utils/merge-styles.md` | 8 | `from "AURA"` | legacy-blocker | Allineare import e stability. |
| `docs/utils/platform.md` | 8 | `from "AURA"` | legacy-blocker | Allineare import e stability. |
| `docs/utils/safe-area.md` | 8 | `from "AURA"` | legacy-blocker | Allineare import e stability. |
| `themes/liquidglass/README.md` | 3,44 | `AURA`, `from "AURA"` | cleanup | Theme experimental: aggiungere label e import approvato/experimental. |
| `preview-web/index.html` | 6 | `AURA Preview` | cleanup | Etichettare come preview legacy o rinominare. |
| `demo/app/App.tsx` | 47 | `AURA UI Complete Demo` | cleanup | Rinominare demo e chiarire che non e source of truth. |
| `demo/screens/FeedbackScreen.tsx` | 211 | `AURA Enterprise Rollout` | cleanup | Sostituire esempio branding. |
| `demo/screens/LayoutScreen.tsx` | 139 | logo `AURA` | cleanup | Sostituire demo branding. |
| `demo/screens/FoundationsScreen.tsx` | historical audit lines 16,20,36,44,76 | `getAuraTokens` | legacy/deprecated/removed by later policy | PLRNUI-53 forbids this legacy token name in consumer examples; this row remains historical audit evidence only. |
| `audit/adr/0001-package-identity-and-naming.md` | varie | `AURA`, `UI Experience`, `react-native-components` | historical-ok | Conservare come contesto storico di migrazione. |
| `audit/migration/legacy-naming-map.md` | varie | mapping AURA -> `react-native-components` | historical-ok | Conservare come registro di migrazione. |
| `audit/migration/migration-changelog.md` | varie | AURA/UI Experience storico | historical-ok | Conservare come changelog di migrazione. |
| `audit/migration/breaking-change-register.md` | 11-13,31,37 | package rename, import path legacy, token legacy | historical-ok | Conservare come registro breaking change. |
| `audit/api/subpath-exports.md` | 9-19 | `@personal-library/react-native-components` | correct | Uso corretto come proposta di entrypoint futuro. |
| `audit/api/export-matrix.md` | 7,13 | `@aura/ui` legacy e target package | historical-ok | Evidenza corretta del gap package identity. |
| `audit/api/deep-import-audit.md` | 17-27 | target package e `AURA` legacy | historical-ok | Evidenza corretta del gap import. |

## Sintesi blocker

- `README.md`, `mkdocs.yml`, `docs/index.md` e `docs/getting-started.md` presentano ancora `AURA` come nome prodotto o import path.
- Le pagine componente documentano in modo sistematico `from "AURA"`.
- Historical `docs/tokens/index.md` evidence documented `auraTokens` e `getAuraTokens`; PLRNUI-53 now classifies them as legacy/deprecated, removed by PLRNUI-29, not stable public API and forbidden in consumer examples.
- Demo e preview contengono branding AURA non chiaramente storico.

## Note sui riferimenti storici

I riferimenti AURA dentro `audit/adr/**`, `audit/migration/**`, `audit/api/**` e risk assessment sono prevalentemente storici o deliberatamente descrittivi. Non vanno trattati come cleanup immediato se servono a documentare la migrazione, il mapping legacy, i breaking change o il razionale delle decisioni.

Il cleanup immediato deve concentrarsi su superfici consumer-facing: `README.md`, `mkdocs.yml`, `docs/**`, `demo/**`, `preview-web/**` e `themes/liquidglass/README.md`.
