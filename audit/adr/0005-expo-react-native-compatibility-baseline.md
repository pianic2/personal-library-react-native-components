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
