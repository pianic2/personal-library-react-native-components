# Jira Backlog Plan - react-native-components Migration Foundation

## Stato

Proposto

## Project Key

`RNC`

## Obiettivo

Definire il backlog Jira iniziale per governare la migrazione da AURA / UI Experience a `react-native-components`, usando come input gli ADR in `audit/adr/`, la review in `audit/adr-review.md` e i Risk Assessment in `audit/risk-assessment/`.

Il piano non dichiara completata la migrazione. Serve a trasformare decisioni, riserve e rischi in lavoro operativo tracciabile.

## Source of Truth

- Repository: codice, test, package config, examples e artefatti markdown sorgente.
- Confluence: ADR pubblicati/approvati, risk assessment, audit e roadmap.
- Jira: backlog operativo, spike, task, mitigazioni rischio, stato del lavoro e acceptance criteria.

## Epic principale

### RNC-1 - react-native-components Migration Foundation

- Tipo: Epic
- Obiettivo: governare la fondazione tecnica e decisionale della migrazione da AURA / UI Experience a `react-native-components`.
- Input:
  - `audit/adr/`
  - `audit/adr-review.md`
  - `audit/risk-assessment/`
  - audit tecnico esistente sotto `audit/*.md`
- Output atteso:
  - audit tecnico consolidato;
  - export matrix;
  - component stability matrix;
  - package/dependency policy;
  - build/package smoke plan;
  - migration changelog;
  - pubblicazione Confluence degli ADR e risk assessment;
  - release candidate readiness report.
- Acceptance criteria:
  - tutti i task RNC-2..RNC-12 sono completati o esplicitamente rimandati con motivazione;
  - i rischi critici e alti hanno mitigazione tracciata;
  - nessun ADR passa da `Proposto` ad `Accettato` senza evidenza di verifica richiesta;
  - Jira, Confluence e repository hanno riferimenti incrociati coerenti.
- Artefatti collegati:
  - ADR 0001..0008;
  - Risk Assessment 0001..0008;
  - `audit/adr-review.md`;
  - `audit/backlog/jira-backlog-plan.md`.
- Priorità: Critica

## Spike tecnici e task operativi

### RNC-2 - Codebase read-only technical audit

- Tipo: Spike
- Obiettivo: completare e consolidare un audit read-only del codice reale prima di refactor, rename o promozione ADR.
- Input:
  - repository corrente;
  - `audit/00-project-map.md`;
  - `audit/01-package-structure.md`;
  - `audit/02-component-inventory.md`;
  - `audit/03-theme-token-system.md`;
  - `audit/04-api-surface.md`;
  - `audit/05-dependencies.md`;
  - `audit/06-build-and-packaging.md`;
  - `audit/07-risks.md`.
- Output atteso:
  - lista aggiornata dei finding tecnici;
  - conferma dei rischi bloccanti;
  - elenco verifiche non eseguite per assenza dipendenze o ambiente;
  - raccomandazione su cosa blocca gli ADR da `Accettato`.
- Acceptance criteria:
  - nessun file sorgente modificato;
  - finding collegati a file/percorso e impatto;
  - dipendenze da build/typecheck/smoke test esplicitate;
  - output referenziabile da Confluence.
- Artefatti collegati:
  - ADR 0008;
  - `audit/adr-review.md`;
  - RA 0008;
  - audit tecnico `audit/*.md`.
- Priorità: Critica

### RNC-3 - Package identity and legacy naming cleanup plan

- Tipo: Task
- Obiettivo: definire un piano di cleanup naming per migrare da AURA / UI Experience a `react-native-components` senza rimozioni non tracciate.
- Input:
  - ADR 0001;
  - ADR 0008;
  - RA 0001;
  - review ADR 0001;
  - audit riferimenti legacy.
- Output atteso:
  - mapping legacy -> nuovo nome;
  - decisione proposta su package npm finale;
  - elenco alias temporanei ammessi;
  - piano deprecation per riferimenti pubblici legacy;
  - migration note iniziale.
- Acceptance criteria:
  - `react-native-components` e confermato come nome progetto canonico;
  - package npm finale e proposto o escalation registrata;
  - ogni alias legacy ha motivazione, owner e milestone di rimozione;
  - nessun cleanup naming viene eseguito in questo task senza ticket implementativo separato.
- Artefatti collegati:
  - `audit/adr/0001-package-identity-and-naming.md`;
  - `audit/adr/0008-migration-governance-and-breaking-change-policy.md`;
  - `audit/risk-assessment/0001-package-rename-and-legacy-alias-risk.md`;
  - `audit/adr-review.md`.
- Priorità: Alta

### RNC-4 - Public API export matrix

- Tipo: Task
- Obiettivo: produrre una matrice API che distingua export pubblici, experimental, internal e deprecated.
- Input:
  - ADR 0002;
  - ADR 0003;
  - ADR 0006;
  - RA 0002;
  - review ADR 0002;
  - audit `index.ts` e barrel exports.
- Output atteso:
  - export matrix;
  - proposta root API;
  - proposta subpath exports;
  - elenco deep import vietati;
  - lista tipi props da esportare.
- Acceptance criteria:
  - ogni export attuale ha stato assegnato;
  - entrypoint pubblici sono esplicitati;
  - moduli internal/experimental non sono trattati come API stable;
  - deep import in demo/docs sono censiti;
  - breaking changes potenziali sono inseriti nel register RNC-10.
- Artefatti collegati:
  - `audit/adr/0002-public-api-export-policy.md`;
  - `audit/adr/0003-component-stability-classification.md`;
  - `audit/adr/0006-build-packaging-and-release-strategy.md`;
  - `audit/risk-assessment/0002-public-api-and-deep-import-risk.md`.
- Priorità: Critica

### RNC-5 - Component inventory and stability classification

- Tipo: Task
- Obiettivo: classificare i componenti reali come `stable`, `beta`, `experimental`, `internal` o `deprecated`.
- Input:
  - ADR 0003;
  - ADR 0007;
  - RA 0003;
  - `audit/02-component-inventory.md`;
  - review ADR 0003.
- Output atteso:
  - component maturity matrix;
  - elenco componenti bloccati da bug o assenza test;
  - elenco componenti web-only/native-null;
  - requisiti minimi per promozione a `stable`.
- Acceptance criteria:
  - ogni componente esportato ha una classificazione iniziale;
  - componenti con bug noti non sono classificati `stable`;
  - componenti `experimental` hanno limiti platform dichiarati;
  - componenti candidati `stable` hanno docs/test richiesti come gap esplicito;
  - bug critici sono trasformati in ticket Jira o linkati come blocker.
- Artefatti collegati:
  - `audit/adr/0003-component-stability-classification.md`;
  - `audit/adr/0007-documentation-and-example-app-strategy.md`;
  - `audit/risk-assessment/0003-component-stability-misclassification-risk.md`;
  - `audit/02-component-inventory.md`.
- Priorità: Critica

### RNC-6 - Theme/token architecture verification

- Tipo: Spike
- Obiettivo: verificare sul codice reale il contratto theme/tokens proposto dagli ADR.
- Input:
  - ADR 0004;
  - RA 0004;
  - `audit/03-theme-token-system.md`;
  - review ADR 0004.
- Output atteso:
  - mappa primitive -> semantic -> component tokens;
  - verifica light/dark richiesta o gap confermati;
  - elenco hardcoded values critici;
  - valutazione responsabilita `ThemeProvider`;
  - lista ticket di hardening theme/tokens.
- Acceptance criteria:
  - nessuna capacita theme/tokens e dichiarata verificata senza evidenza;
  - dark mode e classificato come verificato oppure gap/blocco;
  - hardcoded values critici hanno priorita e componente associato;
  - eventuali token legacy AURA hanno migration/deprecation path.
- Artefatti collegati:
  - `audit/adr/0004-theme-token-architecture.md`;
  - `audit/risk-assessment/0004-theme-token-regression-risk.md`;
  - `audit/03-theme-token-system.md`;
  - `audit/adr-review.md`.
- Priorità: Alta

### RNC-7 - Expo/RN dependency policy and peer dependency audit

- Tipo: Spike
- Obiettivo: definire dependency policy Expo/React Native e auditare peer/dependency/devDependency/optional peer.
- Input:
  - ADR 0005;
  - ADR 0006;
  - RA 0005;
  - RA 0006;
  - `audit/05-dependencies.md`;
  - review ADR 0005.
- Output atteso:
  - dependency classification;
  - proposta peerDependencies;
  - elenco dipendenze native e opzionali;
  - gate per nuove dipendenze native;
  - lista rischi Expo Go / managed workflow / prebuild.
- Acceptance criteria:
  - React e React Native hanno policy esplicita;
  - dipendenze native sono censite;
  - dipendenze solo dev/build sono separate concettualmente;
  - ogni nuova dipendenza native richiede ticket o ADR;
  - smoke test Expo/RN richiesto da RNC-8 e definito come blocker release.
- Artefatti collegati:
  - `audit/adr/0005-expo-react-native-compatibility-baseline.md`;
  - `audit/adr/0006-build-packaging-and-release-strategy.md`;
  - `audit/risk-assessment/0005-expo-native-dependency-risk.md`;
  - `audit/05-dependencies.md`.
- Priorità: Critica

### RNC-8 - Build packaging and consumer smoke test

- Tipo: Spike
- Obiettivo: definire ed eseguire, quando le dipendenze sono disponibili, la verifica di packaging e consumo da app pulita.
- Input:
  - ADR 0006;
  - ADR 0005;
  - RA 0006;
  - RA 0005;
  - `audit/06-build-and-packaging.md`;
  - output RNC-4 e RNC-7.
- Output atteso:
  - checklist build/typecheck/package;
  - risultato `npm pack --dry-run`;
  - risultato install/import in consumer pulito Expo/RN;
  - report types/exports/Metro;
  - elenco blocker packaging.
- Acceptance criteria:
  - `npm run typecheck` eseguito oppure blocco ambiente documentato;
  - `npm run build` eseguito oppure blocco ambiente documentato;
  - `npm pack --dry-run` controllato;
  - import documentati verificati da consumer pulito;
  - nessuna duplicazione React/RN non spiegata;
  - risultati linkati a Confluence o allegati al ticket.
- Artefatti collegati:
  - `audit/adr/0006-build-packaging-and-release-strategy.md`;
  - `audit/risk-assessment/0006-packaging-and-consumer-installation-risk.md`;
  - `audit/06-build-and-packaging.md`;
  - output RNC-4 e RNC-7.
- Priorità: Critica

### RNC-9 - Documentation and example app alignment

- Tipo: Task
- Obiettivo: allineare docs ed example app alla API pubblica, senza trattare la demo come source of truth.
- Input:
  - ADR 0007;
  - ADR 0002;
  - RA 0007;
  - review ADR 0007;
  - output RNC-4 e RNC-5.
- Output atteso:
  - audit docs/demo per naming legacy;
  - audit deep import in docs/demo;
  - elenco pagine docs da aggiornare;
  - checklist docs minime per componenti stable;
  - troubleshooting outline Expo/RN/Metro.
- Acceptance criteria:
  - docs e demo usano solo API pubbliche o gap e registrato;
  - componenti stable hanno requisito docs minimo;
  - componenti beta/experimental sono etichettati;
  - shim preview sono documentati come tali;
  - riferimenti AURA legacy sono censiti per cleanup.
- Artefatti collegati:
  - `audit/adr/0007-documentation-and-example-app-strategy.md`;
  - `audit/adr/0002-public-api-export-policy.md`;
  - `audit/risk-assessment/0007-documentation-drift-risk.md`;
  - output RNC-4 e RNC-5.
- Priorità: Alta

### RNC-10 - Migration changelog and breaking change register

- Tipo: Task
- Obiettivo: creare un registro dei breaking changes e una bozza di migration changelog.
- Input:
  - ADR 0008;
  - ADR 0001;
  - ADR 0002;
  - ADR 0006;
  - RA 0008;
  - output RNC-3, RNC-4, RNC-7, RNC-8.
- Output atteso:
  - breaking change register;
  - migration changelog iniziale;
  - template breaking change;
  - mapping issue -> decisione -> verifica.
- Acceptance criteria:
  - ogni breaking change ha motivazione, impatto consumer, migration path, ticket Jira e verifica richiesta;
  - rename/package/API/dependency changes sono coperti;
  - alias legacy hanno finestra di deprecation o rimozione;
  - release candidate non puo procedere senza register aggiornato.
- Artefatti collegati:
  - `audit/adr/0008-migration-governance-and-breaking-change-policy.md`;
  - `audit/risk-assessment/0008-breaking-change-governance-risk.md`;
  - `audit/risk-assessment/0001-package-rename-and-legacy-alias-risk.md`;
  - `audit/risk-assessment/0002-public-api-and-deep-import-risk.md`.
- Priorità: Alta

### RNC-11 - Confluence ADR and Risk Assessment publication

- Tipo: Task
- Obiettivo: pubblicare o sincronizzare in Confluence ADR, ADR review, risk assessment e roadmap/backlog foundation.
- Input:
  - ADR 0008;
  - `audit/adr/`;
  - `audit/adr-review.md`;
  - `audit/risk-assessment/`;
  - `audit/backlog/jira-backlog-plan.md`;
  - RA 0008.
- Output atteso:
  - pagina Confluence Migration Overview;
  - pagine ADR 0001..0008 o indice ADR;
  - pagina Risk Assessment;
  - pagina Jira Backlog Foundation;
  - link bidirezionali Confluence <-> Jira <-> repository.
- Acceptance criteria:
  - Confluence chiarisce che ADR sono `Proposto`;
  - repository markdown e Confluence hanno relazione esplicita;
  - risk assessment sono linkati agli ADR;
  - Jira epic RNC-1 linka le pagine Confluence;
  - nessuna decisione e marcata `Accettato` senza verifica richiesta.
- Artefatti collegati:
  - `audit/adr/`;
  - `audit/adr-review.md`;
  - `audit/risk-assessment/`;
  - `audit/backlog/jira-backlog-plan.md`.
- Priorità: Alta

### RNC-12 - Release candidate readiness review

- Tipo: Task
- Obiettivo: valutare se la migrazione foundation e pronta per una release candidate o se restano blocker.
- Input:
  - output RNC-2..RNC-11;
  - ADR 0001..0008;
  - Risk Assessment 0001..0008;
  - build/typecheck/package smoke evidence;
  - migration changelog.
- Output atteso:
  - release candidate readiness report;
  - elenco blocker;
  - elenco rischi accettati o mitigati;
  - go/no-go recommendation.
- Acceptance criteria:
  - tutti i rischi Critica/Alta hanno esito mitigato, accettato o bloccante;
  - package smoke test e consumer install sono completati o il go e bloccato;
  - changelog e breaking change register sono aggiornati;
  - Confluence e Jira linkano evidenze e decisioni;
  - nessun ADR richiesto per RC resta con riserva non risolta.
- Artefatti collegati:
  - tutti gli ADR;
  - tutti i Risk Assessment;
  - `audit/adr-review.md`;
  - output RNC-2..RNC-11.
- Priorità: Critica

## Risk mitigation task mapping

- RA 0001: mitigato principalmente da RNC-3 e RNC-10.
- RA 0002: mitigato principalmente da RNC-4, RNC-8 e RNC-9.
- RA 0003: mitigato principalmente da RNC-5 e RNC-9.
- RA 0004: mitigato principalmente da RNC-6.
- RA 0005: mitigato principalmente da RNC-7 e RNC-8.
- RA 0006: mitigato principalmente da RNC-8.
- RA 0007: mitigato principalmente da RNC-9 and RNC-11.
- RA 0008: mitigato principalmente da RNC-10, RNC-11 and RNC-12.

## Definition of Done dell'Epic RNC-1

L'epic RNC-1 e completabile quando:

- audit tecnico read-only completato e linkato;
- package identity e alias policy definiti;
- export matrix approvata;
- component stability matrix approvata;
- theme/token verification completata o blocker registrati;
- dependency policy Expo/RN approvata;
- build/typecheck/package smoke test completati o blocker espliciti;
- docs/example app alignment audit completato;
- migration changelog e breaking change register creati;
- ADR e Risk Assessment pubblicati o sincronizzati in Confluence;
- release candidate readiness review prodotta.

## Collegamenti attesi

### Repository

- `audit/adr/`
- `audit/adr-review.md`
- `audit/risk-assessment/`
- `audit/backlog/jira-backlog-plan.md`
- eventuali futuri report di smoke test e release readiness.

### Confluence

- Migration Overview.
- ADR Index.
- Risk Assessment Index.
- Public API Matrix.
- Component Stability Matrix.
- Packaging and Release Runbook.
- Release Candidate Readiness Review.

### Jira

- Epic `RNC-1`.
- Spike/task `RNC-2`..`RNC-12`.
- Link da ogni ticket agli ADR e Risk Assessment pertinenti.
- Link da ogni breaking change al migration changelog/register.

