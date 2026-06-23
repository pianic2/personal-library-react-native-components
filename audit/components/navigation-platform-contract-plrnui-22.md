# PLRNUI-22 - Navigation Platform Contract

## Scope

This evidence covers the navigation components imported into the component-per-directory structure:

- `src/components/TopBar/TopBar.tsx`
- `src/components/BottomBar/BottomBar.tsx`
- `src/components/NavBar/NavBar.tsx`
- `src/components/Link/Link.tsx`
- `src/components/NavContext/NavContext.tsx`
- `src/components/SideBar/SideBar.tsx`
- `src/components/SideBar/SideBar.web.tsx`

No package subpath exports, router dependencies, native dependencies, drawer behavior, gesture behavior or overflow menu behavior were added.

## Platform matrix

| Component | iOS / Android contract | Web contract | Status |
| --- | --- | --- | --- |
| `TopBar` | Renders safely with omitted title/left/right content; missing slots do not render fallback text. | Same source contract; can render navigation links from `NavProvider` when items are provided. | Beta candidate, not stable. |
| `BottomBar` | Renders a bottom navigation list from `NavProvider`; visible items are limited by `maxItems`. | Same source contract, though bottom app-shell placement remains a layout responsibility. | Experimental app-shell component. |
| `NavBar` | `layout="auto"` resolves to `bottom`; explicit `bottom` and `sidebar` render safely. | `layout="auto"` resolves to `top`; explicit `top`, `bottom` and `sidebar` render safely. | Beta candidate, not stable. |
| `Link` | Uses `routerAdapter`, then `NavProvider.navigate`, then external `Linking.openURL`; without a handler it safely no-ops. | Uses `routerAdapter`, then `NavProvider.navigate`, then guarded `window` fallback only when `Platform.OS === "web" && typeof window !== "undefined"`. | Beta candidate, not stable. |
| `SideBar` | Renders a minimal vertical navigation list; it no longer returns `null`. | `SideBar.web.tsx` remains available for web platform resolution and renders a collapsible vertical list without undeclared icon dependencies. | Experimental sidebar component. |

## `bottomMaxItems` decision

`NavBar.bottomMaxItems` is applied as the `BottomBar` visible item limit. `BottomBar` renders only the first `maxItems` entries from `NavProvider.items`.

Approved behavior:

- no overflow menu;
- no implicit `More` item;
- extra items are not rendered;
- values are normalized with `Math.floor` and clamped at zero before slicing.

## `Link` router strategy

The library remains router-agnostic. `Link` exports this contract:

```ts
export type LinkRouterAdapter = {
  navigate: (href: string) => void;
};
```

Navigation priority is:

1. `routerAdapter.navigate(href)` when provided on the `Link`.
2. `NavProvider.navigate(href)` when a navigation provider is present.
3. External URL fallback through React Native `Linking.openURL` on native.
4. Guarded web `window.open` / `window.location.assign` only when `Platform.OS === "web" && typeof window !== "undefined"`.
5. Safe native no-op when no handler is available.

`onPress` remains supported and runs before the navigation strategy.

## Minimal native `SideBar`

Native `SideBar` is intentionally minimal: a themed vertical list of links rendered in a `View` / `ScrollView`. It is not a drawer, overlay, gesture surface or navigation dependency wrapper. This satisfies safe iOS/Android/Web rendering without adding dependencies.

## Public API export summary

Local barrels added:

- `src/components/BottomBar/index.ts`
- `src/components/Link/index.ts`
- `src/components/NavBar/index.ts`
- `src/components/NavContext/index.ts`
- `src/components/SideBar/index.ts`
- `src/components/TopBar/index.ts`

Root exports added in `src/index.ts`:

- `BottomBar`, `BottomBarProps`
- `Link`, `LinkProps`, `LinkRouterAdapter`
- `NavBar`, `NavBarProps`
- `NavProvider`, `useNav`, `useNavigate`, `NavItem`
- `SideBar`, `SideBarProps`, `SideBarVariant`
- `TopBar`, `TopBarProps`

No package-level deep import or functional subpath export was added.

## Test evidence

`tests/components/component-smoke.test.tsx` now covers:

- `TopBar` without slots does not render placeholder text;
- `BottomBar` / `NavBar` visible item limiting;
- `Link` no-crash behavior without a router adapter;
- `Link` `onPress` support;
- `Link` `routerAdapter` navigation;
- `SideBar` render through `NavBar` without returning `null`.

Validation evidence collected during PLRNUI-22:

```bash
npm test
# pass

npm run typecheck
# pass

npm run lint
# failed: missing script "lint"
```
