# E9 / E11 / E12 — Accessibility, Showcase, Testing audit

Scope: tests/**, docs/accessibility-testing.md, tests/helpers/accessibility.ts, examples/*, docs/**, mkdocs.yml, scripts/{consumer,expo-consumer}-smoke.mjs, .github/workflows. Jira PLRNUI-77 (Pages showcase with auto-embedded Expo previews, Approvato) could not be re-read here (Atlassian MCP unreachable); treated as given. All E11 tickets depend on it and none re-create the Pages workflow.

## 1. Current state

Inventory: 36 root-exported components (src/components), docs/components has 44 md pages, 6 loose files in examples/, one CI job (.github/workflows/ci.yml) running `npm run release:check` sequentially.

### Tests (tests/)
- Runner: node:test + tsx + react-test-renderer 19, with `react-native` replaced by a hand-written shim (tests/shims/react-native.tsx, 53 lines, wired by tests/react-native-loader.mjs). Host components are plain strings (View, Pressable, TextInput...). Real RN behavior (Pressable press events, layout, TextInput) is not exercised; queries use findByType/findByProps.
- Counts: ~19 smoke tests in tests/components/component-smoke.test.tsx (474 lines, mostly "renders X without throwing" loop plus a handful of behavior tests for ProgressBar clamp, CodeInline, Textarea, PasswordInput toggle, Link routing, BottomBar limit, SideBar), 8 theme tests (Button/Card/Input tokens, dark mode, overrides, storage adapter, app shell), 2 script tests, 1 compat-docs test.
- Per-component coverage: no per-component test files; no coverage tooling or thresholds. Components with only a smoke render: Box, Row, Column, Divider, Text family, Badge, Alert, Spinner, Modal, BottomSheet, Popover, Tooltip, Select, TopBar, NavBar, Heading.
- Runner risk: `test` script globs `tests/**/*.test.tsx`; tests/compatibility-docs.test.ts (.ts) may not be picked up.
- Type tests: tests/types/public-api-types.ts and public-api.contract.ts cover ~7 types and 2 negative cases; run through `typecheck:contracts`. Plus scripts/public-api-snapshot.mjs for export surface.
- Perf: no render-count, no bundle size budget. No visual regression.

### Accessibility
- Source: a11y props found only in Button, Input, PasswordInput, Checkbox, Switch, RadioGroup, FormField (plus a few in Alert, Badge, Card, Link, NavBar, SideBar, ProgressBar, Select by grep count). Zero in Modal, BottomSheet, Popover, Tooltip, TopBar, Spinner, Textarea, Divider, Heading.
- No `hitSlop`, no `allowFontScaling`/`maxFontSizeMultiplier`/fontScale handling, no AccessibilityInfo (reduce motion, screen reader) usage in src.
- Tests: tests/accessibility/core-controls.test.tsx covers Button, Input, Checkbox, Switch, RadioGroup (role/label/state/hint). Helper tests/helpers/accessibility.ts: role, label, state, value, and style-only min touch target. A negative harness test exists. docs/accessibility-testing.md (17 lines) honestly disclaims AT behavior, focus, contrast, dynamic type.

| Dimension | Status |
|---|---|
| Roles/labels/states | 5 of ~25 interactive/status components tested |
| Focus / reading order | none |
| Screen reader announcements (live regions) | none |
| Dynamic type | none, likely clipping on fixed heights |
| Contrast | none (no automated token check) |
| Reduced motion | none |
| Touch targets 44/48 | helper only, not applied, no hitSlop |
| Web DOM a11y (axe) | none |
| Device evidence | none, no protocol |

### Consumer validation
- scripts/consumer-smoke.mjs (395 lines): packs tarball, installs and type/import checks in a temp consumer.
- scripts/expo-consumer-smoke.mjs: Expo 57 consumer from tarball, declares ios/android/web platforms but only runs `expo export --platform web`. Work dir hardcoded to /tmp.
- CI: single job, node 24 only, no matrix, no artifacts, no caching beyond npm.

### Showcase / catalog / templates
- No catalog app, no registry, no stories, no templates, no recipes. examples/ has 6 loose tsx files. Docs are hand-written markdown in mkdocs (mkdocs theme default) with no live previews; docs/preview-runtime-limits.md documents limits of previews. PLRNUI-77 will deliver the Pages host and Expo preview embedding.

## 2. Gaps (ranked)
1. Real-RN fidelity: shim-based tests cannot catch host behavior regressions; no RNTL.
2. A11y semantics missing in overlays/feedback/nav (code gaps, not just tests); no touch-target or font-scale handling.
3. No registry/catalog: blocks demo maturity criterion "presence in catalog", docs, AI manifests.
4. No visual regression, no coverage numbers, no size budget.
5. Expo consumer only proves web bundle.
6. No templates/recipes; single monolithic CI job.

## 3. Proposed architecture

```
catalog/registry.ts          single source: components, variants, states, controls schema, examples, maturity
apps/catalog/ (Expo, expo-router, metro alias -> ../../src)   [excluded from npm pack]
  stories/<category>/*.tsx   consumed by Matrix, Playground, docs
  src/{ThemeSwitcher,Playground,Matrix,search}
recipes/*.tsx (+features/)   copyable page recipes, typechecked by tsconfig.recipes.json, indexed in registry
templates/<name>/            app starters with template.json; validated by scripts/check-templates.mjs
tests/{components,accessibility,visual,perf,catalog,recipes,templates}
```
- Registry is JSON-serialisable so E13 manifests/CLI/MCP and docs generators reuse it. Catalog consumes library from source via metro alias; the same code deploys through PLRNUI-77 (web export embedded, deep link `?component=&theme=`).
- Packaging safety: nothing under apps/, catalog/, recipes/, templates/ enters `files`; guarded by `package:dry-run`. Future Texo cutover is unaffected (all imports use public package name, replaceable by alias).

### Catalog features
Index grouped by category + maturity badge; fuzzy search; per-component page with playground controls (boolean/enum/string/number) generating a copyable snippet; variants x states matrix with stable `matrix-<component>-<variant>-<state>` testIDs; header theme switcher (light/dark/system + E2 presets) persisted via existing storage adapter; recipes route.

### Templates (priority order)
tabs, auth (login/signup/forgot), dashboard, settings, onboarding, then e-commerce and social feed (last; need E7 list/media). Each builds via web export in CI. Recipes (login, signup, profile, settings, empty/error states first; list-detail, checkout, search-filter second) are headless source, not package exports (revisit in E14).

## 4. V1 test pyramid

| Layer | Tool | Gate | Tickets |
|---|---|---|---|
| Types | tsc contracts, API snapshot | every PR | E12-04, E12-05 |
| Unit/behavior per component | node:test + RNTL (decision ADR) | coverage threshold >=80% lines components | E12-01,02,16,17,03 |
| Theme matrix | forEachTheme harness | light/dark/presets | E12-15 |
| A11y static | contract table, helpers, contrast, dynamic type, reduced motion, touch targets | every PR | E9-01..11 |
| Web a11y | axe via Playwright on catalog | every PR | E9-12 |
| Visual regression | Playwright toHaveScreenshot on web catalog matrix (free, committed baselines, pinned container) | every PR; native via Maestro optional | E12-06, E12-07 |
| Perf | render-count baselines, size-limit, tree-shaking | every PR | E12-09, 10, 05 |
| Consumer | tarball strict-TS matrix + Expo bundle ios/android/web | release + nightly | E12-08, E12-11 |
| Manual device | VoiceOver/TalkBack protocol | production-ready maturity only | E9-14 |

Renderer recommendation: keep react-test-renderer for logic during transition, adopt @testing-library/react-native for new tests after E12-03 ADR (react-test-renderer is deprecated upstream in React 19; RNTL gives role/label queries matching a11y goals). Visual: Playwright on react-native-web is the only fully free CI-friendly option; native visual (Maestro/emulator) is flaky and stays optional.

## 5. Ticket map
- E9 (14): helpers (01), contract table (02), semantics fixes by area (03-06), touch targets (07), dynamic type (08), reduced motion (09, shared with E3), contrast (10), reading order (11), axe web (12), docs/protocol (13, 14).
- E11 (16): registry (01), app scaffold (02), nav/search (03), theme switcher (04), playground (05), matrix (06), stories (07, 16), Pages integration on PLRNUI-77 (08), template contract (09), starters (10-13), recipes (14, 15).
- E12 (17): runner/coverage (01), component tests (02, 16, 17), RNTL (03), type tests (04), tree-shaking (05), visual (06, 07), Expo consumer (08), size (09), render counts (10), strict TS consumer (11), CI split/jobs (12, 13), matrix report (14), theme matrix (15).

Cross-stream risks: E9-03/05/06 and E12-17 touch files also edited by E6 overlay/nav work; E9-09 hook should be consumed by E3; E11-04 depends on E2 preset API; E11-13 on E7 lists. filesTouched are disjoint within these three streams except tests/accessibility/core-controls.test.tsx (E12-03 only) and package.json (E12-01, 03, 09: serialise or rebase).
