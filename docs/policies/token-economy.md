# Token economy of ticket prompts

Measurements for the execution kit (ADR 0020, `audit/adr/0020-ticket-execution-protocol.md`), taken on 2026-10-09 with `node scripts/ticket-prompt.mjs`. Token estimate = characters / 4 (a crude heuristic: it undercounts code and non-ASCII text, and the margin to the budget is expected to cover it).

## What was measured, and what was not
- **Prompt tokens**: measured, reproducible with `node scripts/ticket-prompt.mjs <PLRNUI-n>` (estimate printed on stderr).
- **Files read**: the reads the prompt prescribes: the owned files, the ADR ids the ticket names, and the three protocol files (the backlog JSON, `jira-map.json`, `STATE.md`). The actual tool reads of a session were not recorded, so they are not reported.
- **Pass/fail**: reported as the merge outcome, and only for tickets that were really executed. PLRNUI-444 and PLRNUI-449 were executed by hand, before `ticket-prompt.mjs` existed; their prompt was rendered afterwards with the same script, so it is the prompt a session would get today, not the one that was used. The other reference tickets were not executed, so their outcome is `not run`. A real run of them belongs to the first execution of their wave; record it by adding rows in the same format.

## Reference tickets (the five types the ticket names)
| Ticket | Class | Prompt tokens | Prescribed reads | Merge outcome |
|---|---|---|---|---|
| PLRNUI-444 (E18-01, ADR) | docs/adr | 603 | 1 owned file + 3 protocol files, ADRs: none | pass: merged ([PR #12](https://github.com/pianic2/personal-library-react-native-components/pull/12)), CI green, review PASS |
| PLRNUI-449 (E18-06, ownership guard) | scripts/config | 419 | 2 owned files + 3 protocol files, ADRs: none | pass: merged ([PR #17](https://github.com/pianic2/personal-library-react-native-components/pull/17)), CI green, review PASS |
| PLRNUI-228 (E4-02, hooks) | hook | 501 | 5 owned files + 3 protocol files, ADRs: none | not run |
| PLRNUI-230 (E6-03, Alert upgrade) | component | 549 | 3 owned files + 3 protocol files, ADR 0014 | not run |
| PLRNUI-295 (E1-11, Row fix) | tests | 432 | 3 owned files + 3 protocol files, ADR 0014 | not run |

The classes wiring and unmapped have no reference ticket. For a type the reference is the executed ticket when there is one, otherwise a small (size S) ticket near the class median (not a search over all candidates).

## Prompt size over the whole backlog
`node scripts/ticket-prompt.mjs --all`: 361 of 361 tickets rendered, 100.0% within 2000 estimated tokens, maximum 1391, median 503, 95th percentile 808.

| Class | Tickets | Min | Median | Max |
|---|---|---|---|---|
| component | 189 | 346 | 550 | 1202 |
| scripts/config | 76 | 313 | 442 | 1200 |
| wiring | 40 | 408 | 521 | 1051 |
| tests | 22 | 318 | 408 | 558 |
| docs/adr | 19 | 342 | 405 | 721 |
| hook | 8 | 418 | 497 | 740 |
| unmapped | 7 | 538 | 572 | 1391 |

## Tickets over 2000 tokens
None. No split is proposed. The five largest, to watch if their text grows: E7-17 (1391, unmapped), E6-21 (1202, component), E1-01 (1200, scripts/config), E6-01 (1191, component), E6-25 (1051, wiring).

## Templates
The six class templates in `skills/texo-execute/references/` are 187 to 208 tokens each (limit 400). Check: `node skills/texo-execute/scripts/check-skill.mjs` (exit 0: 6 templates, 95 mapped labels).

## Outliers and open points
- **No trimming was done.** Every prompt and template is within its budget (the largest prompt is about 70% of it), so there was nothing to trim; the templates and skills are outside this ticket's files in any case.
- **7 tickets have no class** (E7-11, E7-12, E7-14, E7-15, E7-17, E7-31, E1-42): their prompt tells the session to stop and ask the PO. They need a label that maps to a class (an update of `class-map.json`, owned by the skill ticket).
- **Prompt size looks small next to the rest of a run.** The prompts are 300 to 600 tokens in the typical case, while the executed tickets also went through independent review rounds and CI cycles. That is a qualitative observation from these runs and it was not measured; measuring it needs per-session token accounting, which does not exist yet.
- **The resume prompt** in `docs/policies/checkpoint.md` and the execution runbook is 467 characters, about 117 tokens at 4 characters per token, against the 120 token limit of the runbook; measure it with `awk '/^Resume the Texo/' docs/policies/checkpoint.md | wc -c` divided by 4. Any edit needs the size check repeated.
