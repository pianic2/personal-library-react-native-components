# 08 - Refactor Roadmap

## Phase 0 - Freeze and Baseline

Obiettivo: impedire che il rename amplifichi difetti gia presenti.

- Bloccare publish fino a build/typecheck verificati.
- Generare `npm pack --dry-run` dopo install autorizzata.
- Creare matrice API con stati: `stable`, `experimental`, `internal`, `remove`.
- Decidere naming finale: package npm, import path, token aliases, docs.

## Phase 1 - Critical Packaging Fixes

- Allineare `package.json` a `dist`.
- Definire peer dependencies.
- Allineare `tsup.external` a peer dependencies.
- Rimuovere toolchain da runtime dependencies.
- Verificare output `dist` per platform extensions.

## Phase 2 - Runtime Bug Fixes

Blocchi critici:

- `Card`: rimuovere hook da helper.
- `ProgressBar`: applicare width.
- `CodeInline`: correggere fallback `size`.
- `Textarea`: usare `theme.space`.
- `defaultTheme`: dark mode reale.
- `TopBar`: rimuovere placeholder `a`.

## Phase 3 - API Surface Stabilization

- Separare root stable exports da experimental/internal.
- Esportare props types dei componenti stabili.
- Spostare storage auth fuori dal core.
- Separare provider tema puro da app shell.
- Documentare platform support componente per componente.

## Phase 4 - Naming Migration

- Rinominare package/docs/API pubblica secondo mapping approvato.
- Introdurre alias legacy dove necessario.
- Deprecare `auraTokens` e `getAuraTokens`.
- Aggiornare README, MkDocs e demo.

## Phase 5 - Component Hardening

- Stabilizzare form components.
- Stabilizzare overlay/toast behavior cross-platform.
- Definire accessibility baseline.
- Introdurre test minimi: type tests, render tests, package smoke tests.

## Quick Wins

- Fix `ProgressBar` width.
- Fix `CodeInline` size fallback.
- Fix `Textarea` token access.
- Fix `NavBar.bottomMaxItems`.
- Fix `TopBar` placeholder.
- Remove unused `ui` dependency if confirmed unused.
- Move `tsup`/`typescript` to devDependencies.

## Suggested Jira Backlog

### Epic: Rename AURA to react-native-components

- Story: Define package naming and import compatibility policy.
- Story: Update package metadata and docs naming.
- Story: Add deprecation aliases for AURA token exports.
- Story: Publish migration guide for consumers.

### Epic: Package Publishing Readiness

- Bug: Align `package.json` entrypoints with `dist`.
- Task: Redesign peer dependency policy for Expo/RN.
- Task: Align `tsup.external` with dependency policy.
- Task: Add `npm pack --dry-run` verification.
- Task: Verify platform extension behavior in build output.

### Epic: Runtime Stabilization

- Bug: Fix dark mode color resolution.
- Bug: Fix `Card` hook rule violation.
- Bug: Fix `ProgressBar` progress rendering.
- Bug: Fix `CodeInline` undefined lineHeight.
- Bug: Fix `Textarea` semantic spacing token.
- Bug: Fix `TopBar` placeholder render.

### Epic: Public API Governance

- Story: Define public/internal/experimental export matrix.
- Story: Export stable component prop types.
- Story: Move auth token storage outside UI package.
- Story: Split pure `ThemeProvider` from app shell wrappers.
- Story: Document platform support per component.

### Epic: Component Maturity

- Story: Stabilize form components API.
- Story: Stabilize overlay components behavior on native/web.
- Story: Add accessibility props and roles for form controls.
- Story: Add component smoke tests.
- Story: Add visual/demo coverage for stable components.

## Findings

### Finding RD-01

- File/percorso: repository root / `audit/*`
- Problema: manca una roadmap tracciata per separare rename, packaging, bugfix e API governance.
- Impatto: se il rename viene fatto insieme a refactor non governati, i breaking changes diventano difficili da spiegare in Jira/Confluence.
- Severita: Alta
- Raccomandazione: creare epic separati come sopra e bloccare il rename fino alla chiusura dei bug critici.

### Finding RD-02

- File/percorso: componenti vari
- Problema: quick wins runtime sono piccoli ma bloccanti per percezione di qualita.
- Impatto: demo e consumer possono mostrare bug visibili anche dopo il rebrand.
- Severita: Alta
- Raccomandazione: fare una sprint breve di hardening prima del rebrand pubblico.

