# ADR 0006: Build, Packaging and Release Strategy

## Stato

Proposto

## Contesto

La libreria deve essere consumabile localmente e potenzialmente pubblicabile. Build e packaging devono funzionare per TypeScript, Metro, Expo e consumer React Native.

I rischi principali sono exports rotti, types mancanti, path alias non risolti, dipendenze duplicate e React duplicato.

## Decisione

La build deve produrre artefatti JavaScript e declaration files TypeScript da entrypoint controllati.

Il package deve dichiarare entrypoint coerenti con gli artefatti generati. `package.json` deve evitare riferimenti a sorgenti TypeScript non inclusi nel package pubblicato.

La strategia di release deve includere:

- build TypeScript;
- output types;
- export map controllata;
- compatibilita Metro;
- smoke test da consumer pulito;
- versioning semantico;
- changelog di migrazione.

Il package deve essere consumabile sia localmente, ad esempio workspace o file link, sia come artefatto pubblicabile.

## Garanzie

Ogni release candidate deve verificare:

- `build` completato;
- declaration files presenti;
- root import funzionante;
- subpath exports, se presenti, funzionanti;
- nessun alias interno richiesto al consumer;
- peer dependencies coerenti;
- nessun React duplicato.

## Rischi noti

- `exports` che punta a file non generati.
- `types` che punta a sorgenti non pubblicati.
- path alias presenti nel sorgente ma non nel consumer.
- dipendenze native bundled per errore.
- platform extensions risolte in modo sbagliato durante build.

## Conseguenze

Il publish non deve essere trattato come semplice upload npm. Deve essere una pipeline verificabile con smoke test.

## Debiti noti

- La configurazione packaging attuale deve essere auditata e corretta prima del publish.
- Serve decidere se mantenere ESM-only o offrire ulteriori condizioni di export.
- Serve validare come vengono gestiti file `.web.tsx` e platform-specific.

## Verifica

Checklist release candidate:

- `npm run typecheck`;
- `npm run build`;
- `npm pack --dry-run`;
- installazione in app Expo pulita;
- import root e import documentati;
- render smoke di componenti stabili;
- controllo duplicazione React/RN.

