# JQL set for Texo V1 ticket selection

Single place for the Jira queries used by ticket sessions (ADR 0020, `audit/adr/0020-ticket-execution-protocol.md`). Label names can change: edit them here only.

Site: cloud `31c85df6-5dd7-4c5f-b021-2d2951ab1041`, project `PLRNUI`. Jira statuses in this project: `Da fare`, `In corso`, `Approvato`, `Fatto`. Sessions never change a status or add `po-approved`.

Counts below were obtained by running each query against Jira on 2026-10-09 (after merge of PLRNUI-444 and PLRNUI-445, whose Jira status is unchanged by policy).

## 1. Ready and approved queue

```jql
project = PLRNUI AND labels = "texo-v1" AND labels = "po-approved" AND labels = "ready" AND statusCategory != Done ORDER BY key ASC
```

Result count: **361**. Sample check: the first 100 results all carry `texo-v1`, `po-approved` and `ready` (0 violations).

Jira status is never changed by sessions, so merged tickets stay in this list. Skip every ticket that has a row in the `Execution log` of `audit/texo-v1/STATE.md`, and take the lowest wave whose dependencies are merged into `texo/v1`.

## 2. Queue by wave

```jql
project = PLRNUI AND labels = "texo-v1" AND labels = "po-approved" AND labels = "ready" AND labels = "wave-<N>" AND statusCategory != Done ORDER BY key ASC
```

Result counts: `wave-0` **26**, `wave-1` **20**.

## 3. Blocked by decision

```jql
project = PLRNUI AND labels = "texo-v1" AND labels = "blocked-decision" AND statusCategory != Done ORDER BY key ASC
```

Result count: **0**.

## 4. In progress (set by the PO) - not a review state

```jql
project = PLRNUI AND labels = "texo-v1" AND status = "In corso" ORDER BY key ASC
```

Result count: **0**. Jira has no review status and sessions do not set `In corso`; the real review state is the list of open PRs to `texo/v1` on GitHub. This query only shows tickets the PO moved by hand.

## 5. Tickets with blocker links (candidate blocked set)

All not-Done tickets that have at least one blocker link. Jira cannot test the blocker's status in a plain query, so this is a superset of the tickets that are really blocked:

```jql
project = PLRNUI AND labels = "texo-v1" AND statusCategory != Done AND issueLinkType = "is blocked by" ORDER BY key ASC
```

Result count: **336**.

Tickets blocked by one given ticket (`blocks` is the outward name of the project's `Blocks` link type; checked on PLRNUI-444):

```jql
project = PLRNUI AND labels = "texo-v1" AND statusCategory != Done AND issue in linkedIssues(PLRNUI-<N>, "blocks") ORDER BY key ASC
```

Result count for `PLRNUI-444`: **9**. These are tickets that PLRNUI-444 blocks and that are not Done in Jira; since PLRNUI-444 is already merged they are not necessarily still blocked.

Because statuses are not updated by sessions, "open" in Jira does not mean "not merged". A blocker is resolved when its PR is merged into `texo/v1` (see the `Execution log` in `audit/texo-v1/STATE.md`).
