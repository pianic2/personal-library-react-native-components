# 04 - API Surface

## Current Public API

Root export `index.ts` pubblica:

- tutti i componenti navigation/layout/typography/feedback/overlay/surfaces/form;
- `Button`;
- tutti gli hook;
- tutte le utility esportate da `utils/index.ts`;
- storage type;
- token snapshot;
- theme provider/hook/storage;
- tutti i temi in `themes`.

## Public API Concerns

La superficie e piu ampia della maturita effettiva dei moduli. Alcuni componenti sono prototipali o rotti, ma sono gia esportati dalla root.

## Should Remain Public

Candidati a API pubblica stabile dopo hardening:

- Theme: `ThemeProvider`, `useTheme`, `createTheme`, `Theme`, `ThemeMode`
- Tokens: colori/spacing/radius/typography/zIndex/size con naming nuovo
- Layout: `Box`, `Row`, `Column`, `Stack`, `Divider`
- Typography: `Text`, `Heading`, `P`, `B`, `Small`, `Quote`, `TextGroup`
- Core components: `Button`, `Card`, `Badge`, `Spinner`
- Form base: `Input`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `FormField` solo dopo stabilizzazione props

## Should Be Internal or Separate

- `storage/tokenStorage*`: responsabilita auth/app, non UI.
- `theme/themeStorage`: puo restare interno al provider o diventare adapter configurabile.
- `useThemeContext`: meglio interno; `useTheme` e la API utente.
- `useOptionalNav`: probabilmente interno a navigation components.
- `Tooltip`, `Popover`, `BottomSheet`, `ToastProvider`: da pubblicare solo dopo definizione platform behavior.
- `themes/liquidglass`: sperimentale; meglio entrypoint separato o flag "experimental".
- `utils/cn`: poco utile in React Native se non esiste className strategy pubblica.
- `utils/useBreakpoint.ts`: duplicato concettuale di `hooks/useBreakpoint.ts` e non esportato da `utils/index.ts`.

## Probable Breaking Changes

- Rename package `@aura/ui` -> `react-native-components` o scope equivalente.
- Rename import docs da `aura`/`AURA` a nuovo package.
- Rename `auraTokens` / `getAuraTokens`.
- Rimozione o spostamento storage auth.
- Restrizione root exports.
- Cambio props per `Input`, `PasswordInput`, `Textarea`, `FormField`.
- Separazione `ThemeProvider` puro da app wrapper.
- Stabilizzazione di platform-specific exports (`SideBar.web.tsx`).

## Findings

### Finding API-01

- File/percorso: `index.ts:5-28`
- Problema: root export espone moduli a maturita disomogenea.
- Impatto: la migrazione dovra trattare anche prototipi e utility interne come API pubblica, aumentando il costo dei breaking changes.
- Severita: Alta
- Raccomandazione: introdurre una matrice API pubblica con stati `stable`, `experimental`, `internal`; poi applicare entrypoint/subpath coerenti.

### Finding API-02

- File/percorso: `theme/index.ts:5-7`
- Problema: `ThemeProvider`, `themeStorage`, `useTheme` e tipi sono esportati insieme; `themeStorage` diventa API pubblica anche se e dettaglio di persistenza.
- Impatto: blocca future modifiche dello storage o namespace senza breaking change.
- Severita: Media
- Raccomandazione: esporre solo provider/hook/tipi; spostare storage in entrypoint esplicito o interno.

### Finding API-03

- File/percorso: `components/navigation/index.ts:2-7`
- Problema: esporta anche hook/context navigation interni e componenti platform-sensitive.
- Impatto: consumer possono dipendere da implementazioni non stabilizzate (`useOptionalNav`, `SideBar` null su native).
- Severita: Media
- Raccomandazione: separare API navigation pubblica (`NavProvider`, `NavBar`, `Link`) da hooks interni o documentare contratti.

### Finding API-04

- File/percorso: component files vari, es. `components/Button.tsx:10-17`, `components/form/Input.tsx:14-22`
- Problema: molti props interface/type non sono esportati.
- Impatto: consumer TypeScript non possono importare tipi props per wrapper e composizione.
- Severita: Media
- Raccomandazione: esportare `ButtonProps`, `InputProps`, ecc. per componenti stabili.

### Finding API-05

- File/percorso: `storage/index.ts:1`
- Problema: lo storage esporta solo `TokenStorage`, non `tokenStorage`; le implementazioni `.web`/`.native` non sono raggiungibili dalla root API.
- Impatto: API storage incompleta e confusa: sembra pubblica ma non utilizzabile direttamente.
- Severita: Media
- Raccomandazione: rimuovere storage dalla UI root oppure definire un export platform-aware esplicito.

