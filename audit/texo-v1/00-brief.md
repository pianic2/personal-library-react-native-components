# Texo 1.0.0 — Shared Agent Brief

Repo: current package `@personal-library/react-native-components` (0.1.0-rc.2). Jira PLRNUI, Confluence SPLRNC.
Target: "Texo 1.0.0" — enhance (never replace) Expo/React Native; cut boilerplate and agent token use.
DO NOT rename package/repo/imports/namespaces now. All choices must stay compatible with a future cutover
`@personal-library/react-native-components -> Texo` where the old package becomes a thin re-export shim
(single codebase, never two implementations).

## Maturity ladder: prototype -> demo -> stable -> production-ready
`demo` minimum: real rendering; typed API; main states/variants; theme support; example; presence in catalog; minimal verification.

## Ticket draft schema (JSON file per stream in audit/texo-v1/tickets/<stream>.json)
Array of objects:
{ "id": "<STREAM>-NN" (local id), "epic": "<epic key from list below>", "type": "Task",
  "title": str (<=100 chars, imperative), "priority": "High|Medium|Low", "labels": [kebab-case...],
  "problem": str, "value": str, "scope": [str], "outOfScope": [str],
  "acceptance": [verifiable str, each checkable by command/test/inspection],
  "dependencies": [local ids or existing PLRNUI keys], "validation": [commands/tests],
  "evidence": [what must be attached on completion], "risks": [str], "dod": [str],
  "filesTouched": [paths/globs the work owns — keep disjoint from other tickets so work can run in parallel],
  "size": "S|M|L" (L is too big: split it), "semver": "patch|minor|none" }
Rules: no mediocre filler components; prefer composable primitives; each ticket sized so one agent can finish it
in one session; acceptance criteria must be objectively verifiable; list real file paths for filesTouched.

## Epics (local keys)
E1 Component maturity (existing components -> demo) | E2 Design system & presets | E3 Motion & interaction |
E4 Primitives & layout & typography | E5 Inputs, forms & selection | E6 Feedback, overlays & navigation/app-shell |
E7 Data display, lists, tables, charts, media | E8 Native capabilities & device APIs | E9 Accessibility |
E10 Responsive/adaptive | E11 Showcase, catalog & templates/recipes | E12 Testing & consumer validation |
E13 AI-native layer (skills, manifests, CLI/MCP) | E14 Package architecture & DX | E15 Texo migration (cutover) |
E16 Docs & open-source readiness | E17 V1 release engineering

## Output discipline
Read-only on source code unless your task says otherwise. Write ONLY the files named in your task.
Cite file paths as evidence. Be concrete and terse; no filler prose.
