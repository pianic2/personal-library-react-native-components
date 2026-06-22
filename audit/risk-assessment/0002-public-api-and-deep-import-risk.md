# Risk Assessment 0002: Public API and Deep Import Risk

## Stato

Proposto

## Rischio

Moduli interni possono diventare API pubblica accidentale oppure consumer, demo e docs possono usare deep import non garantiti. Questo rende refactor e packaging futuri breaking changes non controllati.

## Contesto

ADR 0002 decide che la API pubblica deve passare da entrypoint controllati e che i deep import da cartelle interne non sono parte del contratto. ADR 0006 richiede entrypoint package coerenti. ADR 0007 richiede che example app usi solo API pubbliche documentate.

La review segnala che la policy non e ancora tradotta in export matrix concreta, che il divieto di deep import deve essere supportato da package exports reali e che demo/docs devono essere auditati.

## Cause probabili

- Barrel exports troppo ampi.
- Assenza di export matrix pubblico/internal/experimental.
- Demo o docs che importano file interni.
- Package exports che espongono solo root o espongono troppo.
- Tipi props non esportati, che spingono i consumer verso deep import.

## Impatto

- Consumer: dipendenze da path interni instabili.
- Package: export map difficile da restringere senza major release.
- Documentazione: esempi non riproducibili in consumer reali.
- Sviluppo: refactor interni bloccati da utilizzi accidentali.
- Release: breaking changes nascosti.
- Governance: impossibile distinguere bugfix da rotture di contratto.

## Probabilità

Alta.

## Severità

Alta.

## Mitigazioni

- Creare export matrix con stati `public`, `experimental`, `internal`, `deprecated`.
- Definire root exports e subpath exports supportati.
- Vietare deep import in docs/demo tramite review o check dedicato.
- Esportare tipi props per componenti pubblici.
- Documentare esplicitamente gli entrypoint consentiti.
- Collegare ogni rimozione export a changelog e Jira.

## Segnali di allarme

- Import in docs/demo da `components/...`, `theme/...`, `tokens/...` non passanti da entrypoint pubblici.
- Consumer che richiedono path profondi per accedere a tipi.
- Export root che include storage, shim, helper o componenti experimental.
- Package smoke test che passa solo nel repo ma fallisce da consumer pulito.

## Verifica

- Export matrix approvata.
- `package.json exports` coerente con la matrice.
- Docs e demo importano solo entrypoint pubblici.
- Componenti internal/experimental non sono nella root stable API.
- Smoke test consumer verifica import documentati.
- Breaking changes da export rimossi documentati.

## Collegamenti

- ADR collegati: ADR 0002, ADR 0006, ADR 0007.
- Review collegata: ADR 0002 richiede export matrix e audit dei barrel/deep import; ADR 0006 richiede verifica exports/Metro/TypeScript; ADR 0007 richiede example app su API pubbliche.

