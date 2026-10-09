# Texo 1.0.0 — Guida per il Product Owner
## Decisioni da prendere e risorse da fornire per far lavorare gli agenti in autonomia

Stato al 2026-10-09 · Backlog: Jira PLRNUI, Epic PLRNUI-78…94, 348 ticket · Fonte: `audit/texo-v1/`

---

## 0. In una pagina

**Situazione.** Il backlog è pronto: 348 ticket, 1.248 dipendenze, nessuna collisione di file. **Nessun agente può iniziare a lavorare finché non c'è il tuo via libera**, perché per regola di governance (Confluence pagina 13) io non applico mai `po-approved`. Inoltre alcune decisioni sono solo tue (nome, scope npm, ecc.).

**Cosa ti chiedo, in ordine di impatto sull'autonomia:**

| # | Cosa | Tempo stimato per te | Cosa sblocca |
|---|---|---|---|
| 1 | Alzare il limite di spesa mensile (§2.1) | 2 min | Senza questo gli agenti si fermano a metà lavoro (è già successo) |
| 2 | Autorizzare l'approvazione in blocco dei ticket `ready` (§2.2) | 5 min | 294 ticket V1 eseguibili senza ulteriori tuoi interventi |
| 3 | Scegliere il modello di esecuzione git/PR (§2.3) | 5 min | Lavoro parallelo senza conflitti, merge senza di te |
| 4 | Rispondere a H1–H8 (§3) o accettare i default | 15 min | Sblocca 23 ticket + il cutover finale |
| 5 | Configurare ambiente: rete, permessi, repo, Pages (§4) | 20 min | Niente stop per permessi/rete |
| 6 | Predisporre npm/OIDC e dispositivi (§5) | 30 min (anche dopo) | Solo per le ondate ≥ 9 (release e verifica su device) |

**Quanto possono lavorare da soli.** Con i punti 1–5 fatti, gli agenti coprono le ondate 0–8 (250 ticket V1, 241 senza blocchi) senza intervento umano. Il tuo intervento serve di nuovo solo a: verifica su dispositivi fisici (ondata ≥ 10), primo publish su npm, cutover finale. Tabella completa in §6.

**Come rispondere in fretta.** In fondo (§9) c'è un modulo con un default consigliato per ogni scelta: ti basta scrivere "ok default" oppure cambiare solo le righe che vuoi.

---

## 1. Principi che reggono tutto (già applicati)

- "Texo" è il **nome target della V1**. Nessuno rinomina ancora pacchetto, repo, import o namespace. Il vecchio pacchetto diventerà uno **shim generato che riesporta Texo**: una sola codebase.
- Gli agenti **non pubblicano mai** su npm, non creano tag né GitHub Release, non applicano `po-approved`, senza una tua autorizzazione esplicita.
- Nessun segreto in chat. I segreti vanno nelle impostazioni dell'ambiente (§4.3) o in GitHub, mai incollati.
- Un ticket è "pronto" (`ready`) quando ha problema, valore, scope, fuori-scope, criteri verificabili, dipendenze, validazione, evidenze, rischi e Definition of Done. Lo stato resta "Da fare" finché non lo approvi.

---

## 2. Decisioni di processo (sbloccano l'autonomia)

### 2.1 Limite di spesa — **azione richiesta**
**Cosa è successo:** durante l'import dei link, 13 agenti paralleli sono stati interrotti da "monthly spend limit" (errore HTTP 429). Il lavoro è ripartito, ma una esecuzione vera consuma molto di più della pianificazione.
**Cosa fare:** alza il limite su https://claude.ai/settings/usage con margine adeguato a ~350 ticket.
**Regole che adotto per contenere i costi (proposta, puoi cambiarle):**
- Sonnet per implementazione, ricerca e import; Opus solo per review di architettura/API e per la validazione indipendente di ogni ondata.
- Massimo 5–6 agenti Atlassian in parallelo (oltre, Jira risponde 429 "Too Many Requests").
- Ogni ondata termina con un checkpoint (commit + `STATE.md`) così una interruzione non fa perdere lavoro.
**Da te:** un numero di tetto di spesa che consideri accettabile per l'intera V1, così mi fermo di mia iniziativa prima di sforarlo.

### 2.2 Approvazione dei ticket (`po-approved`) — **la decisione che pesa di più**
Oggi: 0 ticket approvati. Gli agenti di esecuzione lavorano solo su ticket approvati.

| Opzione | Descrizione | Autonomia |
|---|---|---|
| **A (consigliata)** | Approvi **in blocco** tutti i ticket `ready` e non `post-1.0`; l'ordine lo impongono i link "Blocks" già in Jira | Massima: 294 ticket V1 eseguibili (315 V1 totali, 21 in attesa di decisioni) in sequenza di ondate |
| B | Approvi ondata per ondata (0–2 ora: 55 ticket, di cui 46 senza blocchi; poi le successive) | Media: ti chiedo ogni 2–3 giorni |
| C | Approvi ticket per ticket | Bassa |
| D | **Delegazione esplicita:** mi autorizzi per iscritto ad applicare `po-approved` ai ticket `ready` ondata per ondata, dopo che l'ondata precedente è verde | Massima, mantiene il tuo controllo per politica |

**Come farlo tu (opzione A/B), 1 minuto:** in Jira usa la ricerca
`project = PLRNUI AND labels = texo-v1 AND labels = ready AND labels != post-1.0 AND labels != blocked-decision`
→ Seleziona tutto → Modifica in blocco → aggiungi l'etichetta `po-approved` (e togli `awaiting-po-approval`). Per l'opzione B restringi con `AND labels in (wave-0, wave-1, wave-2)`.
**Nota di governance:** la pagina 13 dice che la proposta diventa scope solo con la tua approvazione. L'opzione D va quindi scritta esplicitamente (una riga in chat basta) e io la registro in `DECISIONS.md`.

**Ondate 0–2 (le prime a partire), 55 ticket — 46 subito eseguibili**
- Ondata 0 (25): E1-03 token-lint · E1-04 type-check dei test · E1-15 SideBar unico · E11-02 scaffold catalogo · E12-04 type test · E12-08 smoke runtime Expo · E13-02 estrattore props · E14-01 contratto subpath · E14-06 audit side-effects · E14-07 identità pacchetto (senza rename) · E14-13 ADR convenzioni API · E15-09 motore codemod · E16-04 CONTRIBUTING · E16-05 template PR/issue · E17-06 matrice supporto · E17-10 supply-chain · E3-02 ADR motion · E9-01 helper a11y. Bloccati da decisione: E15-01, E15-02, E16-01, E16-03, E16-09, E16-10, E17-07.
- Ondata 1 (14): E14-03 **ESM valido** (percorso critico) · E14-09 policy dipendenze · E15-03 generatore shim · E16-02 docs strict · E17-03 release-guard · E17-08 piano di release · e altri.
- Ondata 2 (16): E1-01 metadati componenti · E2-01 tema v2 · E14-02 generatore exports · E4-02 hook · E4-23 LocaleProvider · E8-01 contratto capability · e altri.
**Percorso critico:** E1-15 → E14-03 (ESM) → E2-01 (tema v2) → E2-06 (API varianti) → ADR convenzioni (E14-13).

### 2.3 Modello di esecuzione git — **decisione richiesta**
Oggi lavoro su un unico branch di sessione e **non apro PR** (regola: solo su tua richiesta esplicita). Per eseguire centinaia di ticket in parallelo serve un modello. Scegli:

| Opzione | Modello | Pro / contro |
|---|---|---|
| **A (consigliata)** | Un branch per ticket `texo/PLRNUI-<n>-<slug>`, PR verso un branch di integrazione `texo/v1`; l'agente fonde in `texo/v1` solo con CI verde + review indipendente; tu fondi `texo/v1` → `main` quando vuoi (es. a fine ondata) | Parallelismo vero (i ticket hanno file disgiunti), `main` protetto, rollback semplice. Richiede: tua autorizzazione esplicita a creare branch/PR e a fare merge in `texo/v1` |
| B | Tutto su un solo branch di lavoro | Semplice ma sequenziale e fragile ai conflitti |
| C | Un branch per ticket, PR verso `main`, merge solo tuo | Massimo controllo, minimo throughput (diventi tu il collo di bottiglia) |

**Se scegli A mi servono, per iscritto:** (1) autorizzazione a creare branch e PR per i ticket approvati; (2) autorizzazione al merge su `texo/v1` quando CI è verde e la review passa; (3) conferma che `main` resta solo tuo.
**Regole di qualità che applico a ogni PR:** `npm run release:check` verde; criteri di accettazione verificati con evidenza nel ticket; nessuna modifica fuori dai file posseduti dal ticket; niente test saltati o disabilitati.

### 2.4 Permessi della sessione
Il modo di permesso lo scegli tu dal menu accanto al prompt: **Accept edits**, **Plan** o **Auto**. Le modifiche ai file in cloud non chiedono mai conferma; **Auto** esegue anche quasi tutto il resto senza chiedere (compare solo se la tua organizzazione lo consente e il modello lo supporta). Per un lavoro lungo e non presidiato scegli **Auto**; se non è disponibile, aggiungi regole `permissions.allow` per i comandi frequenti in `.claude/settings.json` del repository (posso proporti l'elenco esatto: `npm *`, `node scripts/*`, `git *`, `npx tsc *`). Non esistono flag per saltare i permessi in cloud.

### 2.5 Transizioni Jira consentite agli agenti
Oggi non sposto mai nulla. Per tracciare l'avanzamento propongo: gli agenti possono portare un ticket **Da fare → In corso → Fatto** (mai "Approvato", che resta tuo), "Fatto" solo con evidenze allegate e criteri verificati. **Decisione:** sì / no / solo "In corso".

### 2.6 Regola "silenzio = default"
Per non bloccarmi su risposte lente: se una decisione di §3 non riceve risposta entro N giorni, applico il **default consigliato** e lo registro in `DECISIONS.md` come "adottato per silenzio, revocabile". Le decisioni irreversibili (publish, tag, nome) **non** seguono mai questa regola. **Decisione:** N = 3 / 7 / mai.

### 2.7 Pianificazione automatica
Posso programmare esecuzioni ricorrenti (routine/cron) che riprendono dal checkpoint `STATE.md`, avviano l'ondata successiva e mi fermano se trovo un blocco reale. **Decisione:** sì (ogni quante ore) / no, sempre avviate da te.

---

## 3. Decisioni di prodotto (H1–H9)

Per ognuna: la domanda, perché conta, le opzioni, il **default consigliato**, e cosa sblocca (chiavi Jira).

### H1 — Identità finale di Texo  *(irreversibile → mai per silenzio)*
**Da decidere / fornire:**
1. Nome definitivo del pacchetto e **scope npm** (es. `texo` oppure `@<scope>/texo`). Verifica la disponibilità su npm prima di scegliere (ticket E15-01 lo prevede come DoD).
2. Organizzazione/utente GitHub e **nome repository** (oggi `pianic2/personal-library-react-native-components`; in `mkdocs.yml` compare un owner diverso → da riallineare).
3. Titolare della **licenza** (testo `LICENSE`/NOTICE) e anno.
4. **Contatto di sicurezza** (email per `SECURITY.md`).
5. **Handle CODEOWNERS** reali (oggi c'è il segnaposto `@optimus`).
6. Conferma che sei owner dello scope `@personal-library` su npm (serve per `npm deprecate` e per pubblicare lo shim).
**Perché conta:** è la base del cutover; cambiarlo dopo il publish è praticamente impossibile.
**Default consigliato:** nessun default (decisione tua). Se vuoi procedere subito senza decidere, il lavoro preparatorio (generatore shim, codemod, parity) usa già un file `config/package-identity.json` con segnaposto: non serve il nome per costruirlo.
**Sblocca:** PLRNUI-122 (E15-01), 267 (E15-10), 272 (E15-13), 273 (E15-14), 277 (E15-16), 110 (E16-01), 118 (E16-03), 153 (E16-09).

### H2 — Dipendenze peer opzionali per librerie non-Expo
**Domanda:** posso dichiarare `peerDependenciesMeta` opzionali per `react-native-svg`, `@shopify/flash-list`, `react-native-safe-area-context`, `@react-native-community/datetimepicker`, usate solo da sottopercorsi `./adapters/*`? Cambia la policy PLRNUI-39 (oggi zero peer nativi aggiuntivi).
**Opzioni:** **Sì (consigliato)** — il core resta a zero dipendenze, gli adapter sono opzionali e non rompono l'import root (c'è un test che lo prova). **No** — grafici SVG, FlashList, safe-area e date picker nativo restano fuori dalla 1.0; si usano solo implementazioni pure-View.
**Sblocca:** PLRNUI-364 (E4-24), 392 (E5-18), 403 (E7-25), 207 (E7-04), 405 (E7-26), 382 (E8-31).

### H3 — Perimetro della 1.0 e insieme "stable"
**Domanda:** conferma l'elenco dei componenti che alla 1.0 sono `stable` (semver garantito); tutto il resto esce come `demo`/`@experimental`.
**Proposta (ADR-R10):** Text, Heading, Box, Row, Column, Divider, Touchable, Button, Icon, Link, Input, Textarea, Checkbox, Switch, RadioGroup, Field/Label, Card/Surface, Badge, Spinner, ProgressBar, Alert, Screen, TexoProvider, useTheme, token.
**Anche:** conferma il rinvio a "post-1.0" di 33 ticket (media player, Markdown, Agenda, Kanban/Tree/Gallery, grafici SVG, 5 preset extra: premium/consumer/editorial/ecommerce/social, biometria, splash gate, ecc.). Sono tutti ancora in Jira con etichetta `post-1.0`.
**Default:** accetto la proposta. **Sblocca:** PLRNUI-372/374/376/377 (E1-38…41, promozioni) e 262 (E17-14, soglia stable).

### H4 — Matrice di supporto e finestre di deprecazione
**Domande:** (a) per la 1.0 supportiamo solo **Expo 57 / RN 0.86** o anche 56? (b) per quanti mesi vive lo shim del vecchio pacchetto prima di deprecarlo definitivamente? (c) per quanto restano gli alias di prop deprecati (`onChange`, `visible`, ecc.)?
**Default consigliato:** (a) solo Expo 57 / RN 0.86 alla 1.0 (la matrice è configurabile, si allarga poi); (b) 12 mesi di sunset dello shim; (c) alias deprecati per tutta la 1.x, rimossi alla 2.0.
**Sblocca:** PLRNUI-129 (E15-02), 155 (E17-07).

### H5 — Budget e modello per le valutazioni AI
**Domanda:** per dimostrare che le skill migliorano la qualità degli agenti (E13-31) servono ~300 esecuzioni (20 compiti × 3 bracci × 5 ripetizioni). Chi paga, con che tetto, con quale modello di riferimento?
**Default consigliato:** esegui dentro le sessioni Claude (nessuna chiave API da gestire); sottoinsieme di 10 compiti × 3 bracci × 3 ripetizioni per ogni release candidate, run completo una volta prima della GA; tetto di spesa da te indicato. In alternativa una chiave API in un segreto GitHub dedicato (solo per quel workflow).
**Sblocca:** PLRNUI-393 (E13-31).

### H6 — Linea di versione
**Decisione:** Texo parte da `1.0.0-rc.0` sotto il nuovo nome; il pacchetto legacy salta da `0.1.0-rc.2` a `1.0.0` come shim. **Default:** sì, questa linea. **Sblocca:** PLRNUI-273 (E15-14), 277 (E15-16).

### H7 — La cartella `audit/` diventa pubblica?
**Domanda:** `audit/` contiene audit interni, ADR, riferimenti a Jira. Alla pubblicazione open-source: resta nel repo pubblico, si sposta in un repo privato, o si ripulisce?
**Default consigliato:** tenere pubblici solo ADR e documenti di architettura (`audit/adr/`, `audit/texo-v1/DECISIONS.md`), spostare/ripulire il resto prima del primo publish. **Sblocca:** PLRNUI-161 (E16-10).

### H8 — Nome del canale codemod
**Domanda:** `npx <nome>-codemod`, sotto-comando `texo migrate`, o entrambi? Dipende da H1. **Default:** pacchetto codemod standalone nello stesso scope; `migrate` valutato in E15-11 come alias. **Sblocca:** PLRNUI-267 (E15-10).

### H9 — Autorizzazioni che restano sempre tue
`po-approved` (salvo delegazione §2.2-D), **ogni** `npm publish`, tag Git e GitHub Release, `npm deprecate`, merge su `main`. Nessun agente li esegue senza un tuo consenso esplicito per quell'azione.

### Decisioni che ho già preso io (puoi opporti)
Raccolte in `audit/texo-v1/DECISIONS.md` (D1–D15): TexoProvider unico; convenzioni API (`value/onValueChange`, `open/onOpenChange`, `variant`=struttura, `tone`=colore); architettura overlay unica; dipendenze opzionali solo per iniezione; sottopercorsi 1.0 limitati a `.`, `./theme`, `./tokens`, `./native`, `./native/expo`, `./adapters/*`, `./testing`, `./meta`; metadati in un unico `<Nome>.meta.ts`; ESM con estensioni esplicite; shim con range caret; motion su RN Animated senza Reanimated; niente MCP nella 1.0; documentazione in inglese. **Se vuoi cambiarne una, dimmelo prima che parta l'ondata che la usa.**

---

## 4. Ambiente e repository: cosa configurare

### 4.1 Rete dell'ambiente cloud
Impostazioni: menu dell'ambiente nella barra del titolo della sessione → Edit → **Network access** (dettagli: https://code.claude.com/docs/en/cloud-environments#network-access).
Servono almeno questi host raggiungibili (livello "Limited" con Allowed domains + casella *Allow package managers* attiva, oppure un livello più ampio):
- `registry.npmjs.org` (install, `npm view`, audit);
- `github.com`, `api.github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com` (clone, Pages, Actions);
- `niccolopiazzi01.atlassian.net` e l'MCP Atlassian (già funzionanti);
- `expo.dev` / `registry.expo.dev` se usiamo servizi Expo (non obbligatorio per `expo export`);
- host di Playwright/Chromium: il browser è preinstallato, non serve scaricare nulla.
Se un host è negato lo segnalo con il nome esatto e proseguo con ciò che non dipende da quello, senza simulare risultati.
*Nota:* diversi connettori plugin (Figma, Slack, Linear, Notion, GitHub-plugin…) falliscono con "Proxy refused 403". Non servono a questo lavoro: usiamo solo Atlassian e GitHub MCP.

### 4.2 Setup dell'ambiente
- Node **≥ 22.13** (il repo usa Node 24 in CI); aggiungi nello script di setup dell'ambiente `npm ci` così ogni sessione parte con le dipendenze installate.
- Spazio disco: il disco è una quota fissa per sessione; le sessioni lunghe possono esaurirla (build, cache). Lo gestisco con checkpoint e sessioni nuove, ma più è ampia la quota meglio è.

### 4.3 Segreti
Non incollare mai token in chat. Dove vanno:
- **Nessun token npm** nel flusso previsto: il publish usa *trusted publishing* con OIDC e provenance (E17-02) — "No NPM_TOKEN secret referenced" è un criterio di accettazione.
- Se serve una chiave per le valutazioni AI (H5): impostazioni ambiente → *Network secrets* / variabile d'ambiente, e mi dici il **nome** della variabile.
- Nessun altro segreto è previsto per la V1.

### 4.4 Repository GitHub
Da fare una volta (puoi farlo dalle impostazioni del repo):
1. **Branch protection** su `main` (richiedi PR + CI verde) e su `texo/v1` (CI verde) se scegli il modello §2.3-A.
2. **GitHub Actions**: permessi `contents: write`, `id-token: write`, `pull-requests: write`; abilita Actions per PR dei bot.
3. **GitHub Pages** abilitato con sorgente "GitHub Actions" (serve a PLRNUI-77 e all'Epic E11).
4. **Environment `npm-publish`** con *required reviewer* = te (gate umano obbligatorio prima di ogni publish, E17-02).
5. **Dependabot** e *dependency review* attivi (E17-10).
6. **App Claude** installata sul repo (altrimenti URL: https://github.com/apps/claude/installations/select_target); riconnessione GitHub: https://claude.ai/connect-github.
7. Valuta di abilitare l'auto-merge solo su `texo/v1`.
8. In `.claude/settings.json`: le regole `permissions.allow` di §2.4.

### 4.5 Atlassian
Già operativo (Jira scrittura/lettura, Confluence scrittura). Da decidere solo: transizioni consentite (§2.5) e se vuoi che gli agenti commentino i ticket con le evidenze (consigliato: sì, un commento per ticket chiuso).

---

## 5. Risorse esterne (servono più avanti)

| Quando | Cosa | Perché | Chi |
|---|---|---|---|
| Ondata ≥ 9 | **npm trusted publisher** per il nuovo pacchetto e per lo shim (configurazione una tantum sul sito npm) | publish con provenance senza token (E17-02) | tu (account npm) |
| Prima della 1.0 | **Primo publish "di bootstrap"**: un nome npm nuovo non può usare trusted publishing finché il pacchetto non esiste | rischio dichiarato in E17-02 | tu, con 2FA |
| Ondata ≥ 10 | **Verifica su dispositivi reali** iOS e Android (protocollo E9-14, smoke Expo Go E8-29, bare RN E8-30) | gli agenti non hanno device; senza evidenza non si dichiara "stable" | tu o un tester; ~1–2 ore per giro |
| Ondata 12–13 | **Runner macOS** per iOS (i runner macOS di GitHub sono gratuiti per repo pubblici) oppure simulatori locali | `expo export --platform ios`, Maestro opzionale (E12-07/08) | repo/CI |
| Ondata 16 | **Cutover**: `npm publish` Texo, `npm publish` shim, `npm dist-tag`, `npm deprecate` del vecchio pacchetto, annuncio | E15-15/16; richiede H1, H6, 2FA/OIDC | tu (comando per comando, con consenso esplicito) |
| Sempre | Confermare che il progetto accetta **repo pubblico + GitHub Pages gratuito** | nessun servizio a pagamento (nessun simulatore in cloud) | tu |

Cosa **non** serve: carte di credito, Chromatic/Percy, Appetize, account Apple Developer (non facciamo build firmate né EAS in V1).

---

## 6. Cosa può girare da solo, e quando tornerai a essere necessario

| Fase | Ondate | Ticket V1 | Serve da te | Lavoro autonomo |
|---|---|---|---|---|
| Fondazioni | 0–2 | 55 (46 sbloccati) | §2 + approvazione | ESM valido, tema v2, API varianti, ADR, estrattore props, shim, codemod, meta |
| Primitive e core | 3–5 | 115 | — | Touchable, Icon, Surface, form (`useForm`, Field), overlay, motion, locale |
| Componenti | 6–8 | 80 | H2 (per gli adapter) | Overlay, toast, menu, tabs, lista/tabella, capability nativi |
| Sistema, AI e qualità | 9–12 | 51 | H3, H5; **device fisici** (E9-14 in ondata 10, E8-27 in ondata 12) | Preset, catalogo, skill, manifest, valutazioni, visual regression, a11y, consumer smoke |
| Release e cutover | 13–16 | 14 | H1, H4, H6, npm OIDC, device (E8-29/30 in ondata 13), **consenso publish** | Changesets, pipeline, rehearsal Verdaccio, runbook; cutover solo con te |

*(Conteggi da `backlog/_index.json`, solo ticket V1; per ondata 0…16: 25, 14, 16, 31, 50, 34, 23, 22, 35, 22, 16, 9, 4, 8, 2, 3, 1. In più 33 ticket `post-1.0` restano in backlog fuori dal percorso critico.)*

**Punti in cui un agente può bloccarsi** (e ti scrive): una decisione H aperta, un host di rete negato, un limite di spesa, un test che fallisce 3 volte dopo cambio strategia, un conflitto non risolvibile.

---

## 7. Rischi e limiti noti (da tenere presenti)

1. **Limite di spesa** mensile già raggiunto una volta (§2.1).
2. **Rate limit Jira**: oltre ~8 chiamate parallele si ottiene 429; gli agenti riprovano a lotti piccoli.
3. **Descrizioni Jira alterate**: la conversione markdown di Jira rovina `__DEV__`, i glob con `*`, alcuni backslash e le checkbox in ~20 ticket. **Il testo giusto è sempre nel JSON del repo** (`audit/texo-v1/backlog/`); gli agenti devono leggere da lì. Posso ripubblicarle in ADF se vuoi.
4. **Incoerenza nota da correggere** in E15-15: il runbook dice "shim che dipende dalla rc esatta di Texo" mentre la decisione D10 per la versione stabile è un range caret. Va allineata quando si esegue il ticket (nessun impatto prima).
5. **Titolo di E4-16** (PLRNUI-332) ha un residuo di rinomina; correggerlo è nell'elenco di pulizia.
6. **Documentazione stale**: `peer-dependency-policy.md` cita RN 0.85/Expo 56 mentre `package.json` è RN 0.86 (coperto da E14/E16).
7. **ESM**: la conclusione "l'emit non è valido per resolver stretti" deriva dalla lettura del codice, non da una build; il ticket E14-03 la verifica per prima.
8. **Primo publish** di un nome nuovo: passo manuale inevitabile.
9. **81 criteri di accettazione brevi** segnalati dall'euristica: da rivedere in un giro di pulizia.
10. **Nessun componente è `stable` oggi** (18 demo, 18 prototype): la 1.0 richiede le promozioni E1-38…41 e la verifica su device.

---

## 8. Cosa faccio io appena rispondi

1. Registro le tue risposte in `DECISIONS.md` e nella pagina Confluence.
2. Applico le decisioni dove serve (es. sblocco i ticket `blocked-decision`: tolgo l'etichetta e aggiungo `ready`).
3. Se hai scelto §2.3-A: creo `texo/v1`, scrivo un file di **protocollo di esecuzione** per gli agenti (branch per ticket, DoD, divieti) e `CLAUDE.md`/`AGENTS.md` del repo con le regole, poi avvio l'ondata 0 con agenti in parallelo (max 5–6), review Opus a fine ondata, checkpoint, ondata successiva.
4. Se hai scelto §2.7: programmo le routine di ripresa.
5. Ti scrivo solo quando serve una tua azione umana (§6) o c'è un blocco reale.

---

## 9. Modulo di risposta (copia, incolla, modifica solo le righe che vuoi cambiare)

```
PROCESSO
2.1 Tetto di spesa V1: <importo>            (limite mensile già alzato: sì/no)
2.2 Approvazione ticket: D (delega a Claude, ondata per ondata)   [A | B | C | D]
2.3 Modello git: A (branch per ticket → texo/v1; main solo mio)   [A | B | C]
    - autorizzo creazione branch e PR per ticket approvati: sì
    - autorizzo merge su texo/v1 con CI verde + review: sì
2.4 Modalità permessi: Auto
2.5 Transizioni Jira agenti: Da fare → In corso → Fatto (con evidenze)
2.6 Silenzio = default dopo: 7 giorni (mai per H1, H9)
2.7 Routine automatiche: sì, ogni <N> ore

PRODOTTO
H1 Nome pacchetto: <...>   Scope npm: <...>   Org/repo GitHub: <...>
   Titolare licenza: <...>   Contatto sicurezza: <...>   CODEOWNERS: <@...>
   Sono owner dello scope @personal-library su npm: sì/no
H2 Peer opzionali non-Expo: sì
H3 Perimetro/stable come da proposta: sì   (rinvio 33 ticket a post-1.0: sì)
H4 Supporto: solo Expo 57/RN 0.86 | sunset shim: 12 mesi | alias deprecati: fino alla 2.0
H5 Valutazioni AI: dentro le sessioni, 10x3x3 per rc, tetto <importo>
H6 Versione: Texo 1.0.0-rc.0, legacy 1.0.0 (shim): sì
H7 audit/: pubblico solo ADR e DECISIONS.md, resto ripulito/privato
H8 Codemod: pacchetto standalone nello scope + alias `migrate` se utile

AMBIENTE (fatto / da fare)
4.1 Rete: <livello scelto>        4.2 Setup `npm ci`: <fatto?>
4.4 Branch protection / Pages / Environment npm-publish / Dependabot: <fatto?>
5   npm trusted publisher: <quando>   Device per verifica: <chi/quando>
```

---

## 10. Riferimenti

- Registro decisioni: `audit/texo-v1/DECISIONS.md` · Stato e ripartenza: `audit/texo-v1/STATE.md`
- Backlog finale: `audit/texo-v1/backlog/` (+ `RECONCILIATION.md`) · Mappa Jira: `audit/texo-v1/jira-map.json`
- Review indipendenti: `audit/texo-v1/reviews/R1-architecture-review.md`, `R2-backlog-review.md`
- Confluence: "Texo 1.0.0 — Master Plan & Decision Register" (SPLRNC, id 67239938)
- Governance Jira/Confluence di partenza: pagina 13 "Continuous Improvement & Biweekly Release Planning"
