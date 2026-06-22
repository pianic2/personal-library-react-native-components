# 05 - Dependencies

## Dependency Inventory

Runtime dichiarate in `dependencies`:

- `@react-native-async-storage/async-storage`
- `expo-clipboard`
- `lucide-react`
- `lucide-react-native`
- `react-dom`
- `react-native`
- `react-native-safe-area-context`
- `react-native-svg`
- `react-native-web`
- `tsup`
- `typescript`
- `ui`

Peer dichiarate:

- `react`

Dev dichiarate:

- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `vite`

## Internal Usage

- `react-native`: usato in quasi tutti i componenti.
- `react-native-safe-area-context`: usato da `ThemeProvider`.
- `@react-native-async-storage/async-storage`: usato da `theme/themeStorage.ts` e `storage/tokenStorage.native.ts`.
- `expo-clipboard`: import dinamico in `utils/clipboard.ts`.
- `lucide-react-native`: usato da componenti (`Button` icon prop generic, `Checkbox`, `Select`, `Code`, `SideBar.web`).
- `lucide-react`: usato solo tramite alias preview/typecheck web.
- `react-native-web`, `react-dom`, `vite`: preview web.
- `tsup`, `typescript`: build/dev.
- `ui`: nessun import trovato nel sorgente auditato.

## Findings

### Finding DEP-01

- File/percorso: `package.json:24-39`
- Problema: solo `react` e peer; runtime RN/Expo/Web sono in `dependencies`.
- Impatto: consumer Expo/RN possono ricevere installazioni duplicate o versioni non allineate di `react-native`, `react-native-web`, `react-dom`, `react-native-svg`.
- Severita: Alta
- Raccomandazione: spostare runtime host in `peerDependencies` e tenerli in `devDependencies` per sviluppo locale.

### Finding DEP-02

- File/percorso: `package.json:37-38`
- Problema: `tsup` e `typescript` sono in `dependencies`.
- Impatto: aumenta peso installazione consumer e mescola toolchain con runtime.
- Severita: Media
- Raccomandazione: spostarli in `devDependencies`.

### Finding DEP-03

- File/percorso: `package.json:39`
- Problema: dipendenza `ui` dichiarata ma non usata da import statici.
- Impatto: dipendenza opaca, rischio collisioni naming e supply-chain inutile.
- Severita: Media
- Raccomandazione: verificare con lockfile e rimuovere se non necessaria.

### Finding DEP-04

- File/percorso: `tsup.config.ts:10-18`, `package.json:28-35`
- Problema: `tsup` externalizza `react`, `react-native`, `react-native-safe-area-context`, `lucide-react-native`, `expo-secure-store`; non externalizza `@react-native-async-storage/async-storage`, `expo-clipboard`, `react-native-svg`, `react-dom`, `react-native-web`. Inoltre `expo-secure-store` non e in `package.json`.
- Impatto: bundle potenzialmente include o risolve male dipendenze Expo/RN; external inesistente segnala config drift.
- Severita: Alta
- Raccomandazione: allineare `external` alle peer dependencies reali; rimuovere `expo-secure-store` o aggiungerlo solo se usato.

### Finding DEP-05

- File/percorso: `theme/themeStorage.ts:62-89`, `storage/tokenStorage.native.ts:2-24`
- Problema: AsyncStorage e requisito runtime anche per funzioni theme/storage.
- Impatto: un consumer che vuole solo componenti base deve comunque gestire dipendenza native storage.
- Severita: Media
- Raccomandazione: rendere storage adapter opzionale o spostarlo in entrypoint separato.

### Finding DEP-06

- File/percorso: `utils/clipboard.ts:19-31`
- Problema: `expo-clipboard` e importato dinamicamente e fallisce silenziosamente.
- Impatto: su ambienti non Expo la API non garantisce comportamento; difficile per consumer sapere il requisito.
- Severita: Bassa
- Raccomandazione: documentare peer opzionale o fornire adapter clipboard configurabile.

