# Risk Assessment 0008: Breaking Change Governance Risk

## Stato

Proposto

## Rischio

Rename, refactor, cleanup API e packaging possono essere mescolati senza changelog, ticket Jira, migration path o verifica, rendendo la migrazione non tracciabile e difficile da validare.

## Contesto

ADR 0008 decide una migrazione controllata, con repository come source of truth per codice/test/package/examples, Confluence per ADR/risk assessment/audit/roadmap e Jira per backlog operativo. ADR 0001, ADR 0002 e ADR 0006 introducono decisioni che possono produrre breaking changes.

La review segnala che serve chiarire il flusso repository -> Confluence per ADR, definire un template breaking change e creare backlog Jira dai finding prima di modifiche massive.

## Cause probabili

- Rename e refactor applicati nello stesso ticket.
- Breaking changes non elencati in changelog.
- ADR in repository non sincronizzati con Confluence.
- Ticket Jira troppo grandi o non verificabili.
- Cleanup exports senza migration path.
- Release candidate senza package smoke test.

## Impatto

- Consumer: rotture non anticipate e migration path assente.
- Package: versionamento semantico non rispettato.
- Documentazione: ADR, roadmap e changelog non allineati.
- Sviluppo: review difficile, rollback complesso.
- Release: scope instabile e criteri di uscita ambigui.
- Governance: Jira, Confluence e repository divergono.

## Probabilità

Alta.

## Severità

Alta.

## Mitigazioni

- Separare ticket per audit, classificazione, API, naming, packaging, docs, test e release.
- Richiedere changelog di migrazione per ogni breaking change.
- Usare template breaking change con impatto, migration path, ticket e verifica.
- Sincronizzare ADR/risk assessment approvati su Confluence.
- Collegare ogni modifica massiva a epic/story Jira.
- Bloccare `Accettato` per ADR che dipendono da audit o smoke test non completati.

## Segnali di allarme

- PR o commit che rinomina e refactora molte aree senza ticket.
- ADR promossi ad `Accettato` senza verifica codice.
- Changelog assente o generico.
- Ticket Jira senza acceptance criteria verificabili.
- Confluence non aggiornata dopo decisioni in repo.
- Release candidate senza elenco breaking changes.

## Verifica

- Backlog Jira derivato da audit e risk assessment.
- ADR/risk assessment pubblicati o sincronizzati in Confluence secondo flusso deciso.
- Ogni breaking change ha ticket, impatto, migration path e verifica.
- Changelog di migrazione iniziale creato.
- Sequenza audit -> classificazione -> API -> naming -> packaging -> docs -> test -> release candidate rispettata.
- Release candidate bloccata se package smoke test o consumer verification mancano.

## Collegamenti

- ADR collegati: ADR 0008, ADR 0001, ADR 0002, ADR 0006.
- Review collegata: ADR 0008 richiede flusso repository/Confluence e template breaking change; ADR 0001 richiede policy alias; ADR 0002 richiede export matrix; ADR 0006 richiede package verification prima della release.

