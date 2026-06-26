# PLRNUI-9 - Expo/RN/Metro Troubleshooting Outline

## Scopo

Outline minimo per una futura guida troubleshooting. Non e una guida completa e non applica fix. Deve restare coerente con PLRNUI-8, dove il clean Expo consumer install falliva per mismatch del peer React.

## 1. Clean Expo consumer install

- Creare una app Expo pulita fuori dal repository.
- Installare il package/tarball pubblicabile, non importare da path repo-local.
- Verificare che l'installazione npm passi senza `--force` o `--legacy-peer-deps`.
- Verificare root import da entrypoint pubblico approvato.
- Registrare versione Expo, React, React Native, Node e npm.

Nota PLRNUI-8: il consumer Expo pulito usava `react@19.2.3`, mentre `@aura/ui@1.0.0` richiedeva peer `react@^19.2.4`; l'installazione falliva con `ERESOLVE`.

## 2. Peer dependency React/Expo/RN

- Controllare `react` richiesto dal package.
- Controllare React installato dal template Expo.
- Controllare React Native installato dal template Expo.
- Verificare che React Native sia app-owned e non duplicato.
- Usare `npm ls react react-native` nel consumer.
- Aprire gap packaging se npm rileva peer mismatch o duplicati.

## 3. Metro resolver

- Validare import dal package root.
- Non usare alias Vite come prova Metro.
- Non usare `../../index`, `src/*`, `dist/*`, `packages/ui/src/*`.
- Verificare export map e subpath realmente dichiarati in `package.json`.
- Registrare errori Metro come blocker packaging/API quando impediscono root import.

## 4. TypeScript module resolution

- Verificare che `exports["."].types` punti a declaration generata.
- Verificare che top-level `types` non confonda toolchain consumer.
- Non documentare subpath se non esistono in package exports.
- Registrare errori `Cannot find module` o missing declarations.

## 5. Native runtime limitations

- Safe Area: `react-native-safe-area-context` deve essere presente e compatibile.
- AsyncStorage: `@react-native-async-storage/async-storage` deve essere presente se API/theme path lo richiede.
- Clipboard: `expo-clipboard` richiede compatibilita Expo SDK.
- Icons/SVG: `lucide-react-native` richiede `react-native-svg`.
- Se Expo Go non supporta una dependency/versione, documentare prebuild/custom dev client.

## 6. Deep import vietati

Esempi da vietare nei consumer examples:

- `../../index`
- `../../theme/types`
- `src/*`
- `dist/*`
- `packages/ui/src/*`
- subpath non dichiarati nel package export map

Consentire solo entrypoint pubblici approvati e documentati.

## 7. Preview/demo shim

- Documentare che `preview-web/vite.config.ts` usa alias e shim.
- Separare preview web da consumer Expo/RN.
- Non usare preview success come prova di package install, Metro, Expo Go o native runtime.
- Elencare shim Safe Area, AsyncStorage, Clipboard, Lucide/SVG.

## PLRNUI-51 linkage

Consumer-facing preview runtime limits are documented in
`docs/preview-runtime-limits.md`.

Preview shim success does not close Expo/RN runtime risk. In particular, Vite
preview does not prove:

- clean package install in an external Expo/RN app;
- Metro package root or export-map resolution;
- generated TypeScript declaration resolution in a consumer project;
- native Safe Area, AsyncStorage, Clipboard, SVG/icon, iOS, Android, Hermes,
  Expo Go, prebuild or custom dev-client behavior;
- absence of duplicate React or React Native copies in a consumer app.

Troubleshooting and release validation must continue to use real Expo/RN
consumer checks. `preview-web/shims/**`, Vite aliases and repo-local imports are
not consumer API and must not appear in copy-pasteable consumer examples.

## 8. Errori noti

- `npm ERR! ERESOLVE unable to resolve dependency tree`: possibile mismatch peer React/Expo/RN.
- Metro cannot resolve package root: export map/package artifact issue.
- TypeScript cannot find declarations: `types`/declaration artifact issue.
- Missing native module: native dependency non installata o non compatibile.
- Works in preview, fails in Expo: probabile shim/alias preview che maschera runtime reale.

## 9. Quando aprire ticket packaging/API

Aprire ticket quando:

- clean install fallisce;
- `npm ls react react-native` mostra duplicati o incompatibilita;
- root import fallisce;
- TypeScript declarations non risolvono;
- Metro non risolve package/export;
- docs richiedono import non pubblici;
- native dependency e richiesta da API root senza policy;
- demo usa internals come consumer examples;
- shim preview sono necessari ma non documentati.

## PLRNUI-52 materialization

PLRNUI-52 materializes this outline into real consumer-facing documentation at
`docs/expo-rn-metro-troubleshooting.md`.

The docs page now covers:

- clean Expo consumer install flow;
- React / Expo / React Native peer dependency alignment;
- the PLRNUI-8 peer React mismatch (`react@19.2.3` in the consumer versus
  historical `@aura/ui@1.0.0` peer `react@^19.2.4`);
- Metro resolver troubleshooting;
- TypeScript module resolution troubleshooting;
- native runtime limitations;
- strict deep-import bans for `src`, `dist`, repository-relative paths,
  unpublished package subpaths and preview/shim internals;
- the boundary between Vite preview/browser docs runtime and Expo/RN/Metro
  consumer runtime;
- preview/demo shims as docs/demo-only browser compatibility layers;
- known errors and canonical responses;
- when to open a packaging/API blocker ticket.

The docs page explicitly discourages `--force` and `--legacy-peer-deps` as final
consumer setup. They are mentioned only as temporary diagnostic bypasses.

PLRNUI-52 does not change runtime source, package metadata, package exports or
dependency policy. It documents troubleshooting expectations and preserves real
Expo/RN validation as a separate release gate.
