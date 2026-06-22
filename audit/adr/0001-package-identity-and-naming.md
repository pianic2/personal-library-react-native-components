# ADR 0001: Package Identity and Naming

## Stato

Proposto

## Contesto

Il progetto nasce nel monorepo `my-rn-stack`, package `packages/ui`, con identita storica AURA / UI Experience. Questa identita descriveva una UI interna o un'esperienza visuale proprietaria, ma non chiariva che il progetto deve diventare una libreria React Native + Expo riusabile, pubblicabile e documentabile.

La migrazione verso `react-native-components` non e un rename cosmetico. Serve a separare il progetto da una singola app, rendere esplicita la natura di libreria componenti e preparare API, package, documentazione, versionamento e governance.

## Decisione

Il nome canonico del progetto e `react-native-components`.

AURA e UI Experience sono nomi storici e deprecati. Possono comparire solo in documentazione di migrazione, changelog, ADR, audit e mapping legacy. Non devono essere usati come nome canonico in nuovi artefatti tecnici.

Distinguiamo quattro livelli di naming:

- Nome progetto: `react-native-components`.
- Nome package npm: da definire prima del publish, coerente con `react-native-components` e con eventuale scope proprietario.
- Namespace interno: deve evitare riferimenti AURA nei nuovi moduli pubblici.
- Branding visuale: puo esistere come tema o preset, ma non deve condizionare package identity o API pubblica.

Il repository puo mantenere temporaneamente riferimenti legacy solo quando servono per compatibilita o migrazione progressiva. Ogni riferimento legacy mantenuto deve avere una motivazione e, se pubblico, una strategia di deprecazione.

## Confini MVP

Nel primo ciclo non e richiesto rinominare ogni file sorgente o simbolo esistente. E richiesto invece definire la regola: ogni nuovo artefatto decisionale, Jira, Confluence, docs di migrazione e release plan usa `react-native-components` come nome canonico.

## Conseguenze

I futuri ticket di cleanup naming devono distinguere tra:

- rename obbligatori prima del publish;
- alias temporanei per compatibilita;
- riferimenti storici consentiti solo in audit/migrazione;
- branding visuale eventualmente mantenuto come tema o preset.

Il rename potra generare breaking changes, soprattutto su package name, import path, token name e documentazione.

## Debiti noti

- Il package attuale puo ancora contenere `@aura/ui`, `AURA`, `auraTokens` o riferimenti equivalenti.
- Il nome npm finale deve essere deciso e tracciato separatamente.
- Serve un mapping legacy -> nuovo nome per documentazione, changelog e consumer.

## Verifica

Prima della release candidate:

- package metadata coerente con il nome finale;
- README e docs senza naming ambiguo;
- migration guide con riferimenti AURA/UI Experience solo come storico;
- eventuali alias legacy esplicitamente deprecati.

