# Pager

**Stability:** beta — public consumer API, usable but contract may still change.

Horizontal paging for onboarding steps, galleries and banners, with zero dependencies beyond React Native. The folder ships three exports: `Pager` (one page fills the width), `Carousel` (peeking neighbours, snap-to-page, optional autoplay) and `PageIndicator` (dots with a "Page X of Y" label).

## Import

```ts
import { Pager, Carousel, PageIndicator } from "@personal-library/react-native-components";
import type { PagerProps, CarouselProps, PageIndicatorProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface PagerProps {
  count: number; // number of pages
  renderPage: (index: number) => ReactNode; // called only for mounted pages
  index?: number; // controlled current page (zero-based)
  defaultIndex?: number; // uncontrolled initial page, default 0
  onIndexChange?: (index: number) => void; // once per settle on a new page
  lazy?: boolean; // default true: mount only the current page +/- 1
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

interface CarouselProps extends PagerProps {
  peek?: number; // points of the neighbouring pages shown on each side, default 0
  autoplay?: boolean; // default false; stops on the last page (no loop)
  autoplayInterval?: number; // ms between advances, default 4000
}

interface PageIndicatorProps {
  count: number;
  index: number; // zero-based current page
  size?: "xs" | "sm" | "md" | "lg"; // dot diameter (theme.space key), default "sm"
  accessibilityLabel?: string; // replaces the default "Page X of Y"
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
// Controlled pager with an indicator
const [index, setIndex] = useState(0);

<Pager count={slides.length} index={index} onIndexChange={setIndex} renderPage={(i) => <Slide {...slides[i]} />} />
<PageIndicator count={slides.length} index={index} />

// A carousel that shows a peek of the next page and advances every 5 seconds
<Carousel count={banners.length} peek={24} autoplay autoplayInterval={5000} renderPage={(i) => <Banner {...banners[i]} />} />
```

## Behaviour

- Lazy mounting: by default only the current page and its two neighbours render their content; the other pages are empty frames of the same width, so a pager of 100 pages stays cheap. `lazy={false}` mounts every page.
- `onIndexChange` fires once when the pager settles on a new page (after the swipe and its momentum), never during the scroll. Changing `index` from the parent scrolls to that page and does not call `onIndexChange`.
- Carousel autoplay pauses while the user touches or drags, restarts after each page change, stops on the last page, and is off when reduced motion is on (system setting or `MotionProvider`). Its timer is cleared on unmount.
- Not included: infinite loop, vertical paging, parallax.

## Accessibility

`PageIndicator` is a single element labelled "Page X of Y" (progressbar role, value 1 to Y); the dots are hidden from assistive technology. Pages other than the current one are hidden from assistive technology.

## Stability

beta — public consumer API, usable but contract may still change.
