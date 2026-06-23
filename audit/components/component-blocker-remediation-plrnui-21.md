# PLRNUI-21 - Component Blocker Remediation

Date: 2026-06-23

## Scope

Fix dei blocker componenti ereditati da PLRNUI-5 per:

- `Card`
- `ProgressBar`
- `CodeInline`
- `Textarea`
- `PasswordInput`

PLRNUI-21 non promuove componenti a `stable` e non modifica la root API oltre a mantenere gli export gia presenti.

## Remediation Matrix

| Component | Previous blocker | Remediation | Test evidence | Final PLRNUI-21 decision |
| --- | --- | --- | --- | --- |
| `Card` | `useTheme()` chiamato dentro helper non-component `applyShadow`. | `useTheme()` resta nel componente React; `applyShadow` riceve `theme` come argomento. | `tests/components/component-smoke.test.tsx` renders `Card` inside `ThemeProvider`. | `beta`; not `stable`. |
| `ProgressBar` | Width calcolata ma non applicata al fill. | `progress` viene normalizzato/clampato a `0..100`, con fallback `30`, e la width calcolata viene applicata allo stile del fill. | Smoke assertion verifies `progress={150}` clamps to fill width `100%`. | `beta`; not `stable`. |
| `CodeInline` | Size fallback/lineHeight potevano dipendere da una size non risolta in modo unico. | `resolvedSize` viene calcolata una sola volta e alimenta sia `Text.size` sia `lineHeight`; fallback sicuro a `sm`. | Smoke assertion verifies default font size and lineHeight. | `beta`; not `stable`. |
| `Textarea` | Props deboli/alias non esplicito e token spacing storico errato. | `TextareaProps` e un'interfaccia esplicita compatibile con `InputProps`, esclude override di `multiline`/`textAlignVertical`, usa `theme.space.md`, e forza `multiline`. | Smoke assertion verifies `multiline=true` and `textAlignVertical="top"`. | `beta`; not `stable`. |
| `PasswordInput` | Props deboli, toggle incompleto su input, accessibilita non stabilizzata. | `PasswordInputProps` e un'interfaccia esplicita; aggiunti stato controllato/non controllato, callback `onPasswordVisibilityChange`, toggle `Pressable`, role/label/state accessibili. | Smoke assertion verifies secure default, accessible toggle and visibility update. | `beta`; not `stable`; fuller accessibility/platform validation still required before stable. |

## API Notes

- `CardProps`, `ProgressBarProps`, `CodeInlineProps`, `TextareaProps` and `PasswordInputProps` remain exported from `src/index.ts`.
- No subpath export was added.
- No component was promoted to `stable`.
- `PasswordInput` adds optional props for explicit visibility control without removing the existing `InputProps`-compatible surface.

## Verification

Commands run during PLRNUI-21:

```bash
npm test
npm run typecheck
```

`npm run build` evidence is recorded in the final PLRNUI-21 handoff after fresh execution.

## Residual Stable Gate

The five components are no longer blocked by the specific PLRNUI-5 runtime/type blockers, but they still require the normal stable gate before any `stable` classification:

- full docs/support matrix review;
- platform behavior review beyond the Node smoke harness;
- component-specific interaction/accessibility tests where applicable;
- release/consumer proof tracked separately by release readiness work.
