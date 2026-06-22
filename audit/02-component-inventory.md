# 02 - Component Inventory

## Summary

Stato apparente:

- Stabili/parzialmente stabili: `Box`, `Row`, `Column`, `Text`, `P`, `B`, `Small`, `Heading`, `Quote`, `Spinner`, `Badge`, `Hero`, hook base.
- Parziali: `Button`, `Input`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `Alert`, `ToastProvider`, `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `NavBar`, `TopBar`, `BottomBar`, `Link`.
- Rotto o ad alto rischio runtime: `Card`, `ProgressBar`, `CodeInline`, `Textarea`.
- Sperimentale/web-only: `SideBar.web.tsx`, `Tooltip`, `Popover`, `liquidglass`.

## Exported Components

| Area | Export | Props principali | Dipendenze interne | Stato | Criticita |
| --- | --- | --- | --- | --- | --- |
| Button | `Button` | `icon`, `label`, `onPress`, `variant`, `size`, `disabled` | `useTheme` | Parziale | `info` non gestita; props non esportate; hardcoded size |
| Layout | `Box` | `padding`, `margin`, `bg`, `radius`, `border`, `shadow` | `useTheme` | Parziale stabile | web `boxShadow` non tipico RN; props non esportate |
| Layout | `Row` | `gap`, `align`, `justify`, `wrap`, `flex` | `useTheme` | Parziale stabile | prop `flex` dichiarata ma non applicata |
| Layout | `Column`, `Stack` | `gap`, `align`, `justify`, `flex` | `useTheme` | Parziale stabile | wrap di ogni child in `View`, chiavi per indice |
| Layout | `Divider` | `thickness`, `spacing`, `style` | `useTheme` | Parziale | doppia chiamata a `useTheme()` nello stesso render |
| Typography | `Text` | `variant`, `size`, `weight`, `align`, `truncate` | `useTheme` | Stabile | default `align="justify"` discutibile per UI |
| Typography | `Heading` | `level`, children | `Text`, `useTheme` | Stabile | `children: string` limita contenuti React |
| Typography | `P`, `B`, `Small` | props di `Text` | `Text` | Stabile | props type non esportato |
| Typography | `Code` | `children`, `textStyle` | `copyToClipboard`, icons | Parziale | timer non pulito su unmount |
| Typography | `CodeInline` | props di `Text` | `Text`, `useTheme` | Rotto | usa `props.size` come indice anche quando undefined |
| Typography | `Quote` | `children` | `Text`, `useTheme` | Stabile | props minime, non estende ViewProps |
| Typography | `TextGroup` | `spacing`, `children` | `useTheme` | Stabile | chiavi per indice |
| Typography | `Page` | `ScrollViewProps` | `useTheme` | Parziale | layout app-level dentro typography |
| Form | `Input` | `label`, `size`, `error`, `helperText`, `editable`, icons | `P`, `Small`, `Box`, `Row` | Parziale | label obbligatoria; decorazione hardcoded; focus handlers sovrascrivono consumer |
| Form | `PasswordInput` | `any` | `Input` | Rotto/parziale | toggle su `onPressIn` dell'intero input, nessuna icona, props `any` |
| Form | `Textarea` | `any` | `Input`, `useTheme` | Rotto | usa `theme.spacing["md"]`, ma `spacing` usa chiavi numeriche |
| Form | `Checkbox` | `checked`, `onChange`, `label`, `disabled` | `Text`, icon | Parziale | manca accessibility role/state |
| Form | `Switch` | `value`, `onChange`, `label`, `disabled` | `Text` | Parziale | animazione assente, hardcoded dimensions |
| Form | `RadioGroup` | `value`, `onChange`, `options` | `Text` | Parziale | manca disabled/accessibility; option type non esportato |
| Form | `Select` | `options`, `value`, `onChange`, `placeholder`, `error` | `Modal`, `Text`, icon | Parziale | modal base, no keyboard/a11y, placeholder con carattere Unicode |
| Form | `FormField` | `label`, helper/error/status, child | `P`, `Small`, `B` | Parziale | clone props euristico; status/variant non garantiti |
| Feedback | `Alert` | `title`, `variant`, `message`, action | `Text`, `Button` | Parziale | `ghost` action su bg colorato puo avere contrasto errato |
| Feedback | `ProgressBar` | `progress`, `color` | `useTheme` | Rotto | width calcolata e non applicata |
| Feedback | `Spinner` | `size` | `ActivityIndicator` | Stabile | props minime |
| Feedback | `ToastProvider`, `useToast` | notify/promise | `Alert`, `Animated` | Parziale | usa `<div>` in TSX RN; id `Date.now`; timer lifecycle incompleto |
| Overlay | `Modal` | `visible`, `onClose`, `size`, `dismissOnBackdrop` | `Box` | Parziale | import `Platform` non usato; style su `RNModal` non efficace |
| Overlay | `BottomSheet` | `visible`, `onClose`, `snap`, `header` | `Box` | Parziale | snap statici; no gesture/keyboard |
| Overlay | `Popover` | `renderTrigger`, `placement`, `gap` | `Box` | Sperimentale | su native renderizza solo trigger, niente contenuto |
| Overlay | `Tooltip` | `content`, `placement`, `delay` | `Text` | Sperimentale | su native renderizza solo children, niente tooltip |
| Surfaces | `Badge` | `children`, `size`, `variant` | `Text`, `useTheme` | Parziale | variant color text non coerenti; hardcoded transform |
| Surfaces | `Card` | `children`, `bgColor`, `radius`, `variant`, `shadow` | `useTheme` | Rotto | hook chiamato dentro funzione helper non-component |
| Surfaces | `Hero` | `children`, `ViewProps` | `useWindowDimensions` | Parziale | altezza `screen - 80` hardcoded |
| Navigation | `NavProvider`, hooks | nav state | React context | Stabile | API router-agnostic utile |
| Navigation | `Link` | `href`, `variant`, `size`, active styles | `useOptionalNav` | Parziale | usa `window` direttamente sul web; nessun router adapter |
| Navigation | `NavBar` | `items`, `pathname`, `navigate`, layout | `TopBar`, `BottomBar`, `SideBar` | Parziale | `bottomMaxItems` dichiarato ma ignorato |
| Navigation | `TopBar` | slots/title | nav hooks | Parziale | fallback renderizza `a`; richiede provider |
| Navigation | `BottomBar` | `maxItems` | nav hooks | Parziale | absolute positioning hardcoded |
| Navigation | `SideBar` | `width`, `variant` | web-specific file | Sperimentale | native export null; web resolution dipende da bundler |

## Findings

### Finding CMP-01

- File/percorso: `components/surfaces/Card.tsx:76-78`
- Problema: `useTheme()` e chiamato dentro `applyShadow`, funzione normale invocata durante render ma non componente/hook custom.
- Impatto: viola le regole degli hook e puo generare errore lint/runtime in scenari futuri; rende il componente fragile.
- Severita: Critica
- Raccomandazione: passare `theme` a una funzione pura o calcolare shadow nel corpo del componente.

### Finding CMP-02

- File/percorso: `components/feedback/ProgressBar.tsx:17-35`
- Problema: `width` viene calcolata ma la riga che la applica e commentata.
- Impatto: il progresso non viene visualizzato; il componente e funzionalmente rotto.
- Severita: Alta
- Raccomandazione: applicare `width` allo stile interno e coprire con test visuale/snapshot.

### Finding CMP-03

- File/percorso: `components/typography/CodeInline.tsx:131-143`
- Problema: `size={props.size || "sm"}` ma `lineHeight` usa `theme.typography.fontSize[props.size]`; se `props.size` e undefined il risultato e `undefined * normal`.
- Impatto: stile `lineHeight` diventa `NaN`/undefined e puo produrre warning o rendering errato.
- Severita: Alta
- Raccomandazione: risolvere `const size = props.size ?? "sm"` e usare sempre `size`.

### Finding CMP-04

- File/percorso: `components/form/Textarea.tsx:23-30`
- Problema: `theme.spacing["md"]` usa una chiave semantica su `spacing`, ma i nomi semantici sono in `theme.space`.
- Impatto: `paddingVertical` risulta undefined; il componente non rispetta i token.
- Severita: Alta
- Raccomandazione: usare `theme.space.md` o un prop tokenizzato coerente.

### Finding CMP-05

- File/percorso: `components/navigation/TopBar.tsx:43`
- Problema: se non viene passato `logo`, il componente renderizza il testo placeholder `a`.
- Impatto: UI visibilmente errata in applicazioni reali.
- Severita: Alta
- Raccomandazione: renderizzare `title`/`leftSlot` o null, mai placeholder hardcoded.

### Finding CMP-06

- File/percorso: `components/navigation/NavBar.tsx:220-232`
- Problema: `bottomMaxItems` e accettato ma non passato a `BottomBar`.
- Impatto: prop pubblica inefficace; consumer non possono limitare gli item come dichiarato.
- Severita: Media
- Raccomandazione: passare `bottomMaxItems` a `BottomBar` o rimuovere la prop dall'API.

### Finding CMP-07

- File/percorso: `components/Button.tsx:7-71`
- Problema: variant `info` e dichiarata ma non gestita nelle mappe colore.
- Impatto: `variant="info"` produce background trasparente e border/text incoerenti.
- Severita: Media
- Raccomandazione: completare la mappa variant o rimuovere `info` dal type pubblico.

### Finding CMP-08

- File/percorso: `components/form/Input.tsx:14-52`
- Problema: `label` e obbligatoria, viene renderizzata sempre e include decorazione quadrata hardcoded.
- Impatto: difficile riusare `Input` in form field composabili; UI opinionata e non disattivabile.
- Severita: Media
- Raccomandazione: rendere label opzionale o delegarla a `FormField`; spostare decorazione in variant esplicita.

