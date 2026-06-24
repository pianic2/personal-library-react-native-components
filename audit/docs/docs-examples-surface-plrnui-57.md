# PLRNUI-57 - Docs and Examples Surface Audit

## Scope

PLRNUI-57 creates a minimal consumer-facing docs/examples surface in the current repository. It aligns examples to the approved root package identity and to `audit/components/component-platform-support-matrix-plrnui-25.md`.

No package metadata, lockfile, runtime logic, dependency, public export or stable classification changes were made.

## Created docs

| File | Purpose | Import policy |
| --- | --- | --- |
| `docs/getting-started.md` | Minimal install/import and first render guidance. | Root package only. |
| `docs/components.md` | Public beta candidate and experimental component overview. | Root package only. |
| `docs/migration.md` | Migration notes away from unsupported legacy/deep import forms. | Root package only. |
| `docs/platform-support.md` | Consumer-facing platform support summary from PLRNUI-25. | Root package only. |

## Created examples

| File | Scope | Stability label |
| --- | --- | --- |
| `examples/basic-usage.tsx` | ThemeProvider, typography, card and button baseline. | beta candidates only. |
| `examples/layout-primitives.tsx` | Box, Row, Column, Divider, Button and Badge. | beta candidates only. |
| `examples/form-controls.tsx` | Input, PasswordInput, Textarea, Switch, Checkbox, RadioGroup and FormField. | beta candidates only. |
| `examples/feedback.tsx` | Alert, Badge, ProgressBar, Spinner and CodeInline. | beta candidates only. |
| `examples/navigation.tsx` | NavProvider, NavBar, TopBar and Link. | beta candidates only. |
| `examples/overlays.experimental.tsx` | Modal, BottomSheet, Tooltip, Popover and Select. | explicitly experimental. |

## Import verification policy

Consumer-facing files created by PLRNUI-57 use:

```ts
from "@personal-library/react-native-components"
```

Forbidden forms remain:

- legacy package names;
- placeholder package names;
- `src/**`;
- `dist/**`;
- direct component internals;
- repo-relative package imports such as `../../index`;
- internal type paths such as `../../theme/types`.

## Residual limits

- Examples are source snippets, not a clean installed consumer app.
- Consumer TypeScript declaration resolution, Metro startup and duplicate React/RN checks remain release-smoke work.
- Experimental overlays remain experimental and are not promoted to `stable`.
- Historical legacy references under `audit/**` remain migration evidence.

