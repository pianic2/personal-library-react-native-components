# Icon

**Stability:** prototype — experimental, not yet exported from the package root.

Draws an icon by name from pluggable icon sets. Decorative by default, an image when it has a label.

## Import

```ts
// not exported from the package root yet (E14 wave-wiring); until then:
import { Icon, IconProvider, createIconSet, createSvgIconSet, iconFromComponent } from "<package>/src/components/Icon";
```

## Props

```ts
interface IconProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | number; // 12, 16, 20, 24; default "md"
  color?: ThemeColorKey | string;             // default "textPrimary"
  label?: string;                             // absent: decorative
  set?: string;                               // default "default"
}

type IconSetAdapter = {
  render(name: string, options: { size: number; color: string }): ReactElement | null;
  names?: string[];
};
```

## Usage

```tsx
const icons = createIconSet({ check: CheckGlyph, close: iconFromComponent(CloseFromLibrary) });
import * as Svg from "react-native-svg"; // the app installs it; the library never imports it
const brand = createSvgIconSet(Svg, { logo: "M12 2 L22 22 L2 22 Z" });

<IconProvider sets={{ default: icons, brand }}>
  <Icon name="check" color="success" label="Saved" />
  <Icon name="logo" set="brand" size={32} />
</IconProvider>
```

## Behavior

- **Sets:** `IconProvider` registers sets by name; a nested provider adds to, and wins over, its parent. `createIconSet(map)` builds a set from components that take `{ size, color }`, `createSvgIconSet(svgModule, paths)` from SVG path data in a 24x24 view box using the injected `react-native-svg` module (it throws a descriptive error when called without it; the library never imports it), and `iconFromComponent(Comp)` adapts any component that takes `size` and `color`.
- **Sizes:** the fixed 12, 16, 20 and 24 scale (the theme has no icon size token yet) or any number.
- **Colour:** a colour token of the current theme, or any colour string; default `textPrimary`.
- **Accessibility:** without `label` the icon is decorative and hidden from assistive technology; with `label` it is an image with that `accessibilityLabel`. It never receives focus.
- **Unknown name or set:** renders nothing and warns once per name in `__DEV__`.

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring).
