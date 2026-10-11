# Responsive layout

**Stability:** prototype. The responsive area is not exported from the package root yet (the wiring tickets own `src/index.ts`); import from the area barrel in the source tree:

```ts
import { Show, SplitView, useWindowSizeClass } from "./responsive/index.js";
```

Everything here reads the window size (or the size of a `Container`) and works without any native module. A runnable composition is in `examples/responsive.tsx`.

## Breakpoints

`useBreakpoint()` returns the breakpoint of the window **width** on every platform: `"base"` (below 480), `"sm"` (480), `"md"` (768), `"lg"` (1024) and `"xl"` (1280). `useBreakpointInfo()` also returns the window size and `isAtLeast(bp)` / `isBelow(bp)`. The minimum widths are the `breakpoints` tokens (`xs` is the name of the range `"base"`).

```tsx
const { isAtLeast } = useBreakpointInfo();
const wide = isAtLeast("md");
```

## Size classes

`useWindowSizeClass()` returns `{ width, height }`, each `"compact"`, `"medium"` or `"expanded"`. The defaults are width 600 / 840 and height 480 / 900. `useOrientation()` returns `"portrait"` or `"landscape"`. `classifySize` and `resolveWindowSizeClass` are the pure rules.

## Overrides

`ResponsiveProvider` overrides the breakpoint scale (`breakpoints`), the size-class thresholds (`sizeClasses`) or the window size (`window`, for server rendering, previews and tests). An invalid scale is rejected in development. The provider also accepts `orientationLock` and stores it in the responsive context, but no hook reads it yet: `useOrientation` follows the window.

```tsx
<ResponsiveProvider breakpoints={{ md: 800 }} window={{ width: 1024, height: 768 }}>
  <App />
</ResponsiveProvider>
```

## Show, Hide and Responsive

```tsx
<Show above="md">Tablet and wider</Show>
<Hide below="md">Hidden on phones</Hide>
<Show sizeClass="expanded">Expanded width only</Show>
<Responsive base={<PhoneNav />} lg={<SideNav />} />
```

`Show` and `Hide` take `above`, `below`, `at`/`only` and `sizeClass`; every given condition must hold. By default hidden children are unmounted; `keepMounted` hides them with `display: "none"` instead, inside a `View` that takes part in layout. `Responsive` renders the node of the current breakpoint, falling back to the nearest smaller one. On web there is no hydration-mismatch guard: the breakpoint comes from the window size, which a server render does not have, so render these components on the client only or give the server a fixed size with `ResponsiveProvider window={...}`.

## Responsive values

`useResponsiveValue({ base: 1, md: 2, lg: 3 })` returns the value of the current breakpoint with the same mobile-first fallback. `resolveResponsive(value, bp)` is the pure rule; a plain value is returned as it is.

## Containers

`Container` centres its content, caps its width (`size`: `"sm"`, `"md"`, `"lg"`, `"xl"`, `"full"` or a number) and applies breakpoint gutters. It also provides its measured size: `useContainerSize()` returns `{ width, height, source }` (the window size outside a container) and `useContainerBreakpoint()` the breakpoint of that width, so a component reacts to the space it has, not to the window.

## Large text

`useIsLargeText(threshold = 1.3)` is true when the system font scale reaches the threshold. `StackOnLargeText` lays its children in a row and switches to a column when the text is large, so labels and values do not clip:

```tsx
<StackOnLargeText gap="sm">
  <Text>Balance</Text>
  <Text>1 240,00</Text>
</StackOnLargeText>
```

## Devices and foldables

`useDeviceClass()` returns `"phone"`, `"tablet"` or `"desktop"` for the current **window and platform**, not the hardware: on native a shortest window side of 600 or more is a tablet (an iPad always is), macOS and Windows are desktop, and on web a desktop needs a fine pointer and a width of at least 1024. `useAspectPosture()` returns `"normal"`, `"wide"` (width/height of 1.6 or more) or `"square-ish"` (0.8 to 1.25); it is a heuristic on the window shape, not a posture sensor. The library has no native fold dependency: an app that wants real fold data wraps a native module in a `FoldAdapter` and provides it with `FoldAdapterProvider`; `useFoldState()` then returns `{ isFolded, hingeBounds? }`. Without an adapter the device is never folded.

```tsx
const adapter: FoldAdapter = { useFoldState: () => useMyWindowManagerFold() };

<FoldAdapterProvider adapter={adapter}>
  <App />
</FoldAdapterProvider>
```

## Tablet master-detail

`SplitView` shows `primary` and `secondary` side by side from the `medium` width class, with a divider (`theme.colors.border`) and a primary width of `ratio` of the available width clamped to `minPrimary`..`maxPrimary` (default 0.35, 320 to 420). Below that width it shows one pane: the primary, or the secondary when `showSecondary` is set; a back button appears above the secondary pane only when `onBack` is also given.

```tsx
<SplitView
  primary={<MessageList onSelect={open} />}
  secondary={<MessageView />}
  showSecondary={selected !== null}
  onBack={() => setSelected(null)}
/>
```

## Safe-area insets

The library does not import a safe-area package. Read the insets from the provider of your choice and pass them to the bars that accept `insets`:

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context"; // an app dependency, not the library's

function AppBar() {
  const insets = useSafeAreaInsets();
  return <TopBar title="Home" insets={insets} />;
}
```

## Migration

### `useBreakpoint` now follows the width on every platform

Before, `useBreakpoint()` returned `"base"` for every native device (a tablet got the phone layout) and used the width only on web. Now it resolves from the window width everywhere, with the thresholds above.

- On iOS and Android it returns `"sm"`, `"md"`, `"lg"` or `"xl"` where it returned `"base"`. Layouts that branched on `"base"` for native now see the wider names on tablets.
- On web, widths from 480 to 639 change from `"base"` to `"sm"` (the `sm` cut-off moves from 640 to 480). The `breakpoints` token gains `xs: 0` and `sm` changes from 360 to 480.
- Branch on the width-based name, or use `useBreakpointInfo().isAtLeast("md")` for "tablet or wider". If a phone-only layout is required on native, check `Platform.OS` explicitly.
- `"base"` stays as the name of the range below `sm`.
