# 06 - Build and Packaging

## Current Build

- Build: `tsup`
- Output: `dist`
- Format: ESM
- Types: `dts: true`
- Sourcemaps: enabled
- Clean: enabled
- Package files: solo `dist`

## Expo / React Native Compatibility

Compatibilita potenziale:

- sorgenti sono React Native + React Native Web friendly;
- preview web usa alias Vite e shim;
- componenti usano `Platform.OS`;
- `SideBar.web.tsx` esiste per web-specific behavior.

Problemi:

- package export unico non dichiara condition `react-native`;
- non ci sono subpath exports;
- `main/types` non allineati a `dist`;
- peer dependencies non modellate;
- alcune implementazioni web usano DOM diretto (`div`, `window`) dentro file TSX della libreria;
- platform file `.web.tsx` potrebbe non essere preservato da `tsup` se importato da `./SideBar` e bundled in ESM unico.

## Verification Status

Non ho eseguito `npm run typecheck` o `npm run build` perche `node_modules` non e presente e la richiesta vieta installazione dipendenze senza autorizzazione.

## Findings

### Finding BLD-01

- File/percorso: `package.json:5-14`
- Problema: `files` include solo `dist`, ma `main`/`types` puntano a `index.ts`.
- Impatto: package pubblicato puo contenere riferimenti a file assenti; consumer legacy che ignorano `exports` falliscono.
- Severita: Critica
- Raccomandazione: allineare `main`/`types` a `dist` e verificare con `npm pack --dry-run`.

### Finding BLD-02

- File/percorso: `package.json:7-11`
- Problema: `exports` espone solo root ESM import; mancano condition `react-native`, `default`, eventuale `require`, e subpath exports.
- Impatto: compatibilita limitata con Metro, Jest, Node e consumer che vogliono import granulari.
- Severita: Alta
- Raccomandazione: definire export map con condition adatte a RN/Expo e subpath per `components`, `theme`, `tokens`, `hooks`.

### Finding BLD-03

- File/percorso: `tsup.config.ts:10-18`
- Problema: external list incompleta e contiene `expo-secure-store` non usato/non dichiarato.
- Impatto: bundle non deterministico rispetto alle dipendenze native; rischio di includere moduli che dovrebbero restare peer.
- Severita: Alta
- Raccomandazione: generare external list dalle peer dependencies o mantenerla manualmente allineata.

### Finding BLD-04

- File/percorso: `components/feedback/ToastProvider.tsx:180-194`
- Problema: file libreria contiene `<div>` per web dentro componente RN.
- Impatto: TypeScript/tsup puo richiedere DOM typings e React DOM assumptions; native bundler potrebbe dover parseare JSX DOM anche se branch runtime e web-only.
- Severita: Media
- Raccomandazione: usare componenti RN compatibili o separare implementazione `.web.tsx`.

### Finding BLD-05

- File/percorso: `components/navigation/SideBar.tsx`, `components/navigation/SideBar.web.tsx`, `tsup.config.ts:4-7`
- Problema: esiste implementazione `.web.tsx`, ma il build ha entry unico e non documenta preservazione platform-specific.
- Impatto: consumer web potrebbero ricevere la versione null se il bundler risolve gia l'import durante build.
- Severita: Alta
- Raccomandazione: verificare output `dist` e, se necessario, preservare moduli/platform extensions o creare entrypoint web esplicito.

### Finding BLD-06

- File/percorso: `preview-web/vite.config.ts:93-112`, `tsconfig.preview.json:58-64`
- Problema: preview web funziona grazie ad alias e shim locali non presenti nel package pubblicato.
- Impatto: la preview puo nascondere incompatibilita che i consumer incontrano senza la stessa config.
- Severita: Media
- Raccomandazione: documentare requisiti Metro/Vite o includere setup guide per Expo/RN Web.

