# ADR 0004: Theme Token Architecture

## Stato

Proposto

## Contesto

Il theme/token system e parte centrale di `react-native-components`. Deve sostenere coerenza visuale, personalizzazione, supporto light/dark e scalabilita per componenti futuri.

Il codice esistente contiene tokens base, `ThemeProvider`, override e almeno un tema alternativo. Sono presenti anche valori hardcoded nei componenti legacy.

## Decisione

I tokens sono la base del design system.

Il modello deve distinguere:

- primitive tokens: valori base come colori grezzi, spacing numerico, radius, font size, z-index;
- semantic tokens: ruoli come `background`, `surface`, `textPrimary`, `border`, `error`;
- component tokens: valori specifici per componenti come button height, input radius, card padding.

Il `ThemeProvider` fornisce tema e modalita corrente, ma non deve assumere responsabilita eccessive di app shell. Wrapper come safe area, scroll container o layout applicativo devono essere opzionali o separati.

Light e dark mode sono parte del contratto del theme system. Se `mode` cambia, i colori e i semantic tokens devono cambiare coerentemente.

## Regole

- I componenti pubblici devono preferire semantic tokens e component tokens.
- Hardcoded values sono ammessi solo per dettagli locali non semantici e motivati.
- Ogni nuovo hardcoded value ricorrente deve diventare token.
- Gli override devono essere tipizzati e non rompere la struttura del tema.
- Un tema alternativo deve rispettare lo stesso contratto `Theme`.

## Confini MVP

Nel primo ciclo e sufficiente consolidare:

- primitive tokens esistenti;
- semantic tokens principali;
- light/dark funzionante;
- ThemeProvider pubblico;
- regole per ridurre hardcoded values.

I component tokens possono crescere progressivamente, partendo da Button, Input e Card.

## Conseguenze

La migrazione deve trattare i valori hardcoded dei componenti legacy come debito tecnico, non come modello da replicare.

I token pubblici fanno parte della API. Rinominare o rimuovere token pubblici e breaking change.

## Debiti noti

- Tokens incompleti per stati interattivi, accessibility e component variants.
- Alcuni componenti legacy duplicano size, spacing o radius.
- La documentazione visuale dei token non e ancora completa.
- Alcuni nomi token possono contenere riferimenti AURA legacy.

## Verifica

Prima della release candidate:

- light/dark mode verificati;
- token docs presenti;
- componenti stabili senza hardcoded values critici;
- override theme dimostrato con esempio;
- eventuali token legacy deprecati o rinominati con mapping.

## Risoluzione PLRNUI-59 per RC scope

Stato lifecycle: resta `Proposto`.

Decisione RC-scope registrata:

- Le precondizioni theme/token necessarie per entrare in PLRNUI-41 hardening sono
  sostanzialmente mitigate.
- `ThemeProvider` resta provider puro; `ThemeAppShell` possiede il layout
  opt-in.
- La persistenza theme resta opzionale, adapter-based e consumer-owned.

Evidenza:

- `audit/migration/breaking-change-register.md` registra BC-009 e BC-010 come
  implementati.
- PLRNUI-28 separa provider e app shell.
- PLRNUI-30, PLRNUI-31, PLRNUI-32 e PLRNUI-33 registrano i component token
  contract e la verifica degli override nested.
- `audit/risk-assessment/rc-risk-disposition-plrnui-59.md` registra RA 0004
  come mitigato per RC-hardening entry.

Blocco residuo:

- La stabilizzazione completa dei token/componenti e la promozione stable
  richiedono ancora owner review e prove di hardening successive.
