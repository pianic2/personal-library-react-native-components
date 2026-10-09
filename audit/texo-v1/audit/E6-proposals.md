# E6 Proposals - Feedback, overlays, navigation, app-shell, keyboard, gesture patterns

Evidence read: src/components/{Alert,Modal,BottomSheet,Popover,Tooltip,Select,NavBar,TopBar,BottomBar,SideBar,NavContext}, src/theme/ThemeAppShell.tsx, audit/components/overlay-platform-contract-plrnui-23.md, navigation-platform-contract-plrnui-22.md, audit/dependencies/peer-dependency-policy.md, safe-area-provider-dependency-contract.md.
Tickets: audit/texo-v1/tickets/E6.json (34 tickets, ids E6-01..E6-34).

## Current state (facts)
- Overlays (Modal, BottomSheet, Select) each wrap RN Modal; no shared stack, no focus/a11y/Escape/keyboard handling. Tooltip and Popover render nothing on native. All "experimental" per PLRNUI-23.
- Alert is a single coloured box with one action; no dismiss/role/live region.
- Nav: NavContext lists items + navigate only; BottomBar silently drops items past maxItems (no overflow); native SideBar is a plain list; no drawer; Link has an adapter contract (PLRNUI-22).
- ThemeAppShell = background + optional ScrollView only; safe area forbidden in src (PLRNUI-28/37).
- Core deps: only react/react-native peers. No native or router dependency may be added to core.

## Principles
1. Zero-native-dep core: Animated + PanResponder + Keyboard + AccessibilityInfo + BackHandler only.
2. Optional integrations (safe-area-context, expo-router, react-navigation, gesture-handler) are injected or lazily required via adapter files not reachable from the package entry; any optional-peer metadata change goes through the dependency gate (policy), not through these tickets (no package.json edits).
3. One overlay root (Portal/OverlayHost, E6-01) underlies Toast, Dialog, Drawer, Menu, Popover, Tooltip, ActionSheet.
4. Imperative APIs (toast(), confirm(), showActionSheet()) pair with providers; cut boilerplate.
5. Every component must ship a11y semantics and a documented iOS/Android/Web matrix.

## Roadmap by wave (dependency order)
- Wave 0 (foundations, parallel): 01 Portal/overlay stack, 22 useKeyboard+KeyboardAvoidingScreen, 23 SafeArea context, 26 NavContext upgrade, 03 Alert, 15 Tabs, 16 Accordion, 17 Stepper, 19 Pagination, 20 State views, 21 Skeleton, 31 PullToRefresh, 32 SwipeActions, 4 Banner.
- Wave 1 (needs 01): 02 Modal, 05 Toast, 10 Popover, 09 Drawer, 07 BottomSheet (also 22).
- Wave 2: 06 Dialog (01,02), 08 ActionSheet (07), 11 Tooltip (10), 14 Select (10), 12 Menu (10, 08), 24 KeyboardToolbar (22), 27 Router adapters (26), 18 Breadcrumb (26), 28 TopBar (23,26).
- Wave 3: 13 ContextMenu (12), 29 BottomBar/NavBar (12,23,26), 30 SideBar (9,26), 25 Screen/AppShell (01,22,23), 33 Undo/Optimistic (05), 34 ConfirmDestructive (06).

## Ticket index
| ID | Title | Size | Deps |
|---|---|---|---|
| E6-01 | Portal + overlay stack manager | M | - |
| E6-02 | Upgrade Modal | M | 01 |
| E6-03 | Upgrade Alert | S | - |
| E6-04 | Banner | S | - |
| E6-05 | Toast/Snackbar system | L | 01 |
| E6-06 | Dialog/AlertDialog/ConfirmDialog | M | 01,02 |
| E6-07 | Upgrade BottomSheet | L | 01,22 |
| E6-08 | ActionSheet | M | 01,07 |
| E6-09 | Drawer | M | 01 |
| E6-10 | Upgrade Popover | M | 01 |
| E6-11 | Upgrade Tooltip | M | 01,10 |
| E6-12 | Menu/DropdownMenu | M | 01,10,08 |
| E6-13 | ContextMenu | S | 12 |
| E6-14 | Upgrade Select | M | 01,10 |
| E6-15 | Tabs/SegmentedTabs | M | - |
| E6-16 | Accordion/Collapsible | M | - |
| E6-17 | Stepper/Wizard | M | - |
| E6-18 | Breadcrumb | S | 26 |
| E6-19 | Pagination | S | - |
| E6-20 | Empty/Error/Loading/Result | M | - |
| E6-21 | Skeleton + presets | M | - |
| E6-22 | useKeyboard + KeyboardAvoidingScreen | M | - |
| E6-23 | SafeArea context + optional adapter | M | - |
| E6-24 | KeyboardToolbar | M | 22 |
| E6-25 | Screen + AppShell scaffolds | L | 01,22,23 |
| E6-26 | Upgrade NavContext (adapter interface) | M | - |
| E6-27 | expo-router/react-navigation adapters | M | 26 |
| E6-28 | Upgrade TopBar | M | 23,26 |
| E6-29 | Upgrade BottomBar + NavBar | M | 26,23,12 |
| E6-30 | Upgrade SideBar | M | 26,09 |
| E6-31 | PullToRefresh | M | - |
| E6-32 | SwipeActions | L | - |
| E6-33 | Undo + optimistic hooks | M | 05 |
| E6-34 | Confirm-destructive pattern | S | 06 |

Note: four L tickets (05, 07, 25, 32) are the largest; if an agent session cannot finish, split along scope bullets (e.g. 05 imperative store vs. rendering).

## Cross-stream coordination
- E6-14 owns src/components/Select; E5 must not touch it (E5 may build on it).
- E6-21 owns Skeleton component; E3 supplies shimmer util only.
- E6-25 wraps, not edits, src/theme/ThemeAppShell.tsx (E2/E4 owner).
- E6-23 must not edit package.json; optional peer for react-native-safe-area-context needs a dependency-gate decision (E14).
- Subpath exports / src/index.ts barrel registration are E14; tickets export from their own index.ts only (root registration is a one-line follow-up owned by E14/E11).
- Catalog/examples entries owned by E11; tickets attach example snippets as evidence.
- Accessibility cross-checks (focus order, announcements) are verified further by E9.

## Rejected ideas
- Bundling react-native-reanimated / gesture-handler in core: violates zero-native-dep policy; replaced by PanResponder core + `gestureDriver` interface.
- Hard dependency on expo-router or @react-navigation: rejected; structural adapters only (E6-27).
- Importing react-native-safe-area-context in src: forbidden by PLRNUI-28/37; adapter-only (E6-23).
- Native Android/iOS Toast (ToastAndroid, native snackbars): non-equivalent cross-platform; JS toast chosen.
- Full nested-submenu Menu in v1: complexity, poor touch UX; deferred.
- iOS context-menu peek preview: needs native module.
- Router-owned tab/stack navigators (own implementation of stack navigation): replaces rather than enhances Expo/RN; out of scope.
- Rich-text/WYSIWYG, date pickers, command palette: belong to E5/E7, or low demand.
- Auto-persisted banner dismissal (AsyncStorage): ties core to storage; callback only (see theme-persistence-strategy.md).
- Single "Overlay" mega-component with `type` prop: poor composability; separate primitives over Portal chosen.
- Modifying ThemeAppShell in place: owned by theme stream; composition via Screen/AppShell.
- Haptics on swipe/long-press: native dep, belongs to E8 optional adapter.
