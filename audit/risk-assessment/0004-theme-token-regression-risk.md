# Risk Assessment 0004: Theme Token Regression Risk

## Stato

Proposto

## Rischio

La migrazione theme/tokens puo rompere light/dark mode, override tema, semantic tokens o componenti legacy che dipendono da valori hardcoded e token non consolidati.

## Contesto

ADR 0004 decide che i tokens sono base del design system e distingue primitive, semantic e component tokens. Stabilisce anche che light/dark e parte del contratto futuro.

La review segnala che light/dark non deve essere interpretato come gia verificato, che serve mappa token reale e che il ruolo del `ThemeProvider` va confrontato col codice, specialmente per responsabilita app-shell e hardcoded values.

## Cause probabili

- Dark mode dichiarato ma non implementato correttamente.
- Token legacy o naming AURA ancora pubblici.
- Componenti che duplicano spacing, radius, size o colori hardcoded.
- Override theme non tipizzati o non coperti da test. PLRNUI-33 riduce questo rischio per strutture nested verificando `colors`, `radius`, `size` e component tokens Button/Input/Card.
- `ThemeProvider` che mescola tema, safe area e layout applicativo.

## Impatto

- Consumer: temi custom non affidabili o regressioni visuali.
- Package: token pubblici difficili da rinominare senza breaking change.
- Documentazione: esempi theme/tokens non corrispondenti al comportamento reale.
- Sviluppo: ogni componente gestisce varianti e valori in modo diverso.
- Release: regressioni visuali difficili da intercettare.
- Governance: ADR theme non accettabile senza verifica codice.

## Probabilità

Alta.

## Severità

Alta.

## Mitigazioni

- Audit di `ThemeProvider`, `createTheme`, `defaultTheme`, `tokens/*` e temi alternativi.
- Definire mappa primitive -> semantic -> component tokens.
- Verificare light/dark con test o demo controllata.
- Identificare hardcoded values critici nei componenti core.
- Separare provider tema puro da wrapper app-shell se necessario.
- Documentare token legacy e deprecation path.

## Segnali di allarme

- Cambio `mode` senza cambio colori effettivo.
- Componenti stable con colori o dimensioni hardcoded non motivati.
- Override theme che richiede `any` o cast non sicuri. PLRNUI-33 rimuove il broad internal `any` dal merge path e documenta la policy per strutture invalide forzate oltre TypeScript.
- Docs che promettono component tokens non presenti.
- Token AURA legacy ancora esposti come API primaria.

## Verifica

- Light/dark verificato sul codice reale.
- Mappa token reale approvata.
- Component tokens minimi definiti per componenti core.
- Hardcoded values critici censiti e collegati a ticket.
- Theme override dimostrato con esempio consumer. PLRNUI-33 aggiunge test eseguibili per override nested e partial component overrides; esempi consumer completi restano parte della documentazione/release readiness.
- Docs theme/tokens allineate allo stato implementato.

## Collegamenti

- ADR collegati: ADR 0004.
- Review collegata: ADR 0004 richiede mappa token reale, verifica light/dark e audit hardcoded values prima di passare ad `Accettato`.
