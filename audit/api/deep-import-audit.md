# PLRNUI-4 - Deep Import Audit

Searched paths: `docs`, `demo`, `preview-web`. The requested `app`, `apps`, `test`, `tests`, `stories`, and `storybook` paths do not exist in this repository snapshot.

Patterns checked:

- imports from `src/`
- imports from `dist/`
- relative imports toward package internals
- legacy `AURA` / `@aura/ui` / `aura` paths
- imports incompatible with recommended package `@personal-library/react-native-components`

## Findings

| File | Import | Why problematic | Proposed replacement | Human review |
| --- | --- | --- | --- | --- |
| `demo/app/App.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path, not as a consumer package. | `from "@personal-library/react-native-components"` once package name is approved. | HUMAN REVIEW REQUIRED |
| `demo/app/App.tsx` | `import type { Theme } from "../../theme/types"` | Direct deep import into theme internals bypasses controlled entrypoint. | `import type { Theme } from "@personal-library/react-native-components"` or `.../theme`. | HUMAN REVIEW REQUIRED |
| `demo/app/DemoStateMatrix.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `demo/app/theme-toggle.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `demo/screens/ComponentsScreen.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `demo/screens/FeedbackScreen.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `demo/screens/FormsScreen.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `demo/screens/FoundationsScreen.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `demo/screens/LayoutScreen.tsx` | `from "../../index"` | Demo imports package root through a repo-relative deep path. | `from "@personal-library/react-native-components"`. | HUMAN REVIEW REQUIRED |
| `preview-web/preview.tsx` | `from "../demo/app/App"` | Preview imports demo internals directly; acceptable for preview app but not a library consumer example. | Keep preview-only, or move consumer smoke app to package import. | HUMAN REVIEW REQUIRED |
| `docs/**/*.md` | `from "AURA"` | Legacy package placeholder incompatible with recommended package name. | `from "@personal-library/react-native-components"` or approved subpath. | HUMAN REVIEW REQUIRED |

## Legacy import inventory

Documentation currently contains many snippets importing from `"AURA"`:

- `docs/getting-started.md`
- `docs/index.md`
- `docs/theme.md`
- `docs/theme/*.md`
- `docs/tokens/index.md`
- `docs/storage/token-storage.md`
- `docs/utils/*.md`
- `docs/components/**/*.md`

These are not deep imports, but they are incompatible with the target package identity and should be migrated once the package name is approved.

## Counts

- Deep imports found: 10 concrete source imports.
- Legacy docs import group found: 1 grouped finding covering documented `"AURA"` snippets.
- Imports from `src/`: 0.
- Imports from `dist/`: 0.
- Imports from `@aura/ui`: 0 in docs/demo/preview source, but `package.json` package name is still `@aura/ui`.

## Human review required

- Decide whether demo should act as an in-repo development app using relative imports or as a consumer smoke app using package imports.
- Decide whether docs should move directly from `"AURA"` to `@personal-library/react-native-components` before package metadata is changed.
- Decide whether preview-only imports from `demo` should be excluded from future deep-import checks.
