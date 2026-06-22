# 00 - Project Map

## Scope

Audit statico della directory corrente per preparare la migrazione da AURA / UI Experience a `react-native-components`.

Non sono stati modificati file sorgente. Non sono state installate dipendenze.

## Directory Structure

```text
.
├── components/
│   ├── feedback/
│   ├── form/
│   ├── layout/
│   ├── navigation/
│   ├── overlay/
│   ├── surfaces/
│   └── typography/
├── demo/
│   ├── app/
│   └── screens/
├── docs/
│   ├── components/
│   ├── storage/
│   ├── theme/
│   ├── tokens/
│   └── utils/
├── hooks/
├── preview-web/
│   └── shims/
├── storage/
├── theme/
├── themes/
│   └── liquidglass/
├── tokens/
├── types/
├── utils/
├── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.ui.json
├── tsconfig.preview.json
├── tsup.config.ts
└── mkdocs.yml
```

## Main Packages / Modules

- `components/*`: componenti UI React Native organizzati per categoria.
- `theme/*`: `ThemeProvider`, `useTheme`, `createTheme`, storage modalita tema.
- `tokens/*`: palette, spacing, radius, typography, shadow, z-index e snapshot tokens.
- `themes/liquidglass/*`: tema alternativo token-only.
- `hooks/*`: hook generici (`useBreakpoint`, `useDebounce`, `useToggle`, `useIsMounted`).
- `utils/*`: helper per classnames, platform, safe area, merge styles, clipboard.
- `storage/*`: interfaccia e implementazioni storage token web/native.
- `demo/*` e `preview-web/*`: preview web Vite con shim per librerie native.
- `docs/*` e `mkdocs.yml`: documentazione MkDocs.

## Entrypoints

- Entrypoint sorgente pubblico: `index.ts`.
- Entrypoint build configurato: `tsup.config.ts` con `entry: ["index.ts"]`.
- Entrypoint package dichiarato:
  - `package.json` `exports["."].import`: `./dist/index.mjs`.
  - `package.json` `exports["."].types`: `./dist/index.d.mts`.
  - `package.json` `main` e `types`: ancora `index.ts`.

## Public Exports

`index.ts` esporta:

- `components/navigation`
- `components/layout`
- `components/typography`
- `components/feedback`
- `components/overlay`
- `components/surfaces`
- `components/form`
- `Button`
- `hooks`
- `utils`
- `storage`
- `tokens`
- `theme`
- `themes`

La API pubblica e molto ampia: include componenti, utility, hook, token snapshot, theme provider, temi sperimentali e storage type.

## Example App / Docs

- `preview-web/`: app Vite per visualizzare il demo via React Native Web.
- `demo/`: schermate demo per foundations, layout, forms, feedback e componenti.
- `docs/`: documentazione MkDocs gia organizzata per componenti, token, theme, storage e utility.

## Build Configurations

- `tsup.config.ts`: ESM-only, declaration generation, sourcemap, clean.
- `tsconfig.json`: configurazione base TypeScript con `module` e `moduleResolution` `nodenext`.
- `tsconfig.ui.json`: typecheck libreria, esclude `preview-web` e `demo`.
- `tsconfig.preview.json`: typecheck preview/demo con alias verso shim web.
- `preview-web/vite.config.ts`: alias `react-native` -> `react-native-web`, shim per clipboard, safe area e async storage.

## Findings

### Finding PM-01

- File/percorso: `package.json:2-10`, `README.md:1-23`, `mkdocs.yml:1-3`, `tokens/index.ts:2`
- Problema: il progetto e ancora identificato come AURA (`@aura/ui`, descrizione AURA, docs AURA, import docs `aura`, token `auraTokens`) mentre l'obiettivo e `react-native-components`.
- Impatto: rischio alto di pubblicare package, docs e API con naming legacy; la migrazione produrra breaking changes nominali non tracciati.
- Severita: Alta
- Raccomandazione: creare una fase Jira dedicata di rename contrattuale con elenco esplicito di package name, import path, docs, token alias e compatibilita temporanea.

### Finding PM-02

- File/percorso: `index.ts:5-28`
- Problema: la root API esporta quasi tutto, inclusi temi sperimentali, storage, hook e utility.
- Impatto: ogni modulo esportato diventa contratto pubblico; qualunque cleanup durante la migrazione diventa breaking change.
- Severita: Alta
- Raccomandazione: definire una matrice public/internal prima del rename e introdurre entrypoint stabili per componenti, theme e tokens.

### Finding PM-03

- File/percorso: `package.json:5-14`
- Problema: `main` e `types` puntano ai sorgenti TypeScript, mentre `exports` punta a `dist`.
- Impatto: consumer e tool diversi possono risolvere entrypoint diversi; pubblicazione npm non affidabile.
- Severita: Alta
- Raccomandazione: allineare `main`, `types`, `module` ed `exports` agli artefatti `dist` generati.

