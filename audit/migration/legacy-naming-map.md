# Legacy Naming Map - AURA / UI Experience -> react-native-components

## Stato

Iniziale. Le voci indicano mapping candidati e richiedono audit codice dove segnalato.

## Regole

- `react-native-components` e il nome progetto canonico proposto.
- AURA / UI Experience sono nomi storici/deprecati.
- Non si dichiara rinominato alcun simbolo senza audit codice o ticket.
- Dove manca evidenza, usare `unknown` o `requires audit`.

| Nome legacy | Nuovo nome candidato | Tipo | Stato | Note | Verifica codice richiesta |
| --- | --- | --- | --- | --- | --- |
| AURA | react-native-components | branding | deprecate | Nome storico del progetto; ammesso in contesto migrazione/audit | Search repository/docs per nuovi usi non storici |
| UI Experience | react-native-components | branding | deprecate | Nome storico/descrittivo; non deve essere nuovo nome canonico | Search repository/docs |
| `@aura/ui` | package npm finale coerente con `react-native-components` | package | unknown | Il nome npm finale non e ancora deciso | Audit `package.json`, consumer e registry policy |
| `aura` | package import finale | import path | unknown | Compare come esempio legacy possibile; mapping dipende dal nome npm finale | Audit README/docs/demo |
| `AURA` in README/docs | react-native-components | docs | rename | Da usare solo come storico nella migration guide | Audit docs e README |
| `AURA` in mkdocs/site metadata | react-native-components | docs | rename | Candidate se presente in site name/description/repo URL | Audit `mkdocs.yml` e docs config |
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
- PLRNUI-29 removes public token naming aliases now; consumer-facing docs/policy coordination remains PLRNUI-53.
- Collegamento di ogni rename effettivo a Jira e changelog.
