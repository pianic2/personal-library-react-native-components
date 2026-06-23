# PLRNUI-5 - Component Platform Limitations

## Scope

Platform notes for exported component-like symbols, with emphasis on `experimental` components as required by ADR 0003 and Risk Assessment 0003.

PLRNUI-25 note: the current platform support matrix is `audit/components/component-platform-support-matrix-plrnui-25.md`. This file remains a limitations register and must not be read as a stable support claim.

## Explicit web-only or native-fallback behavior

| Component | Maturity | Evidence | Web behavior | Native behavior | Required documentation before promotion |
| --- | --- | --- | --- | --- | --- |
| `SideBar` | experimental | `src/components/SideBar/SideBar.web.tsx`, `src/components/SideBar/SideBar.tsx`, `audit/components/navigation-platform-contract-plrnui-22.md` | Web implementation renders collapsible sidebar. | Native implementation renders a minimal vertical list; it is not a drawer, overlay or gesture surface. | State richer sidebar behavior as experimental; document native fallback limits. |
| `Tooltip` | experimental | `components/overlay/Tooltip.tsx`, `docs/components/overlay/tooltip.md` | Renders hover/press tooltip content. | Returns only `children`; tooltip content is not rendered. | State `web-only content`; document native fallback or implement one. |
| `Popover` | experimental | `components/overlay/Popover.tsx`, `docs/components/overlay/popover.md` | Renders positioned popover content. | Returns only trigger output; popover children are not rendered. | State `web-only content`; document native fallback through `Modal`/`BottomSheet`. |

## Platform behavior not yet proven

| Component | Maturity | Evidence | Limitation | Stable requirement |
| --- | --- | --- | --- | --- |
| `ToastProvider` | experimental | `components/feedback/ToastProvider.tsx`; `audit/02-component-inventory.md` | Uses web-specific implementation detail and timer lifecycle needs review. | Confirm native rendering path, lifecycle cleanup and accessibility announcements. |
| `Modal` | experimental | `components/overlay/Modal.tsx`; `audit/api/export-matrix.md` | RN modal styling/dismiss behavior is not verified across web/native. | Define dismiss, focus, accessibility and backdrop behavior by platform. |
| `BottomSheet` | experimental | `components/overlay/BottomSheet.tsx`; `audit/02-component-inventory.md` | Gesture, keyboard and snap behavior are incomplete. | Define mobile-first gesture/keyboard contract and web fallback. |
| `Select` | experimental | `components/form/Select.tsx`; `audit/02-component-inventory.md` | Modal select behavior lacks keyboard and accessibility contract. | Define keyboard, screen reader, focus and platform modal behavior. |
| `Code` | experimental | `components/typography/Code.tsx`; `utils/clipboard.ts`; docs `docs/components/typography/code.md` | Clipboard behavior depends on Expo/web clipboard support and cleanup. | Document clipboard dependency and add native/web smoke coverage. |
| `Page` | experimental | `components/typography/Page.tsx`; `audit/api/export-matrix.md` | App-level `ScrollView` layout inside typography API. | Decide whether this is library API or app shell helper; document platform layout expectations. |
| `Hero` | experimental | `components/surfaces/Hero.tsx`; `audit/02-component-inventory.md` | Uses hardcoded screen-height behavior. | Define responsive/platform sizing contract or keep out of stable root. |
| `TopBar` | experimental | `components/navigation/TopBar.tsx`; `audit/02-component-inventory.md` | Slot/fallback behavior is not stable. | Remove placeholder fallback and verify web/native slot rendering. |
| `BottomBar` | experimental | `components/navigation/BottomBar.tsx`; `audit/02-component-inventory.md` | Absolute positioning and item limits need mobile/web validation. | Add layout/accessibility support matrix and responsive tests. |
| `Link` | beta | `components/navigation/Link.tsx`; `audit/02-component-inventory.md` | Uses direct web navigation fallback; no router adapter contract. | Define web/native router strategy and document supported navigation integration. |
| `Box` | beta | `components/layout/Box.tsx`; `audit/02-component-inventory.md` | Web `boxShadow` behavior is not normal React Native behavior. | Document shadow support by platform and test style output. |

## Native dependencies and package support context

Evidence:

- `package.json` declares `react-native`, `react-native-web`, `react-native-safe-area-context`, `react-native-svg`, `expo-clipboard` and async-storage dependencies.
- ADR 0005 and ADR 0007 require Expo/RN/Web setup and platform support to be documented before release readiness.
- `audit/api/deep-import-audit.md` notes preview/demo shims can hide real consumer requirements.

Stable promotion requirements:

- Each promoted component must state supported platforms: iOS, Android, Web.
- Components that omit content or render a reduced fallback on native must remain `experimental` unless the behavior is the documented contract.
- Components depending on web hover, fixed positioning, browser `window`, clipboard, native modal or gesture behavior need explicit support notes and smoke tests.
