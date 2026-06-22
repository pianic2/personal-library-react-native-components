# Risk Assessment 0003: Component Stability Misclassification Risk

## Stato

Proposto

## Rischio

Componenti beta, experimental, internal o con bug noti possono essere promossi come `stable` senza test, documentazione, tipi o compatibilita platform sufficiente.

## Contesto

ADR 0003 introduce le categorie `stable`, `beta`, `experimental`, `internal`, `deprecated` e chiarisce che la presenza nel codice non implica API pubblica stabile. ADR 0007 richiede docs minime per componenti stabili.

La review segnala che manca l'assegnazione iniziale dei componenti reali alle categorie e che componenti ad alto rischio come `Card`, `ProgressBar`, `CodeInline`, `Textarea` e componenti web/native-specific richiedono audit codice prima di qualsiasi promozione.

## Cause probabili

- Componenti esportati dalla root senza classificazione.
- Demo che mostra un componente come pronto anche se non e stabile.
- Assenza di test minimi per render, props, interazioni e platform behavior.
- Props non esportate o tipizzate con `any`.
- Comportamento web-only non dichiarato.

## Impatto

- Consumer: uso di componenti non maturi e rotture runtime.
- Package: API stabile contaminata da componenti sperimentali.
- Documentazione: componenti presentati senza limiti noti.
- Sviluppo: debito nascosto e difficile da prioritizzare.
- Release: regressioni visibili in componenti core.
- Governance: classificazione non difendibile in Jira/Confluence.

## Probabilità

Alta.

## Severità

Alta.

## Mitigazioni

- Creare una component maturity matrix derivata dall'audit.
- Assegnare stato iniziale a ogni componente esportato.
- Bloccare promozione a `stable` senza docs, props tipizzate, support matrix e smoke test.
- Spostare componenti `experimental` in entrypoint esplicito o fuori dalla root API.
- Collegare bug noti a ticket Jira prima di release candidate.

## Segnali di allarme

- Componenti rotti o parziali documentati come stabili.
- Nessuna pagina docs per un componente esportato come stabile.
- Props `any` o tipi props non esportati.
- Componenti che renderizzano null su una piattaforma senza warning documentale.
- Demo che usa componenti non classificati.

## Verifica

- Tutti i componenti hanno stato iniziale.
- Componenti `stable` hanno docs, props type, support matrix e smoke test.
- Componenti con bug noti non sono `stable`.
- Componenti `experimental` sono chiaramente separati.
- Jira contiene ticket per bug/blocker dei componenti candidati stable.

## Collegamenti

- ADR collegati: ADR 0003, ADR 0007.
- Review collegata: ADR 0003 richiede classificazione reale e verifica runtime; ADR 0007 richiede docs minime ed example coerente con API pubblica.

