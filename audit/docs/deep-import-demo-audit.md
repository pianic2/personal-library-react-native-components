# PLRNUI-9 - Deep Import Demo Audit

## Scopo

Auditare import/export/require in docs, demo e preview per distinguere API pubbliche, import demo-local ammessi, deep import e shim preview. Questo file registra gap; non modifica demo, docs, preview o exports.

## Definizione di import ammesso/vietato

Import ammessi:

- Import da entrypoint pubblici documentati del package, quando approvati.
- Import locali interni alla demo, solo se restano chiaramente demo-only.
- Import preview-only da `preview-web/**`, solo se documentati come non rappresentativi del consumer Expo/RN reale.

Import vietati o da registrare come gap:

- Import da `src/**`, `packages/ui/src/**`, `dist/**`.
- Import relativi verso internals del package, ad esempio `../../theme/types`.
- Import relativi verso root package source, ad esempio `../../index`, quando la demo deve comportarsi da consumer reale.
- Import da subpath non pubblici o non presenti nel package export map.
- Shim/alias che fanno passare la preview ma nascondono requisiti reali del runtime Expo/RN.

## Tabella import

| File | Riga | Import | Classificazione | Severita | Nota |
| --- | ---: | --- | --- | --- | --- |
| `README.md` | 23 | `import { Button } from "aura";` | ambiguous | high | Import legacy/non metadata attuale; package reale e `@aura/ui`, target proposto diverso. |
| `docs/**/*.md` | molte, spesso riga 8 | `from "AURA"` | ambiguous | high | Non e package reale ne target approvato. |
| `demo/app/App.tsx` | 2-14 | `from "../../index"` | deep-import | high | Demo importa root via path relativo repo, non come consumer package. |
| `demo/app/App.tsx` | 15 | `import type { Theme } from "../../theme/types"` | internal-import | blocker | Import diretto verso internals theme. |
| `demo/app/theme-toggle.tsx` | 2 | `from "../../index"` | deep-import | high | Demo path relativo al root. |
| `demo/app/DemoStateMatrix.tsx` | 2 | `from "../../index"` | deep-import | high | Demo path relativo al root. |
| `demo/screens/ComponentsScreen.tsx` | 2-17 | `from "../../index"` | deep-import | high | Demo path relativo al root. |
| `demo/screens/FeedbackScreen.tsx` | 2-26 | `from "../../index"` | deep-import | high | Include experimental/internal components. |
| `demo/screens/FormsScreen.tsx` | 2-18 | `from "../../index"` | deep-import | high | Demo path relativo al root. |
| `demo/screens/FoundationsScreen.tsx` | 2-18 | `from "../../index"` | deep-import | high | Include deprecated token API. |
| `demo/screens/LayoutScreen.tsx` | 3-23 | `from "../../index"` | deep-import | high | Demo path relativo al root. |
| `preview-web/preview.tsx` | 2 | `import DemoApp from "../demo/app/App"` | allowed-demo-local | low | OK per preview-only, non per consumer example. |
| `preview-web/vite.config.ts` | 13-14 | alias `react-native` -> `react-native-web` | shim-preview | medium | Preview-only resolver behavior. |
| `preview-web/vite.config.ts` | 16-18 | alias `react-native-safe-area-context` -> `./shims/react-native-safe-area-context.tsx` | shim-preview | high | Nasconde requisiti native safe area. |
| `preview-web/vite.config.ts` | 20-22 | alias `@react-native-async-storage/async-storage` -> `./shims/async-storage.ts` | shim-preview | high | Nasconde requisiti AsyncStorage native. |
| `preview-web/vite.config.ts` | 24-25 | alias `expo-clipboard` -> `./shims/expo-clipboard.ts` | shim-preview | high | Nasconde requisiti Expo Clipboard. |
| `preview-web/vite.config.ts` | 27 | alias `lucide-react-native` -> `lucide-react` | shim-preview | medium | Nasconde runtime RN SVG/icon. |
| `preview-web/vite.config.ts` | 28 | alias `@` -> repo root | shim-preview | medium | Alias repo-local non consumer. |
| `demo/screens/*` | varie | import demo helper da `../app/DemoStateMatrix` | allowed-demo-local | low | Demo-local helper accettabile se non documentato come consumer API. |
| `demo/index.ts` | 1-8 | export di demo internals | ambiguous | medium | Demo API puo sembrare riusabile; va etichettata preview/demo-only. |

## Evidenze esplicite richieste

- `demo/app/App.tsx` importa da `../../index`.
- `demo/app/App.tsx` importa `type Theme` da `../../theme/types`.
- `demo/screens/*` importa da `../../index`.
- `preview-web/vite.config.ts` usa alias/shim preview per React Native Web, Safe Area, AsyncStorage, Expo Clipboard, Lucide e repo root.
- Non sono stati trovati import da `src`, `packages/ui/src` o `dist` nello scope `docs`, `demo`, `preview-web`.

## Sintesi

Il gap piu grave e l'import diretto di `Theme` da `../../theme/types`, perche bypassa la policy di API pubblica. Gli import demo da `../../index` sono meno profondi, ma restano incompatibili con ADR 0007 perche la example app dovrebbe comportarsi da consumer reale e non da app in-repo con path relativi.
