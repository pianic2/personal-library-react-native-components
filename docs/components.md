# Components

Questa pagina è la mappa dei componenti root-exported e dei relativi file di documentazione.

La documentazione può conservare riferimenti storici al source-tree inventory,
ma la superficie consumer corrente è la root API di
`@personal-library/react-native-components` descritta da `src/index.ts`.

## Stability labels

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component/API is classified as stable.
- source-tree inventory: historical or internal implementation inventory, not
  automatically consumer API.

<!-- catalog:begin -->
## Buttons

- Overview: [Buttons](components/buttons/index.md)
- [Button](components/buttons/button.md) — beta

## Feedback

- Overview: [Feedback](components/feedback/index.md)
- [Alert](components/feedback/alert.md) — beta
- [ProgressBar](components/feedback/progress-bar.md) — experimental
- [Spinner](components/feedback/spinner.md) — beta

## Form

- Overview: [Form](components/form/index.md)
- [Checkbox](components/form/checkbox.md) — beta
- [FormField](components/form/form-field.md) — experimental
- [Input](components/form/input.md) — beta
- [PasswordInput](components/form/password-input.md) — experimental
- [RadioGroup](components/form/radio-group.md) — beta
- [Select](components/form/select.md) — experimental
- [Switch](components/form/switch.md) — beta
- [Textarea](components/form/textarea.md) — experimental

## Layout

- Overview: [Layout](components/layout/index.md)
- [Box](components/layout/box.md) — beta
- [Column](components/layout/column.md) — beta
- [Divider](components/layout/divider.md) — beta
- [Row](components/layout/row.md) — beta

## Navigation

- Overview: [Navigation](components/navigation/index.md)
- [BottomBar](components/navigation/bottom-bar.md) — experimental
- [Link](components/navigation/link.md) — beta
- [NavBar](components/navigation/nav-bar.md) — beta
- [NavContext](components/navigation/nav-context.md) — beta
- [SideBar](components/navigation/side-bar.md) — experimental
- [TopBar](components/navigation/top-bar.md) — beta

## Overlay

- Overview: [Overlay](components/overlay/index.md)
- [BottomSheet](components/overlay/bottom-sheet.md) — experimental
- [Modal](components/overlay/modal.md) — experimental
- [Popover](components/overlay/popover.md) — experimental
- [Tooltip](components/overlay/tooltip.md) — experimental

## Surfaces

- Overview: [Surfaces](components/surfaces/index.md)
- [Badge](components/surfaces/badge.md) — beta
- [Card](components/surfaces/card.md) — experimental

## Typography

- Overview: [Typography](components/typography/index.md)
- [B](components/typography/b.md) — experimental
- [CodeInline](components/typography/code-inline.md) — experimental
- [Heading](components/typography/heading.md) — beta
- [P](components/typography/p.md) — experimental
- [Quote](components/typography/quote.md) — experimental
- [Small](components/typography/small.md) — experimental
- [Text](components/typography/text.md) — beta
- [TextGroup](components/typography/text-group.md) — experimental
<!-- catalog:end -->

> Nota: molti componenti sono basati su primitive `react-native` (Pressable/View/Text). In ambiente web tipicamente si usa React Native Web.

Source-tree-only entries such as `Code`, `Page`, `Hero` and `ToastProvider`
may appear in historical audit files but are not current root public API unless
they are exported from `src/index.ts`.
