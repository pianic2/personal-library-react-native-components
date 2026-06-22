# 09 - Jira / Confluence Migration Plan

## Objective

Formalizzare la migrazione da AURA / UI Experience a `react-native-components` con tracciabilita Jira e documentazione Confluence.

## Confluence Structure Suggested

### Page: react-native-components - Migration Overview

Contenuti:

- obiettivo e scope;
- naming old/new;
- package target;
- stato attuale audit;
- rischi principali;
- decisioni aperte.

### Page: Public API Matrix

Colonne:

- export;
- area;
- stato (`stable`, `experimental`, `internal`, `deprecated`);
- platform support;
- breaking change previsto;
- ticket Jira associato.

### Page: Packaging and Publishing Runbook

Contenuti:

- dependency policy;
- peer dependencies;
- build command;
- typecheck command;
- `npm pack --dry-run`;
- Expo/RN smoke app;
- criteri release.

### Page: Theme and Tokens Migration

Contenuti:

- mapping `auraTokens` -> nuovo nome;
- dark mode behavior;
- token naming;
- `liquidglass` status;
- deprecation plan.

### Page: Component Maturity Matrix

Contenuti:

- inventory componenti;
- stato;
- criticita;
- owners;
- test richiesti.

## Jira Proposal

### Epic 1 - Rename and Product Positioning

- Define final npm package name and import path.
- Rename package metadata from AURA to `react-native-components`.
- Update README and MkDocs naming.
- Create migration guide for consumers.
- Decide legacy alias policy.

### Epic 2 - Package Publishing Readiness

- Fix package entrypoints.
- Redesign peer/dev/dependencies split.
- Align tsup external config.
- Add package smoke verification.
- Validate Expo and React Native Web consumption.

### Epic 3 - Runtime Bug Hardening

- Fix dark mode in default theme.
- Fix broken components: `Card`, `ProgressBar`, `CodeInline`, `Textarea`.
- Fix visible navigation bugs.
- Add minimal render/type tests.

### Epic 4 - API Governance

- Create public/internal/experimental export matrix.
- Reduce root API or introduce subpath exports.
- Export stable prop types.
- Move storage auth outside UI core.
- Document platform support.

### Epic 5 - Component Stabilization

- Stabilize form controls.
- Stabilize overlay/toast behavior.
- Add accessibility baseline.
- Expand demo coverage.
- Add docs examples for stable components.

## Definition of Done for Migration

- `package.json` has final package name and dist entrypoints.
- `npm run typecheck` passes.
- `npm run build` passes.
- `npm pack --dry-run` includes expected files only.
- Smoke import works from a clean Expo app.
- README and MkDocs use final naming.
- Public API matrix approved.
- Critical runtime bugs fixed.
- Breaking changes documented.
- Legacy aliases/deprecations documented.

## Findings

### Finding JCM-01

- File/percorso: `package.json`, `README.md`, `mkdocs.yml`, `index.ts`, `tokens/index.ts`
- Problema: rename, API governance e packaging sono interdipendenti ma non ancora separati in workstream.
- Impatto: Jira rischia di creare ticket troppo grandi e non verificabili.
- Severita: Alta
- Raccomandazione: creare epic separati per naming, packaging, runtime hardening, API governance e component maturity.

### Finding JCM-02

- File/percorso: `audit/02-component-inventory.md`, `audit/04-api-surface.md`
- Problema: componenti rotti o sperimentali sono esportati come se fossero stabili.
- Impatto: Confluence deve comunicare chiaramente lo stato reale prima di qualunque consumo interno/esterno.
- Severita: Alta
- Raccomandazione: pubblicare una component maturity matrix e agganciarla ai ticket di hardening.

### Finding JCM-03

- File/percorso: `audit/06-build-and-packaging.md`
- Problema: build e typecheck non sono stati eseguiti per assenza `node_modules` e divieto di installazione.
- Impatto: il piano Jira deve includere una verifica tecnica dopo install autorizzata o in CI.
- Severita: Media
- Raccomandazione: aggiungere ticket "Establish clean build verification" con output attesi e allegati.

