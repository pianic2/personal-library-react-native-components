# ADR 0007: Documentation and Example App Strategy

## Stato

Proposto

## Contesto

`react-native-components` e un prodotto tecnico. La documentazione non e un accessorio: serve a rendere componenti, theme, tokens, installazione e limiti platform consumabili da altri progetti.

Il repository contiene docs e una preview/demo app. Questi strumenti devono supportare la libreria, non sostituirsi alla API e ai contratti sorgente.

## Decisione

La documentazione e parte del prodotto.

La example app deve comportarsi come consumer reale della libreria, usando solo API pubbliche documentate. Non deve dipendere da moduli interni, path profondi o shim non dichiarati come requisito.

La source of truth del comportamento resta:

- codice libreria;
- tipi pubblici;
- test;
- documentazione associata.

La demo app non e source of truth del comportamento dei componenti.

## Contenuti minimi docs

Per componenti `stable`:

- descrizione tecnica;
- props principali;
- esempi minimi;
- platform support;
- accessibility notes se rilevanti;
- stati visuali principali;
- limiti noti.

Per theme/tokens:

- uso `ThemeProvider`;
- override;
- light/dark;
- primitive/semantic/component tokens;
- esempi di custom theme.

Per installazione:

- peer dependencies;
- Expo setup;
- React Native Web setup se supportato;
- troubleshooting Metro/TypeScript.

## Confini MVP

Nel primo ciclo la docs deve coprire solo componenti e API dichiarati stabili o beta. Componenti experimental possono comparire in una sezione separata con warning esplicito.

## Conseguenze

Ogni componente promosso a `stable` deve avere documentazione minima. La demo deve essere aggiornata quando cambia la API pubblica.

## Debiti noti

- Alcuni esempi possono riflettere AURA o demo interna.
- La docs potrebbe non distinguere ancora stable/beta/experimental.
- La preview web usa shim che possono nascondere requisiti reali.

## Verifica

Prima della release candidate:

- docs naming aggiornato a `react-native-components`;
- example app usa entrypoint pubblici;
- ogni componente stable ha pagina o sezione minima;
- theme/tokens documentati;
- troubleshooting packaging/Expo presente.

## Risoluzione PLRNUI-59 per RC scope

Stato lifecycle: resta `Proposto`.

Decisione RC-scope registrata:

- La documentazione consumer e sufficiente per entrare in PLRNUI-41 hardening.
- La documentazione non prova native device runtime e non promuove componenti a
  `stable`.
- Repository audit docs restano source tecnico; Confluence resta publication /
  summary layer; Jira resta workflow / decision tracking layer.

Evidenza:

- `README.md` punta al package canonico e vieta deep import consumer.
- Consumer docs ed esempi sono elencati nel README e usano il root package.
- `audit/release/plrnui-12-senior-rc-readiness-review.md` registra docs
  remediation e residui non bloccanti per hardening.
- `audit/risk-assessment/rc-risk-disposition-plrnui-59.md` registra RA 0007
  come `TRACKED CONDITION`.

Blocco residuo:

- La pubblicazione/sintesi Confluence e il tracking Jira non sono eseguiti in
  PLRNUI-59; restano owner-controlled.
