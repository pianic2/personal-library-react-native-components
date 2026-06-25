# PLRNUI-9 - Documentation and Example App Alignment Readiness Report

## Executive summary

PLRNUI-9 e pronto per la fase di creazione artefatti audit, ma non per dichiarare docs/demo allineati. La fase read-only ha rilevato gap sistematici:

- naming legacy `AURA` ancora presente in README, MkDocs, docs, demo e preview;
- docs componenti basate su import legacy `from "AURA"`;
- demo con import repo-relative verso `../../index` e un import internal verso `../../theme/types`;
- componenti beta/experimental/internal non etichettati coerentemente;
- preview web basata su shim/alias non documentati come preview-only;
- PLRNUI-5 classifica zero componenti stable.

Verdict operativo: **READY WITH GAPS**.

## Repository state

| Item | Stato rilevato |
| --- | --- |
| Branch | `main...origin/main` |
| Working tree iniziale | dirty prima degli artefatti PLRNUI-9 |
| Modified tracked files preesistenti | `package-lock.json` |
| Untracked paths preesistenti | `audit/` |
| Scope modificabile per questa fase | solo `audit/docs/*.md` |

## Input discovery

| Input | File | Stato |
| --- | --- | --- |
| ADR 0007 | `audit/adr/0007-documentation-and-example-app-strategy.md` | found |
| ADR 0002 | `audit/adr/0002-public-api-export-policy.md` | found |
| Risk Assessment 0007 | `audit/risk-assessment/0007-documentation-drift-risk.md` | found |
| Output PLRNUI-4 | `audit/api/export-matrix.md`, `deep-import-audit.md`, `root-api-proposal.md`, `subpath-exports.md`, `public-types.md` | found |
| Output PLRNUI-5 | `audit/components/component-maturity-matrix.md`, `component-classification-summary.md`, `component-blockers.md`, `platform-limitations.md`, `stable-promotion-requirements.md` | found |

## Docs/demo scope

Analizzati:

- `README.md`
- `mkdocs.yml`
- `docs/**`
- `demo/**`
- `preview-web/**`
- `themes/liquidglass/README.md`
- audit correlati in `audit/adr/**`, `audit/api/**`, `audit/components/**`, `audit/risk-assessment/**`, `audit/migration/**`

## Sintesi naming audit

- `README.md` e `docs/index.md` usano AURA come nome prodotto.
- `mkdocs.yml` usa AURA in site metadata e repo URL.
- Le pagine docs usano import legacy `from "AURA"`.
- `README.md` usa `from "aura"`.
- Demo e preview contengono branding AURA.
- I riferimenti AURA in ADR/migration/audit sono perlopiu storici e non vanno trattati come cleanup immediato.

## Sintesi deep import audit

- `demo/app/App.tsx` importa da `../../index`.
- `demo/app/App.tsx` importa `Theme` da `../../theme/types`, bypassando l'entrypoint pubblico.
- `demo/screens/*` importa da `../../index`.
- `preview-web/preview.tsx` importa direttamente `../demo/app/App`.
- `preview-web/vite.config.ts` usa alias/shim per React Native Web, Safe Area, AsyncStorage, Expo Clipboard, Lucide e repo root.
- Non sono stati trovati import da `src`, `packages/ui/src` o `dist` nello scope docs/demo/preview.

## Sintesi stability docs

- PLRNUI-5 classifica `stable = 0`.
- I 23 componenti beta sono documentati senza label `beta`.
- I 12 componenti experimental sono documentati senza label `experimental`.
- I 6 componenti internal hanno pagine navigabili o sono usati in demo.
- Historical PLRNUI-9 evidence found `auraTokens` e `getAuraTokens` documented/used; PLRNUI-53 now marks them legacy/deprecated, removed, not stable public API and forbidden in consumer examples.

## Sintesi preview shim

La preview web usa:

- `react-native` -> `react-native-web`;
- `react-native-safe-area-context` -> shim no-op;
- `@react-native-async-storage/async-storage` -> `localStorage` shim;
- `expo-clipboard` -> browser Clipboard shim;
- `lucide-react-native` -> `lucide-react`;
- `@` -> repo root.

Questi shim validano la demo web, non il runtime Expo/RN reale.

## AC coverage matrix

| Acceptance criterion | Evidenza | Stato | Gap residuo |
| --- | --- | --- | --- |
| Docs e demo usano solo API pubbliche o gap registrato | Gap registrati in naming/deep import audit; demo usa `../../index` e `../../theme/types`. | partially-satisfied | Docs/demo non sono ancora allineati, ma i gap sono censiti. |
| Componenti stable hanno requisito docs minimo | PLRNUI-5 classifica `stable = 0`; checklist futura definita. | partially-satisfied | Nessun componente stable oggi; checklist da applicare alla prima promozione. |
| Componenti beta/experimental sono etichettati | Docs non hanno label sistematiche; audit stability creato. | not-satisfied | Etichette non applicate alle docs reali. |
| Shim preview documentati come tali | Shim inventariati in `preview-shim-audit.md`. | partially-satisfied | Docs reali/troubleshooting non ancora aggiornati. |
| Riferimenti AURA legacy censiti per cleanup | Riferimenti censiti in `naming-legacy-audit.md`. | satisfied | Cleanup non eseguito per vincolo di scope. |

## Verdict finale

**READY WITH GAPS**

PLRNUI-9 puo procedere con gli artefatti audit sotto `audit/docs/`, ma docs/demo non sono ancora conformi agli acceptance criteria come prodotto finale.

## Blocker

- Import legacy `from "AURA"` in docs.
- `README.md` usa `from "aura"` e branding AURA.
- Demo usa `../../index` invece del package pubblico.
- Demo importa `Theme` da `../../theme/types`.
- Internal components documentati/navigabili senza label.
- Experimental components documentati senza label.
- Preview shim non documentati in user docs.

## Rischi

- Consumer copia import non funzionanti o non finali.
- Demo passa grazie a path locali e shim Vite mentre consumer Expo/RN fallisce.
- API internal/deprecated percepite come pubbliche.
- Docs non distinguono beta/experimental e possono causare breaking change futuri.
- Preview web confusa con validazione runtime Expo/RN.

## Next recommended actions

1. Creare una fase successiva per aggiornare docs reali, dopo approvazione package identity/API.
2. Applicare stability label a ogni pagina componente/API.
3. Separare consumer examples da demo preview.
4. Documentare esplicitamente preview shim e limiti.
5. Aggiungere troubleshooting Expo/RN/Metro nelle docs.
6. Policy for `auraTokens`/`getAuraTokens` is resolved by PLRNUI-53: legacy/deprecated, removed, not stable public API and forbidden in consumer examples.
7. Allineare demo a entrypoint pubblico quando package metadata e API sono approvati.

## Note esplicite di scope

- Nessun codice sorgente modificato.
- Nessun package metadata modificato.
- Nessun lockfile modificato da questa fase.
- Nessun export pubblico modificato.
- Nessun build config modificato.
- Nessun ticket Jira creato.
- Nessuna issue chiusa.
- Confluence non modificato.
