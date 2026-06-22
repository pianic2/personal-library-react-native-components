# Risk Assessment 0006: Packaging and Consumer Installation Risk

## Stato

Proposto

## Rischio

Il package puo buildare localmente ma fallire quando installato in un consumer pulito per problemi di `exports`, `types`, `files`, peer dependencies, path alias o risoluzione platform-specific.

## Contesto

ADR 0006 decide che build e packaging devono produrre artefatti TypeScript/JavaScript consumabili da Metro, Expo e consumer React Native. ADR 0005 richiede compatibilita con il runtime Expo/RN.

La review segnala che il formato build finale, gli entrypoint package, le condition supportate e la gestione dei file `.web.tsx` richiedono verifica concreta prima di accettare l'ADR.

## Cause probabili

- `main`, `types`, `exports` o `files` non allineati.
- Declaration files mancanti o puntati a sorgenti non pubblicati.
- Peer dependencies incomplete o runtime duplicati.
- Path alias risolti solo nel repo.
- Platform extensions risolte durante build invece che dal consumer.
- `npm pack` non verificato.

## Impatto

- Consumer: import falliti, tipi mancanti, React duplicato, Metro errors.
- Package: artefatto pubblicato non consumabile.
- Documentazione: install guide non riproducibile.
- Sviluppo: bug scoperti tardi fuori dal monorepo.
- Release: rollback o patch urgente.
- Governance: release candidate promossa senza evidenza tecnica.

## Probabilità

Alta.

## Severità

Critica.

## Mitigazioni

- Definire entrypoint e export map prima della release.
- Allineare `main`, `types`, `exports`, `files` agli artefatti generati.
- Eseguire `npm pack --dry-run` e verificare file inclusi.
- Installare il pacchetto in consumer pulito Expo/RN.
- Verificare root import, subpath import documentati e TypeScript declarations.
- Controllare duplicazione React/RN.

## Segnali di allarme

- Package pubblicato o packato senza `dist` coerente.
- Consumer richiede alias locali del repo.
- TypeScript consumer non trova declaration files.
- Metro non risolve entrypoint o platform file.
- `node_modules` contiene copie duplicate di React o React Native.

## Verifica

- `npm run typecheck` completato in ambiente con dipendenze.
- `npm run build` completato.
- `npm pack --dry-run` controllato.
- Installazione in app consumer pulita completata.
- Import documentati verificati.
- TypeScript consumer vede i tipi.
- Nessuna duplicazione React/RN rilevata.

## Collegamenti

- ADR collegati: ADR 0006, ADR 0005.
- Review collegata: ADR 0006 richiede entrypoint concreti, package smoke e verifica `.web.tsx`; ADR 0005 richiede smoke test Expo/RN.

