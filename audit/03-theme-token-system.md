# 03 - Theme / Token System

## Theme Model

Il modello espone:

- `ThemeProvider`
- `useTheme`
- `createTheme`
- `themeStorage`
- `Theme` / `ThemeMode`
- tokens base via `theme.space`, `theme.spacing`, `theme.radius`, `theme.typography`, `theme.shadows`, `theme.zIndex`, `theme.size`
- tema alternativo `liquidglass`

La struttura e promettente, ma oggi mescola tema, layout app-level, storage persistente e token legacy AURA.

## Tokens

Token presenti:

- Colors: `lightColors`, `darkColors`, `resolveColors`
- Spacing: scala numerica e alias semantici `space`
- Radius: `none`, `xs`, `sm`, `md`, `lg`, `xl`, `full`
- Typography: family, size, lineHeight, weight
- Shadows: shadow RN + elevation
- zIndex: base/dropdown/sticky/overlay/modal/toast/tooltip
- Size: height xs/sm/md/lg
- Snapshot: `auraTokens`, `getAuraTokens`

## Scalability Assessment

Punti buoni:

- token base isolati per file;
- `createTheme` permette override parziali;
- `liquidglass` dimostra estendibilita con `materials.glass`;
- `Theme` include `globalStyles`, `screens` e `components`.

Limiti:

- dark mode base non funziona;
- `Theme` type importa `size` come valore, non type-only;
- `components` token e parziale e non usato dai componenti principali;
- hardcoded values diffusi nei componenti;
- `auraTokens` e naming legacy nell'API pubblica;
- `ThemeProvider` gestisce anche app shell.

## Hardcoded Values

Esempi rilevanti:

- `Button`: height/padding/icon size duplicano `tokens/size.base.ts`.
- `Card`: `radius = 14` fuori scala token.
- `Hero`: `height - 80`.
- `Input`: marker 10x10, border radius 5, `- 2.5`.
- `Switch`, `Checkbox`, `RadioGroup`: dimensioni native hardcoded.
- `TopBar`, `BottomBar`, `SideBar`: width/height/minWidth/zIndex fallback hardcoded.
- `Tooltip`, `Modal`, `BottomSheet`: dimensioni e delay hardcoded.

## Findings

### Finding THM-01

- File/percorso: `theme/defaultTheme.tsx:13-17`, `theme/defaultTheme.tsx:46-49`
- Problema: `createBaseTheme(mode)` salva `mode`, ma imposta sempre `colors: lightColors`.
- Impatto: `ThemeProvider` puo passare a `dark`, ma i colori restano light. Dark mode base non funzionante.
- Severita: Critica
- Raccomandazione: usare `resolveColors(mode)` o selezionare `darkColors` quando `mode === "dark"`.

### Finding THM-02

- File/percorso: `theme/ThemeProvider.tsx:37-113`
- Problema: il provider tema include `SafeAreaProvider`, `SafeAreaView` e `ScrollView`.
- Impatto: il tema impone layout e provider app-level, difficile da integrare in app Expo con provider gia esistenti.
- Severita: Alta
- Raccomandazione: rendere `ThemeProvider` puro e spostare safe-area/scroll wrapper in un componente app-shell opzionale.

### Finding THM-03

- File/percorso: `tokens/index.ts:2`, `tokens/snapshot.ts:110-112`
- Problema: snapshot token pubblici usano naming `auraTokens` / `getAuraTokens`.
- Impatto: breaking change certo nella migrazione; mantenere il nome vecchio indebolisce il nuovo posizionamento.
- Severita: Alta
- Raccomandazione: introdurre alias nuovo (`componentTokens`, `getComponentTokens` o nome deciso) con deprecation esplicita degli alias AURA.

### Finding THM-04

- File/percorso: `theme/types.ts:35-66`, componenti vari
- Problema: `Theme.components` e definito ma quasi nessun componente lo usa; i componenti leggono direttamente token base o valori hardcoded.
- Impatto: scalabilita limitata per variants/size/component theming.
- Severita: Media
- Raccomandazione: decidere se supportare component tokens; in caso positivo, farli diventare fonte primaria per Button/Input/Card.

### Finding THM-05

- File/percorso: `theme/createTheme.ts:5-25`
- Problema: `deepMerge` usa `any` e clona superficialmente oggetti readonly token.
- Impatto: override complessi non sono tipizzati in modo sicuro; rischio regressioni silenziose su strutture nested.
- Severita: Media
- Raccomandazione: limitare il contratto di override, tipizzare meglio il merge o usare una utility controllata con test.

### Finding THM-06

- File/percorso: `theme/themeStorage.ts:66-89`
- Problema: storage key `UI_THEME_MODE` e ancora generica/legacy.
- Impatto: collisioni possibili tra package/app o migrazioni; difficile gestire namespace `react-native-components`.
- Severita: Bassa
- Raccomandazione: namespacizzare la key e gestire migrazione da key legacy.

