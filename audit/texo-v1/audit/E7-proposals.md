# E7 Proposals: Data display, lists, tables, charts, media

Tickets: `audit/texo-v1/tickets/E7.json` (33 tickets, local ids E7-01..E7-33, `filesTouched` pairwise disjoint).

## Baseline (evidence)
- `src/index.ts` exports 38 components; none cover lists, tables, charts, media, skeletons, or empty/error states. Data display today is `Card`, `Badge`, `ProgressBar` (linear only, `src/components/ProgressBar/ProgressBar.tsx`), `Spinner`.
- Conventions: one dir per component with `Component.tsx` + `index.ts`; styles from `useTheme()` (`theme`, `colors`); no runtime deps; `react`/`react-native` peers only (`audit/dependencies/peer-dependency-policy.md`).
- Policy constraints: `react-native-svg` listed as blocked without the native dependency gate; no new core `dependencies`; optional features via consumer-owned adapters and subpaths; each new native-adjacent dep needs a Jira ticket, package-section decision, Expo Go/prebuild/bare impact, and PLRNUI-46 smoke.

## Key decisions

### 1. Lists: wrap FlatList, FlashList by adapter
`List`/`SectionList` wrap RN FlatList/SectionList with tuned defaults (windowSize, batch sizes, removeClippedSubviews on Android, key inference with dev warning) and slots for empty/error/loading/footer. A `renderer` prop (`ListRenderer`) allows injecting FlashList through a subpath adapter (E7-04). Rationale: FlashList is a native-adjacent optional peer; core stays zero-dep, and every higher component (DataTable, Tree, Gallery, MessageList, Agenda, NotificationList) is built on `List`, so one adapter upgrades all of them. Rule: no `ScrollView + map` for unbounded data anywhere.

### 2. Charts: split by what Views can do faithfully
- Pure-View (core, zero dep): bar (vertical, horizontal, grouped, stacked), sparkline bars/win-loss, circular progress (half-circle clip technique), steps. Bars, rings and tiles are rectangles/rotations; Views do them well, animate on the native driver, and keep Expo Go and web working.
- `react-native-svg` as an optional peer on a subpath: line, area, donut/pie. Smooth curves and arcs cannot be drawn faithfully with Views (rotated-View line segments produce one element per segment, seams, and poor perf at 1,000+ points). SVG gives one `Path` per series.
- Not chosen: bundling svg (violates policy table), skia (heavier native dep, rejected for v1), pure-View lines (perf/fidelity).
- Shared `Chart` core (E7-22) is pure TS (scales, ticks, LTTB downsampling, palette with contrast checks, accessible summary, ChartFrame states) so both renderers behave identically. Charts must expose a text summary, never color-only meaning.
- Requires E14 to record the optional-peer decision (`peerDependenciesMeta`) and gate checklist; E7 tickets only create the subpath modules and do not edit `package.json`.

### 3. Tables
Split into headless model (E7-08, pure TS, Node-testable, sort 50k rows < 150ms), view (E7-09: virtualized rows, sticky header, horizontal scroll, pinned first column), and responsive card collapse (E7-10, via `useBreakpoint` and `DescriptionList`). No editing, resize, or grouping in v1.

### 4. Media
Image (E7-16) wraps RN Image with aspect-ratio reservation, placeholder, fallback, fade, and a `renderPlaceholder` hook so blurhash/thumbhash decoders plug in without bundling one. Video/Audio are UI shells over a `MediaEngine` interface (E7-19/20); `expo-video`/`expo-av` live in subpath adapters (E7-21). Verify expo-av status against SDK 56 before choosing which adapter ships first.

### 5. Performance gates
Every list-like ticket asserts mounted-item bounds (<= 60 with 10,000 items), memoization/referential-stability via render counters, and a recorded reference-device render budget. Chart tickets assert element-count caps, downsampling, and native-driver animation. Table tickets additionally assert row re-render isolation on sort.

## Dependency graph (summary)
E7-01 ListItem -> E7-02 List -> {E7-03 SectionList, E7-04 FlashList adapter, E7-09 DataTable view, E7-12 Timeline, E7-14 Tree, E7-18 Gallery, E7-32 MessageList}. E7-05 Skeleton feeds List states, Stat, Image, DataTable, Chart. E7-08 -> E7-09 -> E7-10 (needs E7-13). E7-16 Image -> E7-17 Avatar, E7-18. E7-19 -> E7-20, E7-21. E7-22 Chart core -> E7-23/24/25 -> E7-26. E7-29 Calendar -> E7-30 Agenda (also E7-03). E7-31 Markdown -> E7-32. Cross-stream: E4 (Box/Row/Text/Icon), E3 (reduce-motion hook), E9 (a11y checks), E10 (breakpoints), E11 (catalog/examples), E12 (perf harness), E14 (barrel exports and subpaths).

## Integration notes
- Tickets export only from their own `src/components/<Name>/index.ts`. `src/index.ts` barrel and subpath `exports` edits are intentionally excluded and owned by E14 to keep `filesTouched` disjoint.
- DataTable is split by subfolder across E7-08/09/10; E7-09 owns `DataTable.tsx` and `index.ts`.
- Possible overlap to reconcile with other streams: Avatar (E4?), Calendar vs date picker (E5), Skeleton/EmptyState vs feedback (E6), Markdown vs typography (E4). Names reserved here; first stream to land owns it.

## Rejected ideas
- Map component: adapter-only and heavy native deps (maps SDKs); a placeholder adds no value. Defer to E8 device APIs.
- Rich text editor/WYSIWYG: large, input-domain (E5), not display.
- Full CommonMark/MDX/HTML renderer: scope sink; ship a safe subset.
- Pinch-zoom/gesture engine inside Lightbox: needs gesture-handler/reanimated; expose renderItem hook instead.
- Kanban/drag-drop boards, Gantt, org-chart: low reuse, need gesture libs.
- Pivot tables, spreadsheet grid, cell editing, column resize: heavy, niche for mobile.
- Candlestick/radar/heatmap/treemap charts: low leverage; revisit after core charts stabilize.
- Skia-based charts: heavy native dep.
- Pure-View line/curve chart: poor fidelity and perf.
- Bundled blurhash decoder: dependency/size; adapter hook instead.
- Standalone Rating, Chip lists, Accordion: belong to E5/E6.
- Realtime chat transport, push notification plumbing: E8.
- Separate Pager and Carousel tickets: merged (Carousel is Pager plus peek/autoplay).
- Separate Avatar and AvatarGroup tickets: merged.
- Infinite-loop carousel: duplicate-item hack hurts virtualization.
