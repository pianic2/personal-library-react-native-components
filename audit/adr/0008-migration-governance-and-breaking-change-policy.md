# ADR 0008: Migration Governance and Breaking Change Policy

## Stato

Proposto

## Contesto

La migrazione da AURA / UI Experience a `react-native-components` tocca naming, API pubblica, component stability, theme/tokens, packaging, docs e release process.

Senza governance, il rischio e mescolare rename, bugfix, refactor e breaking changes in modifiche massive non tracciabili.

## Decisione

La migrazione deve essere controllata e tracciabile.

Source of truth:

- repository: codice, test, package config, examples;
- Confluence: ADR, risk assessment, audit, roadmap;
- Jira: backlog operativo, task, spike, bug e stato del lavoro.

Il refactor deve essere preceduto da audit e decisioni. Nessuna modifica massiva deve avvenire senza ticket, motivazione e criterio di verifica.

Ogni breaking change deve essere esplicito, documentato e collegato a una decisione o ticket.

## Sequenza consigliata

1. Audit read-only.
2. Classificazione componenti.
3. Definizione API pubblica.
4. Cleanup naming.
5. Packaging.
6. Docs.
7. Test.
8. Release candidate.

## Breaking Change Policy

Sono breaking changes:

- cambio package name o import path;
- rimozione o rename di export pubblici;
- cambio incompatibile di props;
- cambio struttura theme/token pubblica;
- rimozione di alias legacy;
- cambio peer dependency rilevante.

Ogni breaking change deve avere:

- motivazione;
- impatto consumer;
- alternativa o migration path;
- ticket Jira;
- nota changelog;
- verifica.

## Confini MVP

La baseline iniziale non completa la migrazione. Serve a rendere decidibile il lavoro successivo.

Nel MVP di governance sono richiesti:

- ADR iniziali;
- audit tecnico;
- backlog Jira derivato;
- pagina Confluence di risk assessment;
- changelog di migrazione iniziale.

## Conseguenze

Il team puo procedere in modo incrementale, distinguendo bugfix, hardening, rename e release. Le decisioni restano difendibili e consultabili.

## Debiti noti

- Serve formalizzare i ticket Jira a partire dagli audit.
- Serve pubblicare o sincronizzare gli ADR in Confluence.
- Serve definire owner e priorita per componenti critici.
- Serve decidere la finestra di rimozione degli alias legacy.

## Verifica

Prima della release candidate:

- audit e ADR collegati in Confluence;
- backlog Jira creato e prioritizzato;
- breaking changes elencati nel changelog;
- matrice componenti approvata;
- API pubblica approvata;
- package smoke test completato.

