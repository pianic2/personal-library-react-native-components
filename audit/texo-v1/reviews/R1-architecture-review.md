# R1 — Independent Architecture & API Review (Texo 1.0.0)

Reviewer: architecture/API (independent). Date: 2026-10-09.
Inputs: `00-brief.md`, `audit/E1, E2, E4-E5, E6, E7, E8, E9-E11-E12, E13, E14-E17`, all 17 ticket files (363 tickets), verified against `package.json`, `tsconfig*.json`, `src/index.ts`, `src/components/**`, `audit/adr/`.

Verdict: the streams are individually competent, but **they were planned in isolation and do not compose**. The plan as written produces 4 Skeletons, 4 safe-area layers, 3 keyboard hooks, 3 press primitives, 3 haptics adapters, 2 Portals, 2 Screens, 2 `List`s with different meanings, ~12 providers, 5 metadata registries, and no path to the 1.0 gate its own release policy defines. Fix the foundations and ownership first, then cut scope by ~35%.

Verification done:
- `filesTouched` exact-path collisions across tickets: **41 paths** (script over `tickets/*.json`). Examples below.
- `src/**`: **0** relative imports carry an extension; root barrel uses **directory** specifiers (`./components/Alert`). `package.json` has `"type": "module"`, `main/module = ./dist/index.js`, exports `types`+`import` only; `tsconfig.json` uses `moduleResolution: "bundler"`, `tsconfig.build.json` just flips `noEmit`. One platform-extension file exists: `src/components/SideBar/SideBar.web.tsx`.
- Existing event names: `Switch/Checkbox/RadioGroup` use `onChange(value)`; `variant` means semantic colour on Button/Badge/Alert (`Variant`), structure on Card (`default|elevated|outline`), `ProgressBar` uses `color: Variant`, `FormField` uses untyped `colorScheme`/`variant` strings.

---

## 1. Ranked findings

### BLOCKERS

**B1. No path to the 1.0.0 gate the plan itself defines.**
Evidence: E17-07 (ADR 0011) sets "1.0.0 criteria: stable set non-empty and listed"; E1 summary: stable = 0; E1-37 lifts everything only to `demo`; no ticket in any stream promotes a component to `stable` or defines the stable bar operationally (searched all tickets).
Fix: add an E17/E1 ticket "Define 1.0 stable set + stable bar checklist" (API review signed, a11y contract table green (E9-02), device protocol run (E9-14), docs Usage, per-subpath snapshot frozen, no `as any`) and one promotion ticket per family. Recommended stable set (ADR-R10).
Tickets: E17-07, E17-08, E1-01, E1-37, E9-14 (+ new E17-14, E1-38..41).

**B2. Massive cross-stream duplication with colliding `filesTouched` — parallel execution would produce conflicting implementations.**
Evidence (exact collisions from ticket JSON): `src/components/Skeleton/**` E4-12, E6-21, E7-05 (+ E3-07 Skeleton-with-shimmer at another path); `Portal/**` E4-11, E6-01; `Screen/**` E4-07, E6-25; `List/**` E4-16 (bulleted text list) vs E7-02 (FlatList wrapper) — **same name, different semantics**; `ListItem/**` E4-21, E7-01; `Avatar/**` E4-13/14, E7-17; `Accordion/**` E4-20, E6-16; `Calendar/**` E5-15, E7-29; `src/tokens/breakpoints.base.ts` E2-01, E10-01. Semantic duplicates on different paths: safe area E4-07, E6-23, E8-11, E10-07 (4x); keyboard E5-07, E6-22, E8-10 (+ FormLayout E5-08 vs KeyboardAvoidingScreen E6-22); reduced motion E3-03, E8-05, E9-09; haptics E3-13, E8-13, E8-14 (+ `haptic` prop in E4-03); press primitive E3-06 PressableScale, E4-03 Touchable, E8-14 HapticPressable; PullToRefresh E3-12, E6-31; Container E4-10, E10-06, E10-13 PageContainer; Grid E4-09 vs AdaptiveGrid E10-09; EmptyState/ErrorState E6-20 vs E7-06/07; Stepper E6-17 vs ProgressSteps E7-28; pickers E5-23/24 vs E8-21/22; AdaptiveNav E10-11 vs NavBar `layout=auto` upgrade E6-29; font scale E8-05 vs E10-12.
Fix: single owner per capability (table in ADR-R4); remove/merge the others (section 3). Rename E4-16 to `BulletList`/`ContentList`; `List` = virtualized list (E7-02).

**B3. E1 and E6 both rewrite the same 11 components.**
Evidence: `Tooltip/**` E1-13/E6-11, `Popover/**` E1-14/E6-10, `SideBar/**` E1-15/E6-30, `Select/**` E1-18/E6-14, `Alert/**` E1-25/E6-03, `TopBar/**` + `BottomBar/**` E1-29/E6-28/E6-29, `NavContext/**` + `NavBar/**` E1-30/E6-26/E6-29, `Modal/**` E1-32/E6-02, `BottomSheet/**` E1-33/E6-07. E1-14 "make Popover functional on native" will be thrown away by E6-10 "Popover on OverlayHost".
Fix: E1 for these 11 is limited to type exports, crash/leak fixes (Tooltip timer, Button info) and tests; the demo lift *is* the E6 upgrade. Make each E6 upgrade depend on its E1 fix ticket, or merge (preferred: merge E1-13→E6-11, E1-14→E6-10, E1-18→E6-14, E1-32→E6-02, E1-33→E6-07, E1-15→E6-30; keep E1-25/29/30 as small pre-fixes with E6 depending on them).

**B4. Overlay architecture is unspecified at the one point that matters: in-tree Portal vs native `Modal` windows.**
Evidence: E6-01 "modal=true mode may delegate to RN Modal"; E4-11 Portal "re-wrapping context captured at call site (Theme, Nav)"; current `Modal.tsx` wraps `RNModal`. An in-tree `PortalHost` at app root renders *behind* an RN `Modal` (separate native window on iOS/Android): a Select/Popover/Toast/Tooltip opened from inside a Modal/BottomSheet/Dialog will be invisible. Context re-wrapping only covers Theme+Nav, but the plan adds Capability, Density, Motion, Responsive, Form, ThemeScope, Icon, Overlay contexts.
Fix (ADR-R3): one `OverlayHost` (E6-01 is the sole owner; delete E4-11). Hosts are **nested**: every surface that opens a native window (Modal, BottomSheet if Modal-backed) renders its own `OverlayHost`; `Portal` mounts into the *nearest* host (context lookup), not the root. Root host is rendered by `TexoProvider` *inside* all providers so no context re-provisioning is needed except `ThemeScope` (forward the scoped theme explicitly). Back/Escape handling is the overlay stack's job; E8-18 back-handler stack must be the same stack (E6-01 owns, E8-18 becomes a thin public hook over it or is removed). Acceptance: test "Select inside Modal renders above Modal content" and "toast while Modal open is visible" on native renderer.

**B5. Foundation ordering is wrong: new components are scheduled before the theme contract, variant API and conventions they must use.**
Evidence: E2-01 (Theme v2) and E2-06 (`defineRecipe/useRecipe`) are not dependencies of any E4/E5/E6/E7 component ticket (e.g. E4-03 deps = E4-01 only; E4-06 Surface does "dark-mode tinting" without depending on E2-05 elevation resolver; E4/E5 rule "no new theme token keys"). Result: ~150 new components hand-roll ternaries (the exact debt E2 documents in Button) and need a second migration.
Fix: Wave 0 = E2-01, E2-02, E2-04, E2-05, E2-06, E3-01, E3-03, E4-02, E4-01, E4-03 (merged press primitive), E6-01, new API-conventions ADR, new TexoProvider. Every component ticket depends on E2-06 + conventions ADR and must use `useRecipe` and semantic tokens. Surface (E4-06) depends on E2-05.

**B6. ESM output is invalid outside Metro today, and the E14-03 fix as scoped won't work.**
Evidence: `package.json` `"type":"module"`; `src/index.ts` → `"./components/Alert"` (directory specifier) and component barrels → `"./Button"` (extensionless); `tsc` copies specifiers verbatim. Node ESM rejects both forms; **webpack 5 enforces `fullySpecified` for `.js` in `"type":"module"` packages**, so Next.js/webpack + react-native-web consumers break now, not just Node. E14-03 proposes evaluating `rewriteRelativeImportExtensions` — that option only rewrites specifiers already written with `.ts/.tsx`; it does nothing for extensionless or directory specifiers. Also: explicit `.js` specifiers defeat platform-extension resolution (Metro and webpack try the exact file first), so `SideBar.web.tsx` would silently stop being picked on web.
Fix: E14-03 scope = codemod every relative specifier in `src/**` to explicit `./X.js` / `./dir/index.js`; switch build to `module: "NodeNext"` (or keep `bundler` + lint rule `import/extensions`); add a lint/CI check rejecting extensionless relative imports; **ban `*.web.* / *.native.* / *.ios.* / *.android.*` in `src`** (use `Platform.OS` branches; E1-15 already removes the only one) — make E14-03 depend on E1-15. Reject per-subpath bundling (duplicates React contexts). Add the existing consumer smoke a webpack-5/`fullySpecified` resolve case (E14-10).

### MAJORS

**M1. Contradictory optional-dependency strategy across streams.**
Evidence: E8 rejects `peerDependenciesMeta` and uses injection/`try{require}`; E7 says svg/flashlist "require E14 to record peerDependenciesMeta"; E4/E5 say "guarded lazy requires" for svg, safe-area-context, expo-blur, datetimepicker, expo pickers; E14-09 ADR 0010 says "expo-* only from ./native". `require` does not exist in ESM under Node (consumer smoke, tests), and `try{require('x')}` support depends on bundler config (Metro `allowOptionalDependencies`; webpack still resolves at build time).
Fix (ADR-R5): two mechanisms only. (a) **Injection** is the contract everywhere (`createExpoHaptics(Haptics)`, `createSvgIconSet(Svg)`, `createFlashListRenderer(FlashList)`); no `require()` in `src`. (b) Optional *convenience* adapter modules may statically import a third-party lib only from a dedicated subpath `./adapters/<lib>`; the lib is then declared in `peerDependenciesMeta` optional (non-Expo libs: react-native-svg, @shopify/flash-list, react-native-safe-area-context, datetimepicker) — human sign-off required because it amends the native-dependency gate (expo-clipboard stays injection-only per PLRNUI-39). `createExpoCapabilities()` (E8-26) takes the modules as arguments; no try/catch require. Lint: `no-restricted-syntax` for `require(` in `src`.
Tickets: E8-01, E8-02, E8-26, E7-04, E7-21, E7-25, E7-26, E4-04/05, E4-07, E5-18, E5-24, E14-09.

**M2. Subpath plans are four incompatible proposals and the ADR number 0009 is claimed twice.**
Evidence: E14-01 (`./theme ./tokens ./hooks ./utils ./navigation ./experimental ./native ./meta`), E8-02 (`./native`, `./native/*`, `./native/*/expo` wildcards; ADR in `docs/adr/` — a different directory from `audit/adr/`), E5-29 (`./zod`, `./adapters/*`), E7 (svg/flashlist/expo-video subpaths), E2 (`./presets`), E13 D5 (`./ai/*` vs `./meta`). ADR 0009 = subpath exports (E14-01) **and** motion engine (E3-02). `package.json` touched by 9 tickets (E1-05, E5-29, E8-02, E12-01/03/09, E13-01, E14-02, E15-14, E17-01).
Fix: `config/exports.json` (E14-01) is the only source; other streams add rows to it via E14-02's generator — no other ticket edits `package.json` `exports`. Allocate ADR numbers centrally (ADR-R0). Final subpath set in ADR-R6.

**M3. Stability expressed as a subpath (`./experimental`, `./navigation`) makes promotion a breaking change.**
Evidence: E14 table puts Modal/BottomSheet/Popover/Tooltip/Select in `./experimental`; these are root exports today (`src/index.ts`) and E6 upgrades them toward demo/stable. Moving them out of root is breaking now; moving them back later is breaking again for `./experimental` importers. Same for per-component subpaths `./components/*` (each is permanent semver surface).
Fix: stability = metadata (`@experimental` JSDoc + meta `status`) not import path. No `./experimental`, no `./navigation`, no `./components/*` in 1.0.

**M4. Shim exact-pin causes duplicate Texo copies (two ThemeContexts) during the mixed-import migration window.**
Evidence: E14 §2 "Shim declares exactly one dependency (`<TEXO>` exact version)". An app that has run the codemod partially (or installs Texo directly at `^1.1` while shim pins `1.0.3`) gets two Texo copies; components imported via legacy name won't see the provider imported via Texo name — silent unthemed UI.
Fix: shim depends on `<TEXO>` with a **caret range matching its major** (`^1.0.0`) so npm dedupes; release lockstep still publishes both. Contexts created via a `globalThis[Symbol.for('texo.theme')]` singleton with a `__DEV__` warning when a second instance registers. Parity gate E15-08 adds a "mixed imports, one provider" consumer test.
Tickets: E15-02 (decision becomes deducible), E15-03, E15-08, E14-09.

**M5. Provider sprawl with no composition root.**
Evidence: ThemeProvider (+ preset/density/preference E2-08), MotionProvider (E3-03), DensityProvider (E2-09), ResponsiveProvider (E10-05), SafeAreaAdapterProvider (E10-07) + SafeArea context (E6-23), CapabilityProvider (E8-01), HapticsProvider (E3-13), OverlayHost/PortalProvider (E6-01/E4-11), ToastProvider (E6-05), IconProvider (E4-04), NavProvider, Form. ~12; ordering bugs (Portal outside ThemeProvider etc.) guaranteed; boilerplate goal of the brief inverted.
Fix: new ticket "TexoProvider": one component with typed props `{theme, preset, preference, density, adapters (capabilities incl. safeArea/haptics), icons, nav, motion}` that composes all providers in a fixed order and renders the root OverlayHost + Toast viewport last. Individual providers stay exported for advanced use. Safe-area and haptics become capabilities of E8-01, not separate providers.

**M6. No API conventions ADR; sketches already diverge and the existing API conflicts with them.**
Evidence: E5 sketches: Combobox/Calendar `onValueChange`, DatePicker `onChange`; existing Switch/Checkbox/RadioGroup `onChange(value)` (collides with RN `onChange(nativeEvent)` semantics); `Field status="error"` vs `OTPInput error` boolean vs `Input error`; `variant` = colour on Button/Badge/Alert but structure on Card and on E2 recipe sketch (`solid|outline|ghost|danger`, mixing structure and colour); `ProgressBar color`, `FormField colorScheme`; `Icon color="primary"`; `Form.Submit label=` vs children; no rule on `ref`, `style`/slot styles, `testID` passthrough (E1 notes Button/Link drop them).
Fix: ADR-R2 before Wave 1; every component ticket's acceptance includes "conforms to ADR-R2 (type test in tests/types)". Add one type-level conformance test that iterates component prop types.

**M7. Five overlapping metadata registries.**
Evidence: E1-01 maturity manifest; E4/E5 `<Name>.catalog.ts`; E11-01 catalog registry `catalog/registry.ts`; E13-05/06-09 `ai/meta/<Name>.meta.json` (D6 picks JSON sidecars); E2-10 DTCG token manifest vs E13-04 token manifest.
Fix (ADR-R7): one colocated, typed `src/components/<Name>/<Name>.meta.ts` (JSON-serialisable: name, category, status, summary, whenToUse/whenNotToUse, a11y, variants, states, examples refs). Excluded from build output (`tsconfig.build.json` exclude `**/*.meta.ts`) and never imported by component code. Maturity gate, catalog, docs, AI cards all read it via one loader `scripts/lib/meta.mjs`. E2-10 emits tokens once; E13-04 consumes E2-10 output instead of re-deriving. Every component ticket's DoD includes its meta file (this is also what keeps E13 meta authoring from becoming a 150-component backlog).

**M8. Scope is far beyond a credible 1.0 and includes mediocre/niche items the brief forbids ("no mediocre filler").**
Evidence: 363 tickets (E6 34, E13 34, E7 33, E5 29, E8 28...). Niche or low-leverage for a 1.0 UI kit: E7-19/20/21 Video/Audio shells, E7-31 Markdown, E7-32 MessageList, E7-30 Agenda, E7-14 Tree, E7-18 Gallery/Lightbox, E7-33 NotificationList, E7-25/26 SVG charts, E8-24 biometrics, E8-25 splash gate, E10-08 foldable posture, E10-10 SplitView, E2-13/15/16/17/19 five extra presets, E4-08 Spacer, E4-14 AvatarGroup (merged in E7-17 anyway), E4-18 CodeBlock, E5-22 Rating, E6-13 ContextMenu, E6-18 Breadcrumb, E13-32 CLI, E13-33 MCP, E11-12/13 e-commerce/social templates. E1-21 lifts B/P/Small/TextGroup to demo although TextGroup duplicates Column and B/P/Small are `Text` presets.
Fix: 1.0 = foundations + core components + forms + overlays + list/table + native core + AI tier-0/1; the rest labelled `post-1.0` (section 3). Freeze B/P/Small/TextGroup as `@deprecated` aliases (`<Text weight="bold">`, `<Text variant="body">`, `<Text variant="caption">`, `Column`), not promoted.

**M9. Missing essential: i18n/locale and RTL foundation.**
Evidence: hardcoded English in `PasswordInput.tsx:57` ('Show'/'Hide'); E5-02 invents `setValidationMessages` locally; E5 a11y announcements ("Verification code, 6 digits", "N results"), Calendar `locale`, DatePicker, Combobox `emptyMessage`, Toast "Undo", Pagination; E9-04 risk "Default English labels vs i18n (E14)" — no E14 ticket exists. RTL handled ad hoc per ticket (E5-10, E6-09, E6-15).
Fix: new E4 foundation ticket "LocaleProvider + messages catalog": `useMessages()` with typed default English catalog, `locale` and `direction` from `I18nManager`, `Intl` formatters; all built-in strings and a11y labels read from it; validation messages from E5-02 move into it. Part of TexoProvider.

**M10. AI layer token budgets are not realistic for the planned surface; skills don't need to ship in npm.**
Evidence: E13-11 "index.txt <= 6000 chars" for one line per component; the plan adds ~150 components + ~60 hooks/capabilities → ~210 entries ≈ 28 chars/line, which cannot hold "name - summary [category,status]". E13-01 adds `skills/`, `AGENTS.md`, `llms*.txt` to `package.json` `files`, but `npx skills add` installs from git, not npm. E13-30/31: 20 tasks × 3 arms × N≥5 = ≥300 agent runs with no budget owner (D7).
Fix: T0 = per-category index (≤ 1.5k tokens each) + a top-level category list (≤ 400 tokens); budget test per file. Only `./meta` (JSON manifests) ships in npm; skills/AGENTS/llms live in the repo and docs site. Keep eval harness but run on a 10-task subset per PR-to-release, full run once before GA. MCP/CLI deferred (agree with E13).

**M11. Hidden coupling: maturity gate E1-37 depends on 19 tickets but the gate will be invalidated by every E4–E8 component that lands without meta/tests.**
Evidence: E1-37 "Flip all 36 to demo and enable strict gate"; E4/E5 wiring tickets (E4-22, E5-29) and E6/E7/E2 "root barrel owned by E14" — contradictory owners of `src/index.ts` (collision: E1-35, E4-22, E5-29, E15-14).
Fix: one owner of root barrel + API snapshot per wave: a recurring "Wave N wiring" ticket in E14 (serialised), consuming meta files; strict gate (E1-05/E1-37) runs on all components with `status>=demo` in meta, so new components cannot land below the bar.

**M12. Motion: three press-feedback implementations and an unowned Skeleton shimmer.**
Evidence: E3-06 `usePressFeedback/PressableScale`, E4-03 Touchable `feedback="opacity|scale|ripple"`, E8-14 HapticPressable; E3-07 Skeleton shimmer vs E6-21/E7-05/E4-12.
Fix: Touchable (E4-03) is the only press primitive; it consumes `usePressFeedback` (E3-06, hook only, no component) and `useCapability('haptics')` (E8-13). Delete PressableScale and HapticPressable. Skeleton: one owner (E6-21 suggested by E6 itself; E3 supplies `useShimmer` only).

### MINORS

- **m1.** "Recipe" means a variant/style API in E2-06 and copyable page code in E11-14/15, E13-14/15. Rename E2 API to `defineVariants`/`useVariants` (or `createStyles`). Tickets: E2-06, E2-20, E13-14.
- **m2.** `useBreakpoint` exists twice (`src/hooks/useBreakpoint.ts` public, `src/utils/useBreakpoint.ts` private, different thresholds). E10-01 must delete the utils one and E4-09 Grid must depend on E10-01 (it currently has no deps).
- **m3.** `tests/` and `examples/` aren't type-checked (`tsconfig.json include:["src"]`); E1-04 fixes it — make it Wave 0 because every later ticket adds tests/examples.
- **m4.** `TokenPair {access, refresh}` exported as a design token type (`src/tokens/types.ts`) — deprecate in E2-01.
- **m5.** E5-05 `Field` composes `<Input bare/>` but no ticket adds `bare`; E1-12 makes label optional — add `E1-12` to E5-05 deps and name the prop explicitly.
- **m6.** E8 `CapabilityMap` "module-augmentable" global interface becomes semver surface and conflicts across duplicate copies; keep the map closed in 1.0.
- **m7.** `Button.tsx` touched by E1-09, E9-07, E9-08 and implicitly E2-06 pilot — serialise (E9-07/08 depend on Button migration to Touchable+variants).
- **m8.** E14-03 acceptance "dist import fails only on react-native" is weak; use the RN stub already in `tests/shims/react-native.tsx` so the import must fully succeed.
- **m9.** E8 notes say SDK 57 but E7 says "verify expo-av against SDK 56"; `expo-av` is deprecated in recent SDKs — drop the expo-av adapter (E7-21) and ship expo-video/expo-audio only (if media stays in scope).
- **m10.** `PACKAGE_NAME` runtime export has no consumer value; deprecate it now (value stays the actual package name; via shim `export *` it reports the Texo name, which is correct).
- **m11.** Docs language: AI cards English (E13 D1) while `docs/` is partly Italian; E16-06 already moves to English — make that the rule, not a decision.

---

## 2. Recommended architecture decisions (ADR-style)

**ADR-R0 — ADR numbering and location.** All ADRs in `audit/adr/`, numbers allocated by orchestrator: 0009 subpath exports (E14-01), 0010 peer/optional deps (E14-09, absorbs E8-02's ADR), 0011 semver (E17-07), 0012 motion engine (was E3-02's "0009"), 0013 shim policy (E15-02), 0014 API conventions (new), 0015 overlay architecture (new), 0016 metadata single source (new). `docs/adr/` is not used.

**ADR-R1 — Composition root.** `TexoProvider` composes Theme(preset/preference/density) → Locale → Motion(reduced motion) → Responsive → Capabilities(safe area, haptics, keyboard, back handler…) → Icons → Nav → OverlayHost(root) → ToastViewport. Individual providers remain exported. Status: deducible.

**ADR-R2 — Public API conventions (pre-1.0, frozen at 1.0).**
- Controlled values: `value` / `defaultValue` / `onValueChange(value)` on every non-text control and composite (Checkbox, Switch, RadioGroup, Slider, Select, Combobox, Tabs, Accordion, DatePicker…). Existing `onChange(value)` kept as `@deprecated` alias through 1.x. Text inputs keep RN `onChangeText` and add `onValueChange` alias only where a transform exists (MaskedInput: `onValueChange(raw, formatted)`).
- Open state: `open` / `defaultOpen` / `onOpenChange(open)` for all overlays/disclosures; never `visible`/`isOpen`/`onClose` alone (keep `onClose` as alias on Modal/BottomSheet).
- Visual axes: `variant` = structure (`solid | soft | outline | ghost | link` as applicable); `tone` = semantic colour (`primary | neutral | success | warning | danger | info`); `size` = `xs | sm | md | lg` (`xl` only for display). Button `variant="danger|info|primary|secondary"` mapped to `tone` via deprecated alias. Remove `color: Variant` (ProgressBar) and `colorScheme` (FormField) in favour of `tone`.
- Validation state: `invalid?: boolean` + Field-level `status`; `error` prop holds the message (string), never a boolean.
- Every component: forwards `ref` (React 19 ref-as-prop), `style` (root) plus `styles?: Partial<Record<Slot, StyleProp>>` for multi-slot, `testID`, and all `accessibility*`/`aria-*` props; children-as-content preferred over `label` strings except where an a11y label is required.
- Compound components via `Object.assign(Root, {Part})` and named `RootPart` exports (tree-shake friendly, docgen-visible).
- a11y defaults baked in: role, state, label requirement enforced by types where content isn't text (icon-only Touchable requires `accessibilityLabel`), 44/48 target via hitSlop not size.
Status: deducible.

**ADR-R3 — Overlay architecture.** Single owner E6-01. Nearest-host Portal; native-window surfaces render their own host; root host inside TexoProvider; one stack owns z-order, focus return, Back/Escape (BackHandler) and scroll lock; RN `Modal` used only for true modal surfaces needing native focus trapping. Popover/Tooltip/Menu/Select/Combobox/DatePicker/Toast all mount via Portal. Status: deducible.

**ADR-R4 — Capability ownership (one owner each).** Press: Touchable E4-03 (+ `usePressFeedback` hook E3-06). Haptics/safe area/keyboard/back/a11y-prefs/appearance: E8 capabilities (E8-13, E8-11, E8-10, E8-18 → hook over overlay stack, E8-05). Reduced motion: E8-05 exposes; E3-03 `MotionProvider` consumes. Breakpoints/size classes: E10-01/02. Skeleton: E6-21. Portal: E6-01. Screen/AppShell: E6-25 (absorbs E4-07). Keyboard-avoiding form container: E5-08 built on E8-10. Container: E10-06 (absorbs E4-10, E10-13). Grid: E4-09 built on E10-03 (absorbs E10-09). ListItem/List/Avatar: E7-01/E7-02/E7-17; E4-16 renamed BulletList. Calendar: E5-15 (E7-29 becomes "marked dates + range display" extension or removed). Empty/Error/Loading/Result: E6-20 (absorbs E7-06/07). Steps: E6-17 (absorbs E7-28 as `variant="progress"`). Pickers: E8-21/22 adapters + one `FileField` UI E5-23 (absorbs ImagePickerField/DocumentPickerField UI). PullToRefresh: E6-31 (absorbs E3-12). Status: deducible.

**ADR-R5 — Optional dependencies.** Injection is the only core mechanism; no `require()` in `src`. Convenience adapters live in `./adapters/<lib>` with static imports; non-Expo libs declared in `peerDependenciesMeta` optional (needs human approval: amends native-dependency gate). Expo modules injected (`createExpoCapabilities({haptics: Haptics, …})`). Root-reachability boundary check (E8-02 script) covers `./adapters/*` and `./native/expo`. Status: mechanism deducible; peerDependenciesMeta allowance human-only.

**ADR-R6 — Subpaths for 1.0.** `.` (all components, hooks, theme, tokens, TexoProvider), `./theme`, `./tokens` (re-exports of the same modules — identity preserved), `./native` (capability contracts + RN-core/web fallbacks), `./native/expo` (injectable Expo adapter factories), `./adapters/*` (svg, flash-list, safe-area-context, datetimepicker, zod-free resolver needs no subpath), `./testing` (mock adapters, render helpers), `./meta` (JSON manifests, no RN import), `./package.json`. No `./experimental`, `./navigation`, `./components/*`, `./utils`, `./hooks` (hooks live in root). Conditions: `types`, `react-native`, `import`, `default` (all → same ESM file). ESM-only; `sideEffects: false` after E14-06. Status: deducible (confirm ESM-only by spike E14-04).

**ADR-R7 — Metadata single source.** Colocated `<Name>.meta.ts`, typed by `ComponentMeta`, excluded from build; consumed by maturity gate (E1), catalog (E11), docs lint (E1-07), AI manifests (E13), MCP-free. `ai/meta/*.json` and `<Name>.catalog.ts` are not created. Status: deducible.

**ADR-R8 — ESM emit.** Explicit `.js` relative specifiers (directories → `/index.js`) enforced by lint; no platform-extension files in `src`; no per-subpath bundling; Node, TS node16/bundler, Metro and webpack-5 resolution in E14-10 matrix. Status: deducible.

**ADR-R9 — Shim.** Generated `dist-shim/` (E15-03 as proposed — sound); dependency on Texo `^<major>` (not exact); lockstep version; no runtime warning; contexts as global singletons with dev duplicate warning; `PACKAGE_NAME` deprecated. Sunset window human-only.

**ADR-R10 — 1.0 stable set (proposal; human confirms).** Stable: Text, Heading, Box, Row, Column, Divider, Touchable, Button, Icon, Link, Input, Textarea, Checkbox, Switch, RadioGroup, Field/Label, Card/Surface, Badge, Spinner, ProgressBar, Alert, Screen, ThemeProvider/TexoProvider, useTheme, tokens. Everything else ships `demo`/`@experimental` and is semver-exempt.

**ADR-R11 — Motion.** RN `Animated` + `LayoutAnimation` + `PanResponder`; no Reanimated/gesture-handler peers in 1.0; `useNativeDriver` where supported; all animations gated on reduced motion. (All streams already agree.) Status: deducible.

---

## 3. Ticket changes required

**Add**
- E14-12 `TexoProvider` composition root (ADR-R1). Wave 0 after E2-01, E6-01, E8-01.
- E4-23 LocaleProvider + messages catalog + direction (M9). Wave 0.
- E14-13 API conventions ADR 0014 + prop-convention type test (ADR-R2). Wave 0; dependency of every component ticket.
- E17-14 Define stable bar + 1.0 stable set (B1); E1-38..E1-41 promote stable set by family (layout/typography, controls, feedback, surfaces).
- E14-14 Recurring wave wiring ticket (root barrel + snapshot + mkdocs), replacing E4-22/E5-29 and the "E14 owns barrel" notes (M11).
- E6-01 acceptance additions: nested host test (Select-in-Modal, toast-over-Modal) (B4).
- E14-10 add webpack-5 fullySpecified resolution case; E14-03 add lint for extensionless relative imports (B6).
- E15-08 add "mixed legacy+Texo imports share one provider" consumer test (M4).

**Merge / remove (keep → absorbed)**
- E6-21 ← E4-12, E7-05, E3-07 (E3 keeps `useShimmer` only).
- E6-01 ← E4-11. E6-25 ← E4-07. E8-11 ← E6-23, E10-07. E8-10 ← E5-07, E6-22 (KeyboardAvoidingScreen folds into E6-25). E8-05 ← E9-09 (E9 keeps gating tests), E10-12 hook part. E8-13 ← E3-13; remove E8-14 (Touchable `haptic` prop). E4-03 ← E3-06 component part.
- E7-01 ← E4-21. E7-17 ← E4-13, E4-14. E6-16 ← E4-19, E4-20 (or reverse; one owner). E5-15 ← E7-29. E6-20 ← E7-06, E7-07. E6-17 ← E7-28. E6-31 ← E3-12. E10-06 ← E4-10, E10-13. E4-09 ← E10-09. E6-29 ← E10-11.
- E5-23 ← UI parts of E8-21/E8-22 (E8 keeps adapters/hooks); remove E5-24 (E8-20/21/22 provide Expo adapters).
- E6-11 ← E1-13; E6-10 ← E1-14; E6-14 ← E1-18; E6-02 ← E1-32; E6-07 ← E1-33; E6-30 ← E1-15 (B3).
- E2-10 ← token part of E13-04 (E13-04 consumes E2-10 output).
- E1-01 + E11-01 + E13-05 → one meta schema ticket (ADR-R7); E13-06..09 become "backfill meta for existing 36" only.
- E8-02 ADR content → E14-09 (single ADR 0010); E8-02 keeps the boundary script; `package.json` edits go through E14-02's config.

**Rename**
- E4-16 `List` → `BulletList` (name collision with E7-02).
- E2-06 recipe API → `defineVariants/useVariants` (m1).
- E3-02 ADR file → `0012-motion-engine…` (ADR-R0).

**Re-scope**
- E1-21: deprecate B/P/Small/TextGroup instead of promoting (M8).
- E1-13/14/18/32/33/15: limited to type export + leak/crash fix if not merged (B3).
- E14-01: drop `./experimental`, `./navigation`, `./utils`, `./hooks`, `./components/*`; add `./adapters/*`, `./native/expo`, `./testing` (ADR-R6).
- E14-03: codemod + NodeNext/lint + platform-file ban; depends on E1-15 (B6).
- E13-01: ship only `./meta` in npm; skills/AGENTS/llms not in `files` (M10). E13-11: per-category T0 budget.
- E15-02 → decision mostly deducible (ADR-R9); only sunset window remains human.

**Reorder (Wave 0, before any new component)**
E1-04, E2-01, E2-02, E2-04, E2-05, E2-06, E3-01, E3-03, E4-02, E4-01, E4-03, E4-04, E4-23, E6-01, E8-01, E10-01, E14-03, E14-13, E14-12. All E4/E5/E6/E7 component tickets add deps on E2-06 and E14-13; E4-06 adds E2-05; E5-05 adds E1-12; E9-07/E9-08 depend on the Button migration.

**Defer to post-1.0 (label `post-1.0`, keep in backlog)**
E7-14, E7-18, E7-19, E7-20, E7-21, E7-25, E7-26, E7-30, E7-31, E7-32, E7-33, E8-24, E8-25, E10-08, E10-10, E2-13, E2-15, E2-16, E2-17, E2-19, E4-08, E4-18, E5-22, E6-13, E6-18, E11-12, E11-13, E13-32, E13-33. (Keep presets minimal, saas, dashboard for 1.0 — they exercise light/comfortable/compact density and the contrast gate.)

---

## 4. Decisions: deducible vs human-only

**Orchestrator can decide (recommended answer)**
1. Motion engine → RN Animated/LayoutAnimation/PanResponder, no Reanimated peer (ADR-R11).
2. `ThemePreference` with `"system"`, `ThemeMode` unchanged (E2 open #2) → additive.
3. Flat `theme.colors` → keep, derive from semantic, no deprecation in 1.0.
4. `useBreakpoint` native fix → ship now as minor with breaking-change register entry (pre-1.0).
5. Presets location → root named exports + `./theme`; 3 presets in 1.0.
6. Fonts → fallback stacks, consumer loads fonts; no expo-font helper.
7. Per-component subpaths → no. `./experimental` → no (M3).
8. Module format → ESM-only, confirmed by spike E14-04 (no CJS: dual-package context hazard).
9. Overlay architecture → ADR-R3. Composition root → ADR-R1. Ownership table → ADR-R4.
10. API naming conventions → ADR-R2.
11. Metadata model → colocated `<Name>.meta.ts` (E13 D6 overridden). Manifest location → `./meta` from `dist/meta` (E13 D5).
12. MCP → no (E13 D3); CLI info/doctor → post-1.0 (D2); Claude plugin marketplace manifest → post-1.0 (D4).
13. Docs/AI card language → English (D1).
14. Shim dependency range → caret, lockstep versions, no runtime warning; `PACKAGE_NAME` → deprecated (most of E15-02).
15. Injection-first optional deps mechanism, no `require()` in src (ADR-R5 mechanism part).
16. ADR numbering (ADR-R0); ESM emit approach (ADR-R8).

**Human-only**
1. Final Texo name/scope/npm org/repo owner (`pianic2` vs `niccolo` mismatch in mkdocs), license holder/NOTICE, SECURITY contact, CODEOWNERS (E15-01, E16-01/03).
2. Amending the native-dependency gate to allow `peerDependenciesMeta` optional peers for non-Expo libs (svg, flash-list, safe-area-context, datetimepicker) — affects PLRNUI-39 policy.
3. 1.0 scope cut and the stable set (ADR-R10, deferral list) — product call; recommendation provided.
4. Support matrix breadth for 1.0 (Expo 57 only vs 56–57; iOS/dev-client evidence) and deprecation/sunset windows (months) for shim and deprecated props.
5. Eval budget and reference agent/model for AI uplift proof (E13 D7).
6. Version line: Texo starts at `1.0.0-rc.0` under the new name; legacy name jumps `0.1.0-rc.2 → 1.0.0` shim (needs npm-name decision).
7. Public/private fate of `audit/` and Jira-internal CONTRIBUTING (E16-10).
8. Codemod channel naming (`npx <texo>-codemod` vs `texo migrate`) — follows name decision.
