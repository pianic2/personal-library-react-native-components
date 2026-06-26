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

## Layout

- Overview: [Layout](components/layout/index.md)
- [Box](components/layout/box.md) — beta
- [Row](components/layout/row.md) — beta
- [Column](components/layout/column.md) — beta; `Stack` root alias beta / non-stable
- [Divider](components/layout/divider.md) — beta

## Typography

- Overview: [Typography](components/typography/index.md)
- [Text](components/typography/text.md) — beta
- [Heading](components/typography/heading.md) — beta
- [P](components/typography/p.md) — beta
- [B](components/typography/b.md) — beta
- [Small](components/typography/small.md) — beta
- [CodeInline](components/typography/code-inline.md) — beta / non-stable
- [Quote](components/typography/quote.md) — beta
- [TextGroup](components/typography/text-group.md) — beta

## Form

- Overview: [Form](components/form/index.md)
- [Input](components/form/input.md) — beta
- [PasswordInput](components/form/password-input.md) — beta / non-stable
- [Textarea](components/form/textarea.md) — beta / non-stable
- [Checkbox](components/form/checkbox.md) — beta
- [Switch](components/form/switch.md) — beta
- [RadioGroup](components/form/radio-group.md) — beta
- [Select](components/form/select.md) — experimental
- [FormField](components/form/form-field.md) — beta

## Navigation

- Overview: [Navigation](components/navigation/index.md)
- [NavContext](components/navigation/nav-context.md) — `NavProvider` beta; helper hooks internal / non-stable unless separately promoted
- [NavBar](components/navigation/nav-bar.md) — beta
- [TopBar](components/navigation/top-bar.md) — beta / non-stable
- [BottomBar](components/navigation/bottom-bar.md) — experimental
- [SideBar](components/navigation/side-bar.md) — experimental
- [Link](components/navigation/link.md) — beta

## Feedback

- Overview: [Feedback](components/feedback/index.md)
- [Alert](components/feedback/alert.md) — beta
- [ProgressBar](components/feedback/progress-bar.md) — beta / non-stable
- [Spinner](components/feedback/spinner.md) — beta

## Overlay

- Overview: [Overlay](components/overlay/index.md)
- [Modal](components/overlay/modal.md) — experimental
- [BottomSheet](components/overlay/bottom-sheet.md) — experimental
- [Popover](components/overlay/popover.md) — experimental
- [Tooltip](components/overlay/tooltip.md) — experimental

## Surfaces

- Overview: [Surfaces](components/surfaces/index.md)
- [Badge](components/surfaces/badge.md) — beta
- [Card](components/surfaces/card.md) — beta / non-stable

## Button

- Overview: [Buttons](components/buttons/index.md)
- [Button](components/buttons/button.md) — beta

> Nota: molti componenti sono basati su primitive `react-native` (Pressable/View/Text). In ambiente web tipicamente si usa React Native Web.

Source-tree-only entries such as `Code`, `Page`, `Hero` and `ToastProvider`
may appear in historical audit files but are not current root public API unless
they are exported from `src/index.ts`.
