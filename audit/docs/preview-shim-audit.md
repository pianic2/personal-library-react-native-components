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
