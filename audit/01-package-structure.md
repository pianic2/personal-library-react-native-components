# 01 - Package Structure

## Current Package Identity

- Name: `@aura/ui`
- Version: `1.0.0`
- Description: `AURA - AURA UI React Architecture`
- Package files: solo `dist`
- Public export: solo root export `.`
- Build script: `npm run build` -> `tsup`
- Typecheck script: `npm run typecheck`

## Reusability Assessment

Il package ha una struttura da libreria riusabile, ma non e ancora pronto per pubblicazione robusta come `react-native-components`.

Punti positivi:

- Barrel root presente (`index.ts`).
- Build ESM con declaration files.
- Preview/demo separati dalla build UI.
- Tokens e theme system separati dai componenti.

Blocchi principali:

- naming package e docs legacy;
- entrypoint package incoerenti;
- peer dependencies incomplete;
- dipendenze runtime e dev mischiate;
- API pubblica troppo ampia;
- assenza di subpath exports;
- typecheck/build non verificabili senza installazione dipendenze.

## Package.json

### Finding PKG-01

- File/percorso: `package.json:2-4`
- Problema: package name e descrizione sono ancora `@aura/ui` / AURA.
- Impatto: il package non rappresenta il nuovo posizionamento `react-native-components`; pubblicazione o linking interno rischiano di consolidare il naming sbagliato.
- Severita: Alta
- Raccomandazione: pianificare rename controllato in Jira con eventuale periodo di alias/deprecation se esistono consumer.

### Finding PKG-02

- File/percorso: `package.json:5-10`
- Problema: `main` e `types` puntano a `index.ts`, mentre `exports` punta a `dist/index.mjs` e `dist/index.d.mts`.
- Impatto: Node, bundler, TypeScript e Metro possono risolvere artefatti diversi. In pubblicazione, `files: ["dist"]` esclude `index.ts`, quindi `main/types` diventano riferimenti a file non inclusi.
- Severita: Critica
- Raccomandazione: puntare `main`, `module`, `types` ed `exports` solo a `dist`; validare con `npm pack --dry-run` prima della pubblicazione.

### Finding PKG-03

- File/percorso: `package.json:24-39`
- Problema: `react-native`, `react-native-web`, `react-dom`, `react-native-svg`, `react-native-safe-area-context`, `lucide-react-native`, `@react-native-async-storage/async-storage` sono in `dependencies`; solo `react` e peer.
- Impatto: una libreria RN/Expo puo installare versioni duplicate o incompatibili di runtime host. React Native e React DOM dovrebbero essere peer/dev nella maggior parte dei casi.
- Severita: Alta
- Raccomandazione: definire peerDependencies per runtime host (`react`, `react-native`, eventualmente `react-dom`, `react-native-web`, `react-native-safe-area-context`, `react-native-svg`) e tenere in dependencies solo runtime realmente bundled/necessari.

### Finding PKG-04

- File/percorso: `package.json:37-39`
- Problema: tool di build (`tsup`, `typescript`) e dipendenza sospetta `ui` sono in `dependencies`.
- Impatto: i consumer installano strumenti di sviluppo non necessari; `ui` puo introdurre accoppiamenti o collisioni nominali non volute.
- Severita: Media
- Raccomandazione: spostare toolchain in `devDependencies` e verificare se `ui` e usata. Se non ci sono import, rimuoverla in una fase dedicata.

## Tsconfig

### Finding PKG-05

- File/percorso: `tsconfig.json:15-25`
- Problema: `include` contiene `ui`, directory non presente nella mappa del progetto.
- Impatto: segnale di migrazione incompleta da vecchio layout; puo nascondere assunzioni obsolete negli script.
- Severita: Bassa
- Raccomandazione: rimuovere o sostituire dopo aver deciso il layout finale del package.

### Finding PKG-06

- File/percorso: `tsconfig.ui.json:35-37`, `tsconfig.preview.json:58-64`
- Problema: typecheck preview usa alias verso shim web; typecheck UI mappa `lucide-react-native` a `lucide-react`.
- Impatto: il typecheck puo passare in preview ma non rappresentare fedelmente l'ambiente native/Expo reale.
- Severita: Media
- Raccomandazione: separare chiaramente typecheck library-native e preview-web, e documentare quali alias sono solo demo.

## Improper App Coupling

### Finding PKG-07

- File/percorso: `theme/ThemeProvider.tsx:37-113`
- Problema: `ThemeProvider` include opzionalmente `SafeAreaProvider`, `SafeAreaView` e `ScrollView`, quindi decide layout applicativo oltre al tema.
- Impatto: una libreria componenti impone wrapper app-level e puo entrare in conflitto con navigator, Expo Router o provider safe-area gia presenti.
- Severita: Alta
- Raccomandazione: separare provider tema puro da wrapper applicativi opzionali, mantenendo eventuali wrapper in entrypoint demo/app-shell.

### Finding PKG-08

- File/percorso: `storage/tokenStorage.ts`, `storage/tokenStorage.native.ts`, `storage/tokenStorage.web.ts`
- Problema: storage token auth e incluso nel package UI.
- Impatto: accoppiamento improprio con esigenze applicative di autenticazione; aumenta superficie API e responsabilita non UI.
- Severita: Alta
- Raccomandazione: spostare storage auth fuori dal package componenti o renderlo package separato; mantenere nella UI solo storage necessario al tema.

