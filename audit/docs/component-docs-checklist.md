# PLRNUI-9 - Component Docs Checklist

## Riferimento PLRNUI-5

PLRNUI-5 ha prodotto la classificazione iniziale dei componenti in:

- `audit/components/component-maturity-matrix.md`
- `audit/components/component-classification-summary.md`
- `audit/components/stable-promotion-requirements.md`

Risultato rilevante per PLRNUI-9:

- `stable`: 0
- `beta`: 23
- `experimental`: 12
- `internal`: 6
- `deprecated`: 0 componenti

Nota esplicita: PLRNUI-5 classifica **0 componenti stable**. Nessun componente soddisfa oggi il gate stable per assenza di test/spec, support matrix e altri gap di maturita.

## Stable component checklist corrente

| Componente | Stato docs | Gap | Path evidenza |
| --- | --- | --- | --- |
| N/A | N/A | Nessun componente `stable` da verificare in questa fase. | `audit/components/component-maturity-matrix.md`, `audit/components/component-classification-summary.md` |

## Checklist minima futura per promozione stable

Ogni componente candidato a `stable` deve avere almeno:

| Requisito | Evidenza attesa |
| --- | --- |
| Pagina/sezione docs | Pagina dedicata o sezione navigabile nella documentazione. |
| Import pubblico documentato | Import da entrypoint pubblico approvato, non da `"AURA"`, path relativi, `src`, `dist` o internals. |
| Esempio base | Snippet minimale copiabile da consumer reale. |
| Props/API principali | Props principali documentate e coerenti con tipi pubblici esportati. |
| Theme/tokens notes | Note quando il componente usa token, tema, colori, spacing, radius, shadows o mode. |
| Accessibility/platform notes | Note su accessibility role/state, keyboard, focus, web/native behavior, Expo/RN limitations se applicabili. |
| Stability label | Label esplicita `stable` con versione/stato del contratto. |

## Requisiti docs minimi da applicare quando un componente passa a stable

1. Aggiungere un'intestazione o badge di stabilita `stable`.
2. Usare solo import pubblici approvati.
3. Documentare props principali con nomi coerenti ai tipi pubblici.
4. Includere almeno un esempio base di rendering.
5. Specificare supporto platform: Expo Go, React Native managed/bare, web se supportato.
6. Specificare note accessibility quando il componente gestisce input, focus, stato, press, navigation o feedback.
7. Specificare dipendenze native o peer se il componente ne attiva una.
8. Collegare note theme/tokens se il comportamento visuale dipende da token.
9. Indicare limiti noti e condizioni di non supporto.
10. Evitare di usare la demo come source of truth: l'esempio deve rappresentare il consumer package reale.

## Gap trasversali rilevati

- Le pagine esistenti usano import legacy `from "AURA"`.
- Le pagine non hanno label sistematiche `beta`, `experimental`, `internal` o `deprecated`.
- Molte props documentate non risultano esportate come public props types secondo PLRNUI-4.
- Alcune pagine documentano componenti internal o experimental come normali componenti consumer.
- Le note platform/accessibility sono parziali e non uniformi.
