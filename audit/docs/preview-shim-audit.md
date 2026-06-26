# PLRNUI-9 - Preview Shim Audit

## Scopo

Inventariare shim, alias, wrapper e workaround usati dalla preview web. L'obiettivo e distinguere cio che valida la demo web da cio che non valida un consumer Expo/RN reale.

Questo file registra gap; non modifica preview, demo o config.

## Tabella shim/workaround

| Path | Shim/workaround | Ruolo | Documentato | Rischio | Raccomandazione |
| --- | --- | --- | --- | --- | --- |
| `preview-web/vite.config.ts:13-14` | `react-native` -> `react-native-web` | Permette alla preview Vite di risolvere primitive RN su web. | partial | Medium | Documentare come preview-only, non come prova Metro consumer. |
| `preview-web/vite.config.ts:16-18` | `react-native-safe-area-context` -> `preview-web/shims/react-native-safe-area-context.tsx` | Sostituisce Safe Area nativa con wrapper/no-op web. | no | High | Documentare che non valida inset/device behavior o runtime nativo. |
| `preview-web/vite.config.ts:20-22` | `@react-native-async-storage/async-storage` -> `preview-web/shims/async-storage.ts` | Sostituisce AsyncStorage con `localStorage`. | no | High | Documentare differenza da AsyncStorage native/Expo. |
| `preview-web/vite.config.ts:24-25` | `expo-clipboard` -> `preview-web/shims/expo-clipboard.ts` | Sostituisce Expo Clipboard con browser Clipboard API. | no | High | Documentare che non prova Expo Go/native clipboard. |
| `preview-web/vite.config.ts:27` | `lucide-react-native` -> `lucide-react` | Evita `react-native-svg` nella preview web. | no | Medium | Documentare che non prova SVG native o icon path RN. |
| `preview-web/vite.config.ts:28` | `@` -> repo root | Alias repo-local per preview/dev. | no | Medium | Vietare negli esempi consumer e documentare come preview-only. |
| `preview-web/shims/async-storage.ts` | AsyncStorage browser shim | Implementa `getItem`, `setItem`, `removeItem` via `window.localStorage`. | no | High | Documentare scope preview-only e limiti runtime. |
| `preview-web/shims/expo-clipboard.ts` | Expo Clipboard browser shim | Implementa `setStringAsync` con `navigator.clipboard`. | no | High | Documentare che non copre Expo module availability. |
| `preview-web/shims/react-native-safe-area-context.tsx` | Safe Area no-op shim | `SafeAreaProvider` ritorna children; `SafeAreaView` usa `View`; insets a zero. | no | High | Documentare che non valida device safe area. |
| `preview-web/preview.tsx` | import diretto di `../demo/app/App` | Usa demo internals come preview app. | partial | Low | Etichettare preview come development/demo harness. |

## Nota esplicita

La preview valida la demo web, non il runtime Expo/RN reale.

In particolare:

- non prova Metro resolver in una app Expo pulita;
- non prova installazione consumer del package;
- non prova `react-native-safe-area-context` nativo;
- non prova `@react-native-async-storage/async-storage` nativo;
- non prova `expo-clipboard` in Expo Go;
- non prova `react-native-svg` richiesto da `lucide-react-native`;
- non prova assenza di duplicati React/RN.

## Rischio operativo

Se la preview viene trattata come source of truth, puo mascherare:

- peer dependency mismatch;
- native module missing;
- Metro/export map failure;
- TypeScript declaration resolution failure;
- API internal usate tramite path repo-local;
- differenze web/native in componenti experimental.

## PLRNUI-51 documentation update

PLRNUI-51 adds consumer-facing documentation for preview web shims and runtime
limits in `docs/preview-runtime-limits.md`.

The documented boundary is:

- preview web is only a browser documentation/demo surface;
- preview web is not Expo/RN validation;
- passing preview web does not prove Expo, Metro, native runtime, iOS, Android,
  Hermes or React Native compatibility;
- `preview-web/shims/**` are documentation infrastructure only, not public API;
- consumer examples must import only from the approved public package API, such
  as `@personal-library/react-native-components`;
- consumer examples must not import from `preview-web/shims/**`;
- consumer examples must not rely on the Vite `@` alias;
- real Expo/RN validation must happen through external consumer validation, not
  through Vite preview.

PLRNUI-51 shim matrix:

| Preview alias/shim | Preview target | Preview-only status | Runtime limit |
| --- | --- | --- | --- |
| `react-native` | `react-native-web` | Not public API | Does not validate native RN behavior, Metro resolution, platform APIs, Hermes, iOS or Android. |
| `react-native-safe-area-context` | Preview shim | Not public API | Does not validate native safe-area insets or device cutout behavior. |
| `@react-native-async-storage/async-storage` | `localStorage` shim | Not public API | Browser `localStorage` semantics differ from native AsyncStorage behavior. |
| `expo-clipboard` | Browser Clipboard shim | Not public API | Does not validate Expo Clipboard permissions or native behavior. |
| `lucide-react-native` | `lucide-react` | Not public API | Does not validate `react-native-svg` or native icon behavior. |
| `@` alias | Repo root | Not public API | Consumer apps must not depend on repo-local aliases. |
| `preview-web/shims/**` | Local preview shims | Not public API | Browser-only compatibility layer, not exported or versioned as a package contract. |

Current checkout note: no `preview-web/` directory exists in this checkout. The
historical shim rows above remain audit evidence for preview-runtime risk and
for any future reintroduced preview harness.
