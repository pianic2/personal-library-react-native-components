# E4 + E5 New-Component Roadmap (Primitives/Layout/Typography/Surfaces; Inputs/Forms/Selection)

Evidence base: `src/index.ts`, `src/components/{Button,Input,FormField,Box}/*.tsx`, `src/theme/types.ts`, `src/tokens/colors.base.ts`, `package.json` scripts, `docs/components/*` categories, `tests/` layout.
Tickets: `audit/texo-v1/tickets/E4.json` (22), `E5.json` (29).

## 1. Conventions observed (new work must follow)
- One directory per component: `src/components/<Name>/{<Name>.tsx,index.ts}`; barrel `src/index.ts` exports component + `<Name>Props`.
- Theming only via `useTheme()` -> `{theme, colors}`; spacing/radius/shadow keys from `theme.space/radius/shadows`; component tokens under `theme.components.*` (only button/input/card typed today). No hex literals in components.
- Pressables: `accessibilityRole`, `accessibilityState`, min 44pt target (Button), disabled/pressed opacity from tokens.
- Problems to fix by composition rather than copy: Button/Input hand-roll Pressable and sizing; `Input` embeds its own label (blocks composition); `FormField` guesses child props with `cloneElement` + `"error" in props`; icons are ad-hoc `ComponentType<{size,color}>`; no controlled/uncontrolled helper; no form state; no portal (Modal/Popover/Tooltip rely on native layering).
- Rule for new tickets: no new theme token keys (avoids conflicts on `src/theme/types.ts`; E2 owns token growth). Shared barrels (`src/index.ts`, snapshot, mkdocs, package.json) are touched only by two serialized wiring tickets (E4-22 then E5-29). Every component ticket owns `src/components/<Name>/**`, `tests/components/<Name>.test.tsx`, `docs/components/<cat>/<Name>.md` (disjoint).
- Maturity target for all tickets: `demo` (real rendering, typed API, states, theme, example, catalog entry via `<Name>.catalog.ts`, minimal tests).

## 2. Composition graph (A --> B means A is built on B)

```
LOW LEVEL (no deps)           Slot <-- useMergedRefs/useControllableState        Portal      Icon <-- IconGlyphs
                                |
Touchable (asChild via Slot) ---+
Surface (on Box+Slot)            Skeleton   Spacer  Grid(useBreakpoint)  Container  List  CodeBlock

E4 CONSUMERS
Avatar --> Touchable, Icon, Skeleton           AvatarGroup --> Avatar
Chip --> Touchable, IconGlyphs                 ListItem --> Touchable, Icon
Collapsible --> Slot, useControllableState     Accordion --> Collapsible, Surface, Icon
ExpandableText --> Touchable, useControllableState
Screen --> useControllableState(refresh), safe-area adapter

E5 FOUNDATION
validation(Resolver, rules) <-- useForm <-- Form --> Field --> Label
zod adapter --> Resolver (structural, no zod import)
inputPresets <-- Form (autofill defaults)
useKeyboard <-- FormLayout --> Screen
mask engine <-- MaskedInput --> Input

E5 CONSUMERS
OTPInput, Slider --> useControllableState
RangeSlider --> Slider math
ToggleGroup --> Touchable, Icon, useControllableState <-- SegmentedControl
NumberInput --> Touchable, Chip? (no) / Icon, useControllableState
Calendar --> Touchable, Icon ; DatePicker --> Calendar, Portal, Surface ; TimePicker --> Portal, Surface
datetimepicker adapter --> DatePicker/TimePicker adapter contract (optional native module)
Combobox --> Portal, Surface, ListItem, Icon ; MultiSelect --> Combobox, Chip
SearchBar --> Touchable, Icon, useControllableState (uses existing useDebounce)
Rating --> Icon, Touchable ; CheckboxGroup --> Checkbox(existing), useControllableState
FileField --> ListItem, Touchable, Icon, ProgressBar(existing), Avatar ; expo adapter --> FilePickerAdapter contract
```

Critical path: `useControllableState -> Slot -> Touchable -> Icon -> (everything)`. Wave 1: E4-01..05, E5-02, E5-04, E5-07, E5-25, E5-28, Skeleton, Portal, Grid, List. Wave 2: Surface, Screen, Avatar, Chip, ListItem, Collapsible, useForm, Field, Slider, OTP, NumberInput, SearchBar, Rating. Wave 3: Form, FormLayout, Combobox, Calendar, DatePicker, SegmentedControl, FileField. Wiring last.

## 3. Rationale per accepted item (high value only)
| Item | Why |
|---|---|
| Slot/asChild, useControllableState, useMergedRefs | Removes wrapper nesting and re-implemented controlled logic across ~15 components |
| Touchable | Single owner of press feedback, 44pt targets, loading/disabled, focus ring |
| Icon + glyph set | Unifies ad-hoc icon props; optional-peer adapters keep deps out of core |
| Surface | Dark-mode elevation (shadows vanish in dark); semantic base for cards/popovers/sheets |
| Screen | Safe area + scroll + status bar + keyboard + footer in one root; huge boilerplate cut |
| Portal | Needed for dropdown/picker/toast layering without native Modal; keeps theme context |
| Grid, Container | Real responsive gaps (feeds E10) not covered by Row/Column |
| Skeleton, Avatar, Chip, ListItem | Highest-reuse display primitives; each underpins 2+ other tickets |
| Collapsible/Accordion, ExpandableText, List, CodeBlock | Common content/disclosure patterns with a11y state; Accordion thin on Collapsible. CodeBlock low priority (docs/showcase). |
| Spacer, AvatarGroup | Low priority, tiny (S) and cheap; droppable first if scope shrinks |
| useForm + validation + zod adapter | Biggest form boilerplate; schema-agnostic Resolver, zod via structural typing so no hard dep |
| Label, Field, Form | Replaces cloneElement guessing in FormField with explicit a11y wiring (labelled-by/described-by, live-region errors) |
| useKeyboard, FormLayout | Keyboard covering inputs is the most common RN form bug |
| OTPInput, NumberInput, Slider, RangeSlider, SegmentedControl, ToggleGroup, Rating, SearchBar, CheckboxGroup | Missing standard controls; all implemented JS-only (PanResponder/Animated), Expo Go and web compatible |
| Calendar, DatePicker, TimePicker (+native adapter) | JS-first for consistency and testability; native `datetimepicker` isolated behind adapter (optional peer, lazy require, fallback) |
| Combobox, MultiSelect | Select lacks search/async/multi; headless `useCombobox` keeps a11y logic testable |
| FileField (+expo adapter) | UI/validation native-free; picker is an injected adapter because expo-image-picker/document-picker are native modules |
| mask engine, MaskedInput, inputPresets | Pure engine with caret handling; presets give correct autofill hints cheaply (agent token saver) |

## 4. Rejected / mediocre ideas
- **Center, AspectRatio, ZStack/Layer**: one-line `Box` style (`alignItems/justifyContent`, `aspectRatio`, `position:absolute`). Better as optional Box props (`center`, `flex`, `aspect`) in an E1 ticket; separate components add API surface without behavior.
- **Separator**: duplicates existing `Divider`; extend Divider in E1 (orientation, inset) instead.
- **VisuallyHidden**: `accessibilityLabel` covers native; only relevant on web, where RN-web already handles it. Revisit in E9 if web audit finds gaps.
- **Standalone ScrollView wrapper**: folded into `Screen` (scroll prop, refresh, insets); a thin wrapper adds nothing.
- **HelperText / ErrorText standalone**: parts of `Field` (`Field.Hint`, `Field.Error`) with a11y wiring; standalone versions would be `Small` with color.
- **Tag**: alias of Chip/Badge.
- **Syntax highlighter in CodeBlock**: bundle size and dependency cost; CodeBlock stays plain.
- **Markdown/Prose renderer**: heavy, belongs to E7 if wanted.
- **Gradient/Blur components**: native modules; handled as optional `Surface material='glass'` fallback and E8.
- **Wizard Stepper** (not NumberInput): navigation/app-shell, E6.
- **TagInput** (free-text chips): covered by `Combobox creatable` + `MultiSelect`.
- **Per-type input wrappers** (EmailInput, PhoneInput...): replaced by `inputPresets` spread bundles, which have no component overhead.
- **Native-backed Slider / Switch variants**: contradict Expo Go + web compatibility goal.
- **Field arrays in useForm**: deferred past v1 to keep API small.
- **useResponsiveValue / Hidden-Show**: E10 owns responsive primitives; Grid/Container only consume `useBreakpoint`.

## 5. API sketches for the 10 most important

### 5.1 Touchable
```tsx
<Touchable
  onPress={...} disabled loading
  feedback="opacity" | "scale" | "ripple" | "none"
  minTarget={44} hitSlop haptic="light"       // haptic via optional adapter, no-op otherwise
  role="button" | "link" | "tab" | "checkbox" | "radio" | "switch" | "menuitem"
  asChild accessibilityLabel
  style={(state: {pressed:boolean; focused:boolean; disabled:boolean}) => StyleProp<ViewStyle>}
/>
```
States: default/pressed/focused(web ring `colors.primary`)/disabled/loading(busy, blocks presses). Button/Chip/ListItem/Link become wrappers.

### 5.2 Slot
```tsx
<Slot {...props}>{singleElement}</Slot>
mergeProps(slotProps, childProps) // style concat (child last), handlers chained, refs merged, child a11y wins
```

### 5.3 Icon
```tsx
<Icon name="check" size="sm" color="primary" label?="Done" set?="default" />
<IconProvider sets={{ default: glyphIconSet, brand: createIconSet({...}) }} />
type IconSetAdapter = { render(name, {size,color}): ReactElement|null; names?: string[] }
createSvgIconSet(paths) // lazy react-native-svg (optional peer)
```
No label => decorative (hidden from a11y tree); label => image role.

### 5.4 Screen
```tsx
<Screen scroll edges={['top','bottom']} padding="md" keyboardAvoiding statusBar="auto"
        header={<TopBar/>} footer={<Button/>} onRefresh refreshing />
useScreenInsets() // {top,bottom,left,right}; safe-area-context optional, RN fallback
```

### 5.5 Portal
```tsx
<PortalProvider><App/></PortalProvider>
<Portal host?="overlay"><Surface level={2}>...</Surface></Portal>
usePortal() => { mount(key,node), update(key,node), unmount(key) }
```
Re-provides Theme/Nav context captured at the `Portal` call site.

### 5.6 useForm + Form + Field
```tsx
const form = useForm({ defaultValues:{email:'',age:null}, validateOn:'blur',
  resolver: createResolver({ email:[rules.required(), rules.email()] }) /* or zodResolver(schema) */,
  onSubmit: async v => api.save(v) });

<Form form={form}>
  <Form.Field name="email" label="Email" hint="We never share it" required>
    <Input {...inputPresets.email} />
  </Form.Field>
  <Form.Submit label="Save" />
</Form>
```
`type Resolver<T> = (values:T) => Errors<T> | Promise<Errors<T>>`. Returns `values, errors, touched, dirty, isValid, isSubmitting, setValue, setError, reset, validate, handleSubmit, getFieldProps(path)`.

### 5.7 Field (compound, a11y wired)
```tsx
<Field status="error" required>
  <Field.Label>Email</Field.Label>
  <Field.Control><TextInput/></Field.Control>      // receives nativeID/labelledBy/describedBy/invalid
  <Field.Hint>...</Field.Hint>
  <Field.Error>{errors.email}</Field.Error>        // live region polite; hidden when empty
</Field>
```

### 5.8 OTPInput
```tsx
<OTPInput length={6} type="numeric" secure={false} onComplete={code=>verify(code)}
          separatorAt={3} error={!!err} autoFocus />   // single hidden TextInput, oneTimeCode autofill
ref: { focus(), clear() }
```
Announced as one field "Verification code, 6 digits".

### 5.9 Combobox (+ useCombobox)
```tsx
<Combobox options={opts} value={v} onValueChange={setV} onInputChange={q=>search(q)}
          loading={isFetching} creatable onCreate={add} presentation="dropdown"|"sheet"
          emptyMessage="No results" label="Country" clearable />
useCombobox(opts) => { getInputProps, getListProps, getOptionProps(i), highlightedIndex, isOpen }
```
Built on Portal + Surface + ListItem; announces "N results".

### 5.10 DatePicker / Calendar
```tsx
<Calendar mode="range" value={range} onValueChange={setRange} minDate firstDayOfWeek={1} locale="it-IT" />
<DatePicker value={date} onChange={setDate} label="Birthday" min max clearable
            presentation="auto"|"sheet"|"popover"
            adapter={createNativeDatePickerAdapter() /* optional native module */} />
type DatePickerAdapter = { open(opts): Promise<Date|null> }
```
Native-module caveats: `@react-native-community/datetimepicker` needs dev client/prebuild outside Expo Go version pins, differs iOS (inline/compact) vs Android (imperative dialog) and is unsupported on web; therefore the default is the pure-JS Calendar (Intl-based, no date library), and the native picker is an opt-in adapter with lazy require and JS fallback. Hermes `Intl` needed (RN >= 0.70).

## 6. Risks and open decisions
1. Path types (`Path<T>`) can slow `tsc`; capped depth plus type contract tests (`npm run typecheck:contracts`).
2. PanResponder sliders inside ScrollView need gesture capture rules; document; reanimated/gesture-handler optional enhancement later.
3. Optional peers (`react-native-svg`, `react-native-safe-area-context`, `expo-blur`, datetimepicker, expo pickers) must use guarded lazy requires and be tested in both branches; consumer smoke must pass without them.
4. Portal must re-provide contexts; coordinate with E6 (Modal/Popover/Tooltip migration) and E3 (reduced-motion hook; Skeleton/Collapsible/SegmentedControl use `AccessibilityInfo` until it lands).
5. `Input` still renders its own label; `Field` composes best once Input gains a `bare` mode (E1 ticket, not part of E4/E5).
6. package.json `exports` for `./zod` and `./adapters/*` conflicts with E14; wiring ticket E5-29 must coordinate.
7. Texo cutover: all new files use the existing package namespace only; no package names embedded in code besides `PACKAGE_NAME` in `src/index.ts`, so the shim can re-export unchanged.
