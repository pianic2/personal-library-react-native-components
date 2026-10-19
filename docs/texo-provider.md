# TexoProvider

`TexoProvider` is the composition root: one component that mounts every provider of the library in a fixed order, so an app does not repeat the wiring and cannot get the order wrong. Every provider is still exported from its own module for advanced setups.

It lives in `src/providers/TexoProvider.tsx` and is not exported from the package root yet.

## Usage

```tsx
<TexoProvider
  preset={brand}
  preference="system"
  density="regular"
  locale={{ locale: "it-IT" }}
  motion={{ reduceMotion: "system" }}
  adapters={adapters}
  icons={icons}
  nav={{ items, adapter: routerAdapter }}
>
  <App />
</TexoProvider>
```

## Props

| Prop | Type | Goes to |
| --- | --- | --- |
| `theme` | token overrides | `ThemeProvider` `themeOverrides` |
| `preset` | `defineTheme` preset | `ThemeProvider` |
| `preference` | `light`, `dark`, `system` | `ThemeProvider` |
| `density` | density level | `ThemeProvider` |
| `locale` | `LocaleProvider` props without `children` | `LocaleProvider` |
| `motion` | `MotionProvider` props without `children` | `MotionProvider` |
| `adapters` | capability adapters | `CapabilityProvider` |
| `icons` | icon sets | `IconProvider` |
| `nav` | `NavProvider` props without `children` | `NavProvider` (omitted when not given) |

Hoist or memoize `adapters`, `icons` and `nav`: a new object on every render re-renders their consumers.

## Provider order

Outermost first. The order is part of the public contract.

1. `ThemeProvider` (theme, preset, preference, density)
2. `LocaleProvider`
3. `MotionProvider`
4. `ResponsiveProvider`
5. `CapabilityProvider` (haptics, keyboard, safe area and the other adapters)
6. `IconProvider` (only with `icons`)
7. `NavProvider` (only with `nav`)
8. Root `OverlayHost`, around `children`

The root `OverlayHost` owns the overlay stack, Android Back and the web Escape key. Do not mount a second root host inside `TexoProvider`; nested hosts inside a native window such as `Modal` are fine. `ToastViewport` is mounted by its own ticket (E6-35).

## Singleton contexts

`createSingletonContext(name, defaultValue)` registers a context on `globalThis[Symbol.for("texo.<name>")]`. When two copies of the library are loaded they share the first context, so a provider of one copy is seen by the hooks of the other. A second registration logs one warning in development. `ThemeContext` uses it; the other contexts are not converted yet.
