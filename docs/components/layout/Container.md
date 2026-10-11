# Container

**Stability:** prototype — experimental, not yet exported from the package root.

A centred, width-capped layout box with breakpoint gutters. It also measures itself and provides its size to descendants, so they can react to the width of their container instead of the window.

This is the single container owner (ADR R4): it replaces the planned `PageContainer` and the plain max-width container.

## Import

```ts
import { Container, CONTAINER_WIDTHS } from "@personal-library/react-native-components";
```

## Props

```ts
type SpaceKey = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl"; // keys of theme.space

interface ContainerProps {
  size?: "sm" | "md" | "lg" | "xl" | "full" | number; // default "lg"; maximum CONTENT width
  gutter?: SpaceKey | Partial<Record<"base" | "sm" | "md" | "lg" | "xl", SpaceKey>>;
  center?: boolean; // default true
  measure?: number; // caps the content inside the gutters (reading width)
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const CONTAINER_WIDTHS = { sm: 480, md: 720, lg: 960, xl: 1200 };
```

## Usage

```tsx
<Container size="md">
  <Heading level={1}>Settings</Heading>
</Container>

// An explicit width, wider gutters on large windows
<Container size={1024} gutter={{ base: "md", lg: "xl" }}>
  <Page />
</Container>

// Descendants read the size of their container
function Gallery() {
  const { width } = useContainerSize();
  const bp = useContainerBreakpoint();
  return <Grid columns={bp === "base" ? 1 : 3} width={width} />;
}
```

## Behaviour

- The outer box is `width: 100%` with horizontal padding (the gutter) and a `maxWidth` of the content size plus both gutters, so the **content** is never wider than `size`. Below the maximum the content is the full width minus the gutters; above it the box is centred with equal margins.
- Default gutters come from the spacing scale by window breakpoint: 16 below `md`, 24 from `md`, 32 from `lg`. `gutter` takes a `theme.space` key or a map from breakpoint to key (mobile-first).
- `useContainerSize()` returns `{ width, height, source }` of the nearest Container, or of the window (`source: "window"`) outside one. `useContainerBreakpoint(map?)` returns the breakpoint of that width (default scale from the `ResponsiveContext`, `map` replaces the minimum widths).
- Layout changes smaller than 1 px are ignored, so a layout cannot loop; a change of 1 px or more re-renders the consumers. Nested Containers: the nearest one wins.
- **First-layout caveat**: before `onLayout` fires, the context holds the window width capped by the maximum, so the first paint can differ from the measured width by a frame; the measured size replaces it as soon as it is known.

## Accessibility

A plain `View`: no role, no accessibility props.
