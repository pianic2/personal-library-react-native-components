# ADR 0005: Expo and React Native Compatibility Baseline

## Stato

Proposto

## Contesto

`react-native-components` deve essere una libreria React Native + Expo. I consumer principali saranno app Expo/React Native, con possibile uso web tramite React Native Web.

Le dipendenze native sono costose: possono rompere Expo Go, richiedere prebuild, duplicare runtime o introdurre vincoli non evidenti.

## Decisione

Expo e la baseline primaria di compatibilita. React Native e il runtime target. TypeScript e obbligatorio per sorgenti e tipi pubblici.

La libreria non deve introdurre nuove dipendenze native non controllate senza ADR o decisione tecnica esplicita.

Le dipendenze host devono essere modellate come peer dependencies quando appartengono al runtime consumer, in particolare React e React Native. Dipendenze native opzionali devono essere documentate e isolate.

Expo Go deve essere supportato quando possibile. Il prebuild e ammesso solo quando una funzionalita richiede moduli nativi non disponibili in Expo Go e la scelta e stata approvata.

Baseline latest-stable selezionata per PLRNUI-42:

- Expo SDK: `56.0.0`
- React Native: `0.85`
- React: `19.2.3`
- Node minimo: `22.13.x`

Questa baseline deriva dalla latest stable Expo SDK baseline. Versioni beta, canary, RC o preview non sono ammesse come fonte di compatibilita.

## Garanzie

La libreria deve evitare:

- React duplicato;
- React Native duplicato;
- moduli nativi installati implicitamente senza documentazione;
- assunzioni su router o app shell del consumer;
- uso di API web-only in componenti native senza separazione platform.

## Confini MVP

Il primo baseline supporta:

- React Native;
- Expo managed workflow dove possibile;
- TypeScript declaration output;
- React Native Web solo per componenti dichiarati compatibili.

Non tutti i componenti devono supportare tutte le piattaforme nel primo ciclo, ma il supporto deve essere dichiarato.

## Conseguenze

Ogni nuova dipendenza nativa richiede verifica su:

- Expo Go;
- managed workflow;
- prebuild;
- Metro;
- package peer/dependency policy;
- impatto su consumer.

## Debiti noti

- La dependency policy attuale puo dover essere rivista.
- Alcuni componenti hanno behavior web-only o native-null.
- La preview web puo usare shim non equivalenti al consumer reale.

## Verifica

Prima della release candidate:

- smoke app Expo pulita importa il package;
- Metro risolve gli entrypoint pubblici;
- TypeScript consumer vede i tipi;
- nessuna dipendenza nativa nuova senza decisione;
- peer dependencies documentate.

## Risoluzione PLRNUI-59 per RC scope

Stato lifecycle: resta `Proposto`.

Decisione RC-scope registrata:

- La baseline Expo/RN e sufficiente per entrare in PLRNUI-41 hardening.
- Non e sufficiente per tagliare/pubblicare un RC artifact.
- RA 0005 e accettato/tracciato solo come residuale di hardening entry:
  Expo Go, native device runtime, prebuild e custom dev client non sono ancora
  provati.

Evidenza:

- `package.json` dichiara `engines.node >=22`, `react >=19.2.3 <20.0.0` e
  `react-native >=0.85.0 <0.86.0`.
- `audit/release/expo-metro-consumer-validation-plrnui-58.md` prova Expo web /
  Metro export dal tarball.
- `audit/release/native-runtime-validation.md` dichiara esplicitamente che
  Expo Go, native device runtime, prebuild e custom dev client restano
  non provati.
- `audit/risk-assessment/rc-risk-disposition-plrnui-59.md` registra RA 0005
  come `TRACKED CONDITION / ACCEPTED RESIDUAL FOR HARDENING ENTRY ONLY`.

Blocco residuo:

- PLRNUI-60 / PLRNUI-41 deve chiudere la decisione native-runtime prima di
  qualsiasi RC artifact publication.
