# 10 - Read-Only Technical Audit Consolidated

## Scope

Task Jira: PLRNUI-2 - Codebase read-only technical audit.

Obiettivo: consolidare l'audit tecnico read-only del repository prima di refactor, rename o promozione ADR da `Proposto` ad `Accettato`.

Input verificati:

- repository corrente;
- audit tecnici in `audit/*.md`;
- ADR 0008 in `audit/adr/0008-migration-governance-and-breaking-change-policy.md`;
- ADR review in `audit/adr-review.md`;
- Risk Assessment 0008 in `audit/risk-assessment/0008-breaking-change-governance-risk.md`;
- codice reale nei percorsi citati dai finding.

Vincolo: nessun file sorgente e stato modificato durante questo audit.

## Executive Summary

Verdict: ADR e roadmap sono una baseline valida, ma non sono ancora promuovibili ad `Accettato`.

Il repository espone ancora rischi bloccanti su packaging, naming, API pubblica, theme dark mode, classificazione componenti e dependency policy. La sequenza definita da ADR 0008 resta corretta: audit read-only, classificazione componenti, definizione API pubblica, cleanup naming, packaging, docs, test, release candidate.

Blocco principale aggiornato: le verifiche locali di install, build, package dry-run e typecheck sono state completate con esito positivo. Restano da produrre smoke test consumer Expo/RN, verifica runtime/preview e pubblicazione/sincronizzazione Confluence degli artefatti governance.

## Environment And Verification Status

| Verifica | Stato | Note |
| --- | --- | --- |
| `npm install` | ✅ OK | Verifica completata prima dell'aggiornamento; `node_modules` presente |
| `npm run build` | ✅ OK | Build locale completata con exit code 0 |
| `npm pack --dry-run` | ✅ OK | Dry-run package completato con exit code 0; rilanciato fuori sandbox per cache npm read-only |
| `npm run typecheck` | ✅ OK | Typecheck aggregato completato con exit code 0 |
| `npm run typecheck:ui` | ✅ OK | Typecheck libreria UI completato con exit code 0 |
| `npm run typecheck:preview` | ✅ OK | Typecheck preview completato con exit code 0 |
| `node --version` | Eseguito | `v20.19.2` |
| `npm --version` | Eseguito | `9.2.0` |
| `test -d node_modules` | Eseguito | `node_modules present` dopo `npm install` |
| `git status --short` | Eseguito | `?? audit/` |
| `git ls-files audit \| wc -l` | Eseguito | `0`, gli artefatti audit risultano non tracciati |
| Smoke test Expo/RN consumer | Non eseguito | Richiede ambiente consumer/app Expo dedicata |
| Smoke test React Native Web/preview | Non eseguito | Richiede esecuzione runtime preview, non solo typecheck |

## Consolidated Findings

| ID | Severity | Blocker | File/percorso | Finding | Impatto | Raccomandazione |
| --- | --- | --- | --- | --- | --- | --- |
| AUD-01 | Critica | Si | `package.json:2-14` | Il package e ancora `@aura/ui`, ma `exports` punta a `dist/index.*` mentre `main`/`types` puntano a `index.ts`. `npm run build`, `npm pack --dry-run` e typecheck risultano OK, ma resta da validare import consumer reale. | Package localmente buildabile e packabile, ma non ancora provato in un consumer Expo/RN. | Bloccare publish e ADR packaging finche import consumer e runtime smoke test non sono verdi. |
| AUD-02 | Critica | Si | `theme/defaultTheme.tsx:13-17`, `theme/defaultTheme.tsx:46-62` | `createBaseTheme(mode)` accetta `mode`, ma assegna sempre `lightColors`; `defaultTheme` e solo light. | Il contratto light/dark descritto dagli ADR non e verificato nello stato corrente. | Bloccare ADR theme come `Accettato` finche dark mode non e implementato o dichiarato non disponibile. |
| AUD-03 | Critica | Si | `components/surfaces/Card.tsx:63-78` | `Card` chiama `applyShadow`, che usa `useTheme()` dentro una funzione helper non componente/hook. | Rischio runtime React hooks rule violation quando il componente viene renderizzato. | Correggere prima di classificare `Card` come stable o mantenerlo fuori dalla root API stabile. |
| AUD-04 | Alta | Si | `components/feedback/ProgressBar.tsx:17-35` | `width` viene calcolata ma non applicata: la riga `width` nello stile e commentata. | La progress bar non rappresenta il valore `progress`; componente esportato ma comportamento rotto. | Correggere e aggiungere smoke/render test prima di promozione componenti. |
| AUD-05 | Alta | Si | `components/typography/CodeInline.tsx:15-27` | Default `size="sm"` viene applicato al render, ma `lineHeight` usa `props.size`, che puo essere `undefined`. | Possibile `NaN`/stile invalido per uso default del componente. | Derivare una size risolta e verificare render base. |
| AUD-06 | Alta | Si | `components/form/Textarea.tsx:6-13`, `components/form/PasswordInput.tsx:7` | Props pubbliche tipizzate come `any`. | Contratto TypeScript instabile per componenti form esportati. | Tipizzare props pubbliche prima di stabilizzare API o documentare come experimental. |
| AUD-07 | Alta | Si | `index.ts:5-28` | Root API esporta componenti, hooks, utils, storage, tokens, theme e themes senza matrice public/experimental/internal/deprecated. | Superficie pubblica troppo ampia; alto rischio breaking changes durante cleanup. | Definire export matrix e package exports prima di ADR API `Accettato`. |
| AUD-08 | Alta | Si | `storage/index.ts`, `storage/tokenStorage.ts:3-7`, `index.ts:18-20` | Storage token/auth e storage tema sono esposti dal package UI. | Responsabilita app/auth dentro libreria UI; rischio privacy/security e accoppiamento consumer. | Separare storage auth dal core UI o marcarlo internal/deprecated con migration path. |
| AUD-09 | Alta | Si | `package.json:24-39` | Solo `react` e peer dependency; React Native, React DOM, RN Web, native modules e toolchain sono in `dependencies`. | Consumer Expo/RN possono installare duplicati o versioni non compatibili. | Definire dependency policy peer/optional/dev/runtime prima di publish. |
| AUD-10 | Alta | Si | `components/navigation/SideBar.tsx:10-12`, `components/navigation/SideBar.web.tsx:18-20`, `components/overlay/Tooltip.tsx:30`, `components/overlay/Popover.tsx:29-31` | Alcuni componenti sono web-only o native-null/fallback senza contratto pubblico esplicito. | Consumer native possono importare componenti che non mostrano contenuto o hanno comportamento diverso. | Documentare platform support e classificare web-only/experimental prima di root API stabile. |
| AUD-11 | Alta | Si | `README.md:1-3`, `mkdocs.yml:1-3`, `package.json:2-4`, `docs/**/*.md` | Naming AURA resta in metadata e docs come import primario. | Contraddice il naming canonico `react-native-components` degli ADR se pubblicato come stato corrente. | Eseguire cleanup naming solo con ticket dedicato, mapping legacy e deprecation policy. |
| AUD-12 | Media | No | `components/navigation/SideBar.web.tsx:40`, `theme/createTheme.ts:9-12`, `theme/types.ts:59`, `components/overlay/BottomSheet.tsx:55` | Uso residuo di `any` in logica theme/style e componenti. | Riduce affidabilita TypeScript e rende meno chiari i contratti pubblici. | Bonificare durante stabilizzazione API, dopo export matrix. |
| AUD-13 | Media | No | `demo/app/App.tsx:15`, `demo/**/*.tsx` | Demo importa in parte da `../../index` e in parte da percorsi interni come `../../theme/types`. | La demo non prova solo la API pubblica prevista. | Allineare demo alla root API o a subpath pubblici approvati. |
| AUD-14 | Media | No | `audit/` | Gli artefatti audit risultano non tracciati da git. | Rischio perdita o mancata referenziabilita degli output se non vengono aggiunti a VCS o pubblicati in Confluence. | Tracciare o pubblicare gli audit secondo flusso repository -> Confluence deciso da ADR 0008. |

## Blocking Risk Confirmation

Rischi bloccanti confermati:

- Packaging: build, typecheck e `npm pack --dry-run` risultano OK; resta da validare l'install/import in consumer reale prima del publish.
- Theme: dark mode non e implementato nel tema base, quindi ADR 0004 non puo essere considerato soddisfatto.
- Component stability: componenti esportati presentano difetti runtime o funzionali (`Card`, `ProgressBar`, `CodeInline`, `Textarea`).
- Public API: la root API e troppo ampia e include storage, themes e moduli non classificati.
- Naming: AURA resta nome primario in package metadata e docs.
- Dependencies: peer dependency policy incompleta per una libreria React Native/Expo.
- Governance: ADR/risk assessment e audit non risultano ancora sincronizzati o pubblicati in Confluence come source of truth consultabile.

Rischi non ancora chiudibili per ambiente/verifiche non coperti da build e typecheck:

- Consumer install/import smoke test.
- Expo managed app smoke test.
- React Native Web preview smoke test.

## ADR Promotion Recommendation

Raccomandazione: mantenere ADR 0001..0008 in stato `Proposto`.

Blocchi specifici prima di `Accettato`:

- ADR 0001: decidere package npm finale, alias legacy, policy deprecation e cleanup AURA con mapping verificato.
- ADR 0002: produrre export matrix concreta e package exports coerenti.
- ADR 0003: classificare ogni componente esportato e rimuovere/etichettare componenti broken o experimental.
- ADR 0004: implementare/verificare dark mode e mappa token reale.
- ADR 0005: verificare Expo/RN/Web con smoke test consumer.
- ADR 0006: build, package output, `npm pack --dry-run` e typecheck sono OK; resta da validare import consumer.
- ADR 0007: allineare docs/demo a API pubblica e naming canonico.
- ADR 0008: chiarire e applicare il flusso repository draft -> review -> Confluence source of truth -> stato `Accettato`.

ADR 0008 resta valido come governance proposta, ma la sua verifica non e completa: backlog, audit, migration changelog e verifiche locali build/typecheck/package esistono come evidenze iniziali, mentre mancano ancora Confluence sync e consumer verification.

## Recommended Next Jira Sequence

1. PLRNUI-3: naming cleanup plan, package name decision, legacy alias/deprecation policy.
2. PLRNUI-4: public API export matrix and root/subpath export policy.
3. PLRNUI-5: component stability classification with fixes or demotion for broken exports.
4. PLRNUI-6: theme token and dark mode verification.
5. PLRNUI-7: Expo/RN dependency policy and peer dependency audit.
6. PLRNUI-8: build/package smoke tests and `npm pack --dry-run`.
7. PLRNUI-9: docs/demo alignment to public API and canonical naming.
8. PLRNUI-10: breaking change register finalization and migration changelog.
9. PLRNUI-11: Confluence publication/synchronization for ADR, risk assessment, audit and roadmap.

## Confluence-Ready Outcome

PLRNUI-2 can be considered complete when this report is published or linked as the consolidated read-only audit output.

Do not promote ADRs to `Accettato` from this audit alone. Use this report as the blocker list and evidence baseline for the next implementation tickets.
