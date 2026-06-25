# Legacy Naming Map - AURA / UI Experience -> personal-library-react-native-components

## Stato

Governance aggiornata da PLRNUI-17 dopo la decisione di naming canonico.
Le voci distinguono identita legacy, target canonici, simboli API/token e
riferimenti storici da preservare.

## Regole

- Repository/project identity canonica: `personal-library-react-native-components`.
- Package npm canonico: `@personal-library/react-native-components`.
- AURA, aura, `@aura/ui` e UI Experience sono identita legacy/storiche.
- `react-native-components` e legacy/ambiguo quando usato come vecchia identita
  abbreviata; resta ammesso come riferimento storico Jira o descrizione
  generica solo se il contesto lo chiarisce.
- New consumer-facing imports must use `@personal-library/react-native-components`.
- Legacy aliases are historical only unless an owner explicitly documents a
  temporary migration alias with reason, scope and removal policy.
- Any remaining legacy name must have reason, owner/context and
  removal/containment policy.
- Naming cleanup must be traceable through implementation tickets, not hidden in
  governance updates.
- ADR and Risk Assessment documents remain `Proposto` unless owner approval is
  explicitly present.
- Non si dichiara rinominato alcun simbolo senza audit codice o ticket.
- Dove manca evidenza, usare `unknown` o `requires audit`.

| Nome legacy | Nuovo nome candidato | Tipo | Stato | Note | Verifica codice richiesta |
| --- | --- | --- | --- | --- | --- |
| AURA | `personal-library-react-native-components`; package imports use `@personal-library/react-native-components` | branding/import placeholder | historical-only | Nome storico del progetto. Ammesso in audit/migrazione o evidenza storica; non valido come identita corrente o import consumer. Owner/context: migration governance. Removal/containment: cleanup tramite ticket espliciti per superfici non storiche. | Search repository/docs per nuovi usi non storici |
| aura | `@personal-library/react-native-components` where used as package/import prose | package/import prose | historical-only | Variante legacy lower-case. Non introdurre come alias. Owner/context: migration governance. Removal/containment: eliminare da docs/demo/repo wording tramite ticket naming dedicati. | Audit README/docs/demo/examples |
| UI Experience | `personal-library-react-native-components` | branding | historical-only | Nome storico/descrittivo; non deve essere nuovo nome canonico. Owner/context: migration governance. Removal/containment: preservare solo come storia/audit. | Search repository/docs |
| `@aura/ui` | `@personal-library/react-native-components` | package | removed/historical-only | Il package canonico e deciso. `@aura/ui` resta solo evidenza storica o eventuale alias temporaneo se approvato separatamente con deprecation window. | Audit `package.json`, consumer e registry policy |
| `react-native-components` as old/ambiguous identity | `personal-library-react-native-components` | repository/project wording | migration-only | Usare il nome repository completo per identita corrente. L'abbreviazione resta ammessa in contesto storico Jira o descrizione generica non identitaria. | Search repo/audit per contesto |
| `AURA` in README/docs | `@personal-library/react-native-components` for imports; `Personal Library React Native Components` for product prose | docs | historical-only outside PLRNUI-48 cleanup | PLRNUI-48 owns consumer-facing docs cleanup. In audit resta storico. | Audit docs e README |
| `AURA` in mkdocs/site metadata | `personal-library-react-native-components` / `Personal Library React Native Components` | docs metadata | historical-only outside PLRNUI-48 cleanup | PLRNUI-48 owns consumer-facing MkDocs cleanup. In audit resta storico. | Audit `mkdocs.yml` e docs config |
| `auraTokens` | `defaultThemeTokens` | symbol | remove | PLRNUI-29 removes the public/root legacy token name now; no deprecated alias is provided. | `src/index.ts`, `src/tokens/index.ts`, `tests/theme/token-public-api.test.tsx` |
| `getAuraTokens` | `createThemeTokens` | symbol | remove | PLRNUI-29 removes the public/root legacy token accessor now; no deprecated alias is provided. | `src/index.ts`, `src/tokens/index.ts`, `tests/theme/token-public-api.test.tsx` |
| `TokensSnapshot` | `ThemeTokens` | type | remove | PLRNUI-29 removes the snapshot-named public type now; no deprecated alias is provided. | `src/index.ts`, `src/tokens/index.ts`, `tests/theme/token-public-api.test.tsx` |
| `[ui/Button]` warning prefix | `[react-native-components/Button]` o prefisso package finale | symbol | rename | Candidate per messaggi runtime, non urgente senza API decision | Audit console warnings e log prefixes |
| `UI_THEME_MODE` | key namespaced per `react-native-components` | symbol | unknown | Storage key legacy/generica; migrazione va valutata per compatibilita | Audit theme storage e persistenza esistente |
| `packages/ui` | package directory finale da decidere | package | keep temporarily | Origine storica nel monorepo; non rinominare senza piano repo | Audit monorepo reale e path consumer |
| `ui` directory/path comments | react-native-components naming o path reale | docs | requires audit | Commenti o path interni possono essere obsoleti | Search commenti sorgente/docs |
| Liquid Glass theme branding | Liquid Glass | theme | keep temporarily | Branding tema separato dal nome progetto; non necessariamente legacy AURA | Audit se contiene riferimenti AURA |
| AURA visual branding | theme/preset dedicato o removed branding | theme | unknown | ADR 0001 ammette branding visuale separato, ma non decide il caso AURA | Richiede decisione prodotto e audit temi |
| AURA references in Confluence pages | react-native-components con storico AURA | docs | rename | Confluence deve indicare AURA come storico, non nome canonico | Verifica durante RNC-11 |
| AURA references in Jira tickets | react-native-components con storico AURA | docs | rename | Ticket nuovi devono usare nome canonico; riferimenti storici ammessi nel contesto | Verifica backlog Jira |

## Stati ammessi

- keep temporarily: mantenere temporaneamente con motivazione e futura verifica.
- rename: rinominare in ticket dedicato.
- deprecate: mantenere come legacy con deprecation esplicita.
- remove: rimuovere quando non serve compatibilita.
- unknown: richiede decisione o audit prima di definire azione.
- requires audit: evidenza insufficiente; non agire senza verifica.

## Verifiche richieste

- Search repository per `AURA`, `aura`, `@aura/ui`, `UI Experience`, `auraTokens`, `getAuraTokens`.
- Audit package metadata.
- Audit README, docs e example app.
- Audit exports pubblici e token names.
- PLRNUI-17 records naming governance only; it does not modify package metadata,
  runtime source, public exports, token symbols, generated files or
  consumer-facing docs.
- PLRNUI-29 removes public token naming aliases now; consumer-facing docs/policy coordination remains PLRNUI-53.
- Collegamento di ogni rename effettivo a Jira e changelog.
