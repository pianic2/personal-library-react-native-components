# Risk Assessment 0007: Documentation Drift Risk

## Stato

Proposto

## Rischio

Docs, example app e codice possono divergere: la demo puo usare API interne, shim o comportamenti non documentati, mentre la documentazione puo mostrare import legacy o componenti non stabili.

## Contesto

ADR 0007 decide che la documentazione e parte del prodotto e che example app deve comportarsi come consumer reale della libreria. ADR 0002 richiede entrypoint pubblici controllati.

La review segnala che docs/demo devono essere auditati per naming AURA, deep import, shim non dichiarati e differenza tra source of truth della libreria e demo.

## Cause probabili

- Docs generate o aggiornate separatamente dal codice.
- Example app che importa file interni invece di entrypoint pubblici.
- Preview web che usa shim locali non rappresentativi.
- Componenti experimental documentati come stable.
- Naming AURA legacy in esempi o pagine docs.

## Impatto

- Consumer: setup copiato dalla docs ma non funzionante.
- Package: API interna usata come se fosse pubblica.
- Documentazione: perdita di fiducia e migrazione confusa.
- Sviluppo: demo passa anche quando consumer reale fallisce.
- Release: release notes incomplete o esempi rotti.
- Governance: Confluence, repo e Jira divergono sullo stato reale.

## Probabilità

Media.

## Severità

Alta.

## Mitigazioni

- Audit docs e demo per import path e naming.
- Richiedere che example app usi solo entrypoint pubblici.
- Documentare shim preview e non confonderli con setup consumer.
- Collegare docs di componenti alla classificazione stable/beta/experimental.
- Aggiornare docs come parte della Definition of Done dei componenti stabili.
- Verificare esempi principali in consumer pulito o preview equivalente.

## Segnali di allarme

- Docs con import AURA o path interni.
- Demo funzionante ma package consumer fallisce.
- Componenti senza stato di stabilita nella docs.
- Shim preview necessari ma non documentati.
- Confluence e repository riportano roadmap o rischi divergenti.

## Verifica

- Docs naming aggiornato a `react-native-components`.
- Example app importa solo API pubbliche.
- Componenti stable hanno docs minime.
- Componenti beta/experimental sono etichettati.
- Shim e limiti preview sono documentati.
- Troubleshooting Expo/RN/Metro presente e verificato.

## Collegamenti

- ADR collegati: ADR 0007, ADR 0002.
- Review collegata: ADR 0007 richiede audit docs/demo e chiarimento repository/Confluence; ADR 0002 richiede divieto deep import supportato da entrypoint reali.

