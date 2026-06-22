# ADR Review - Migrazione AURA / UI Experience -> react-native-components

## Scope

Review tecnica read-only degli ADR presenti in `audit/adr/`.

File verificati:

- `audit/adr/0001-package-identity-and-naming.md`
- `audit/adr/0002-public-api-export-policy.md`
- `audit/adr/0003-component-stability-classification.md`
- `audit/adr/0004-theme-token-architecture.md`
- `audit/adr/0005-expo-react-native-compatibility-baseline.md`
- `audit/adr/0006-build-packaging-and-release-strategy.md`
- `audit/adr/0007-documentation-and-example-app-strategy.md`
- `audit/adr/0008-migration-governance-and-breaking-change-policy.md`

Gli ADR sono stati valutati come baseline decisionale iniziale. Non devono essere considerati evidenza che la migrazione sia gia completata.

## Esito generale

Verdict complessivo: valido con riserve.

Gli otto ADR sono coerenti tra loro, usano naming canonico `react-native-components`, mantengono AURA / UI Experience come storico, distinguono correttamente API pubblica e moduli interni, e separano in modo credibile repository, Jira e Confluence.

Le riserve principali riguardano il passaggio da `Proposto` ad `Accettato`: diverse decisioni richiedono audit puntuale del codice, verifica build/package e conferma delle reali compatibilita Expo, React Native, React Native Web e TypeScript.

## Controlli trasversali

### Sezioni minime

Verdict: valido.

Tutti gli ADR includono:

- `## Stato` impostato a `Proposto`;
- `## Contesto`;
- `## Decisione`;
- `## Conseguenze`;
- `## Debiti noti`;
- sezioni operative aggiuntive come `Verifica`, `Garanzie`, `Confini MVP`, `Rischi noti` o policy specifiche.

### Coerenza tra ADR

Verdict: valido con riserve.

Non emergono contraddizioni bloccanti. Le decisioni sono allineate:

- ADR 0001 definisce identita e naming;
- ADR 0002 limita la API pubblica;
- ADR 0003 fornisce lo stato dei componenti necessario ad ADR 0002;
- ADR 0004 stabilisce il contratto theme/tokens;
- ADR 0005 e ADR 0006 coprono runtime e packaging;
- ADR 0007 lega docs/example app alla API pubblica;
- ADR 0008 definisce governance e sequenza.

Riserva: ADR 0008 dice che Confluence e source of truth per ADR/audit/roadmap, mentre gli ADR sono fisicamente creati nel repository sotto `audit/adr/`. Questo e accettabile come artifact iniziale, ma prima di `Accettato` va chiarito che il repository contiene bozze/versione sorgente operativa o export, mentre Confluence contiene la versione approvata e consultabile.

### Promesse non verificate

Verdict: valido con riserve.

Gli ADR usano quasi sempre formulazioni prescrittive ("deve", "prima della release candidate") e non dichiarano che build, package o compatibilita siano gia verificati. Questo e corretto.

Punti da trattare con cautela:

- ADR 0004 assume light/dark come contratto futuro, ma l'audit codice indica che il dark mode base richiede correzione.
- ADR 0005 definisce Expo come baseline primaria, ma va verificato con una app Expo pulita.
- ADR 0006 richiede package smoke test, ma non e ancora evidenza di packaging funzionante.

## Review per ADR

## ADR 0001 - Package Identity and Naming

Verdict: valido.

Problemi trovati:

- Nessun problema bloccante.
- Il nome npm finale resta intenzionalmente aperto. Questo e corretto, ma impedisce di accettare l'ADR come decisione completa di packaging.
- La policy "non usare naming ambiguo nei nuovi artefatti" e chiara, ma manca una regola esplicita su dove sono ammessi alias temporanei nel codice, non solo in docs/migrazione.

Correzioni consigliate:

- Prima di `Accettato`, aggiungere una decisione separata o un paragrafo operativo sul package name npm finale.
- Specificare che eventuali alias legacy pubblici devono avere deprecation notice, ticket Jira e milestone di rimozione.
- Chiarire se i nomi tema/branding possono conservare AURA in casi eccezionali o se il divieto e totale per nuovi artefatti pubblici.

Priorita: Media.

Dipendenze da audit codice:

- Audit dei riferimenti legacy: `@aura/ui`, `AURA`, `auraTokens`, docs import path, package metadata.
- Verifica consumer esistenti prima di rimuovere o deprecare alias.

## ADR 0002 - Public API Export Policy

Verdict: valido con riserve.

Problemi trovati:

- La policy e corretta, ma ancora non traduce la decisione in una export matrix concreta.
- "Hook progettati per uso consumer" e "utility con contratto consumer chiaro" sono criteri utili ma richiedono classificazione caso per caso.
- Il divieto di deep import e coerente, ma va supportato da package exports reali; altrimenti resta solo una regola documentale.

Correzioni consigliate:

- Aggiungere una matrice minima prima di `Accettato`: export pubblico, experimental, internal, deprecated.
- Definire esplicitamente quali aree entrano nella root API e quali richiedono subpath.
- Collegare la policy a test/package smoke che falliscano se un export documentato non e risolvibile.

Priorita: Alta.

Dipendenze da audit codice:

- Audit di `index.ts` e dei barrel exports.
- Audit dei deep import presenti in demo/docs.
- Verifica `package.json exports` e compatibilita Metro/TypeScript.

## ADR 0003 - Component Stability Classification

Verdict: valido.

Problemi trovati:

- La tassonomia e concreta e utilizzabile.
- Manca l'assegnazione iniziale dei componenti reali alle categorie.
- I criteri di test minimi sono corretti ma non ancora specificano il tipo di test richiesto per area, ad esempio render smoke, type tests, interaction tests o visual docs.

Correzioni consigliate:

- Collegare l'ADR alla component inventory prodotta dall'audit.
- Definire un primo elenco: stable/beta/experimental/internal/deprecated per ogni componente esportato.
- Rendere obbligatoria la rimozione dalla root API per componenti `internal` o `experimental` non dichiarati.

Priorita: Alta.

Dipendenze da audit codice:

- Verifica runtime dei componenti classificati come candidati `stable`.
- Audit dei componenti gia noti come rotti o ad alto rischio: `Card`, `ProgressBar`, `CodeInline`, `Textarea`.
- Verifica platform behavior di `SideBar`, `Tooltip`, `Popover`, `BottomSheet`, `ToastProvider`.

## ADR 0004 - Theme Token Architecture

Verdict: valido con riserve.

Problemi trovati:

- La direzione architetturale e corretta: primitive, semantic e component tokens.
- L'ADR afferma light/dark come contratto del theme system; questo non va interpretato come stato corrente verificato.
- La distinzione tra semantic tokens e component tokens e decisa, ma non e ancora mappata ai token reali.
- Il ruolo del `ThemeProvider` e corretto, ma va verificato contro il codice attuale, che puo contenere responsabilita app-shell.

Correzioni consigliate:

- Prima di `Accettato`, allegare una mappa token reale: primitive -> semantic -> component tokens.
- Rendere esplicito che il dark mode e un requisito da implementare/verificare, non una capacita gia garantita.
- Definire quali componenti devono essere bonificati per eliminare hardcoded values critici nel primo ciclo.

Priorita: Alta.

Dipendenze da audit codice:

- Verifica `ThemeProvider`, `createTheme`, `defaultTheme`, `tokens/*`.
- Verifica light/dark effettiva.
- Audit hardcoded values in componenti core, soprattutto Button, Input, Card, Navigation e Overlay.

## ADR 0005 - Expo and React Native Compatibility Baseline

Verdict: valido con riserve.

Problemi trovati:

- La baseline Expo/RN/TypeScript e chiara e coerente con il progetto.
- "Expo Go supportato quando possibile" e prudente, ma richiede criteri decisionali piu espliciti per nuove dipendenze native.
- L'ADR non distingue ancora tra dipendenze obbligatorie, peer, opzionali e dev-only.

Correzioni consigliate:

- Aggiungere una policy di dependency classification: peer, optional peer, dependency, devDependency.
- Definire un gate per nuove dipendenze native: motivazione, alternativa JS-only, impatto Expo Go, impatto prebuild.
- Richiedere smoke test su Expo managed prima di accettare compatibilita.

Priorita: Alta.

Dipendenze da audit codice:

- Audit `package.json` dependencies/peerDependencies.
- Verifica moduli nativi usati: safe area, AsyncStorage, clipboard, SVG/icons.
- Smoke test con app Expo pulita e controllo Metro.

## ADR 0006 - Build, Packaging and Release Strategy

Verdict: valido con riserve.

Problemi trovati:

- L'ADR copre i rischi reali: exports, types, peer dependencies, path alias, React duplicato.
- Non decide ancora il formato build finale in modo completo, ad esempio ESM-only vs condizioni aggiuntive.
- La compatibilita Metro e dichiarata come obiettivo, ma richiede verifica sull'export map e sugli artefatti generati.

Correzioni consigliate:

- Prima di `Accettato`, definire concretamente gli entrypoint package e le condition supportate.
- Aggiungere una checklist `npm pack --dry-run` con file attesi.
- Stabilire se i platform file `.web.tsx` devono restare risolvibili dal consumer o essere compilati in entrypoint separati.

Priorita: Alta.

Dipendenze da audit codice:

- Verifica `package.json main/types/exports/files`.
- Verifica `tsup.config.ts` e output `dist`.
- Build reale e typecheck dopo installazione dipendenze autorizzata o in CI.
- Smoke test di installazione/import da consumer.

## ADR 0007 - Documentation and Example App Strategy

Verdict: valido.

Problemi trovati:

- Nessun problema bloccante.
- La distinzione tra docs, example app e source of truth e corretta.
- Va chiarito meglio che la documentazione associata puo vivere in repository come sorgente, ma Confluence e il riferimento governance per ADR/audit/roadmap secondo ADR 0008.

Correzioni consigliate:

- Definire il set minimo di docs per promuovere un componente a `stable`.
- Specificare che example app e preview web devono importare solo entrypoint pubblici.
- Aggiungere una verifica automatica o manuale per evitare deep import nella demo.

Priorita: Media.

Dipendenze da audit codice:

- Audit docs esistenti per naming AURA e import path legacy.
- Audit demo/preview per deep import o uso di shim non dichiarati.
- Verifica che esempi stable riflettano API pubblica e non comportamento accidentale della demo.

## ADR 0008 - Migration Governance and Breaking Change Policy

Verdict: valido con riserve.

Problemi trovati:

- La sequenza consigliata e corretta e coerente con gli audit.
- La distinzione repository/Jira/Confluence e presente e utile.
- Va risolta la tensione operativa tra ADR markdown nel repository e Confluence come source of truth per ADR. Non e una contraddizione se il repository contiene draft/versioni sorgente, ma va esplicitato.
- La policy breaking change e corretta ma manca un formato minimo per changelog/migration note.

Correzioni consigliate:

- Specificare il flusso ADR: draft in repository, review, pubblicazione/sincronizzazione in Confluence, stato `Accettato`.
- Definire un template minimo per breaking change: cosa cambia, impatto, migration path, ticket, verifica.
- Richiedere che ogni modifica massiva abbia un epic o story Jira prima dell'implementazione.

Priorita: Alta.

Dipendenze da audit codice:

- Completamento audit read-only e classificazione componenti.
- Creazione backlog Jira derivato dai finding tecnici.
- Pubblicazione o sincronizzazione ADR/risk assessment su Confluence.

## Punti obbligatori prima di passare da Proposto ad Accettato

1. Confermare nome package npm finale e policy alias legacy.
2. Approvare export matrix pubblico/internal/experimental.
3. Classificare tutti i componenti reali con stato iniziale.
4. Verificare dark mode e architettura token sul codice reale.
5. Definire dependency policy Expo/RN e peerDependencies.
6. Eseguire build/typecheck/package smoke test in ambiente con dipendenze installate.
7. Verificare app Expo pulita come consumer.
8. Chiarire flusso repository -> Confluence per ADR e audit.
9. Generare backlog Jira dai finding critici.
10. Creare migration changelog iniziale.

## Conclusione

Gli ADR sono una buona baseline iniziale e non contengono promesse operative indebite se letti come `Proposto`. Non vanno promossi ad `Accettato` prima di completare audit codice, export matrix, component classification, package verification e validazione Expo/RN/TypeScript.

