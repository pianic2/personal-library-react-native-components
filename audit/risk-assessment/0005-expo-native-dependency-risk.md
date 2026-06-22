# Risk Assessment 0005: Expo Native Dependency Risk

## Stato

Proposto

## Rischio

Dipendenze native non governate possono rompere Expo Go, managed workflow, Metro o installazioni consumer pulite, oppure imporre prebuild senza decisione esplicita.

## Contesto

ADR 0005 decide Expo come baseline primaria, React Native come runtime target e TypeScript come requisito. ADR 0006 richiede packaging compatibile con consumer reali.

La review segnala che serve una dependency classification chiara e un gate per nuove dipendenze native, inclusa verifica su Expo managed e consumer pulito.

## Cause probabili

- Dipendenze native inserite in `dependencies` invece che peer/optional peer.
- Moduli come safe area, AsyncStorage, clipboard, SVG o icons non classificati.
- Preview web con shim che nasconde requisiti nativi reali.
- Assenza di test su Expo Go o app Expo pulita.
- Introduzione di moduli che richiedono prebuild senza ADR.

## Impatto

- Consumer: installazione fallita, Metro errors, native module missing.
- Package: peer/dependency policy instabile.
- Documentazione: setup Expo incompleto o fuorviante.
- Sviluppo: bug riproducibili solo fuori dal repo.
- Release: release candidate non installabile da consumer.
- Governance: dipendenze native aggiunte senza decisione tracciata.

## Probabilità

Media.

## Severità

Alta.

## Mitigazioni

- Classificare dipendenze come peer, optional peer, dependency o devDependency.
- Richiedere ADR o ticket tecnico per ogni nuova dipendenza native.
- Preferire soluzioni JS-only quando compatibili con requisiti.
- Documentare quando Expo Go e supportato e quando serve prebuild.
- Smoke test su app Expo pulita prima di release candidate.
- Verificare Metro resolution senza shim locali non documentati.

## Segnali di allarme

- Nuova dipendenza native senza ticket o ADR.
- Consumer deve modificare configurazioni native non documentate.
- App Expo Go fallisce per native module missing.
- Preview funziona solo grazie a shim locali.
- Package installa versioni duplicate di runtime native.

## Verifica

- Dependency policy approvata.
- Elenco dipendenze native e opzionali documentato.
- App Expo managed pulita importa e renderizza componenti stabili.
- Expo Go support verificato o limitazione documentata.
- Prebuild richiesto solo da funzionalita approvata.
- Metro risolve package ed entrypoint senza config nascosta.

## Collegamenti

- ADR collegati: ADR 0005, ADR 0006.
- Review collegata: ADR 0005 richiede dependency classification e smoke test Expo managed; ADR 0006 richiede package smoke e compatibilita Metro/TypeScript.

