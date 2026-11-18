# Master prompt: finish the UI, verify every connection, ship on localhost

Paste everything below the line into your coding agent (Claude Code, Cursor, etc.) with the Stitch MCP server connected, opened inside this project folder.

---

## 1. Role and outcome
You are a senior full-stack engineer and product designer. This folder contains **Auction Room**, a working local IPL auction system: a zero-dependency Node backend (`server.js`) with an event-sourced rules engine, 7 passing tests (`npm test`), and an interim UI (`public/index.html`). Your job:
1. **Redo the UI** for the Operator Console, Host views and Arena Display, using Stitch for the screens.
2. **Verify every connection** between UI, API, data and persistence, and fix what is broken.
3. **Deliver a deployable localhost build** that a non-technical organizer starts with one command.

Do not rewrite `server.js`'s rules engine or event log. Extend it only where section 6 says so, and keep `npm test` green after every change.

## 1b. Two non-negotiables: it must be beautiful, and every function must work
Neither one may be traded for the other. Work in this order: (1) make every function work on the interim UI, (2) redesign around it, (3) re-run the function checks after **every** design pass. A pretty screen with one dead button is a failed build, and so is a working screen that looks like a default template.

**Function rule.** Every visible control has a working handler and a visible result. No placeholder buttons, no "coming soon", no decorative inputs. If a function cannot be made to work, remove its control. Prove each row below by an automated test or a scripted browser step, and list the proof in your final report:

| Function | Must be true |
|---|---|
| Next lot, call by name | Next pending player appears on Operator and Arena together; searching a name calls that player |
| Ten team paddles (click and keys 1-9, 0) | Price rises by that player's own increment; leader highlights; first paddle opens at base |
| Blocked teams | Paddle disabled with the reason shown (purse, squad full, overseas full, reserve); server refuses even if forced |
| Custom bid | Accepts `2.5` Cr, rejects `abc`, `2,5`, bids not above current price, not a multiple of 5 L |
| Sold / Unsold | Sold updates purse, squad count and stats at once and triggers the Arena overlay; Unsold only when no bids |
| Undo, Clear bids | Undo reverses any action including Sold and Release; purses never drift |
| Accelerated round | Unsold players return to the queue |
| Release | Asks for confirmation, refunds the purse, returns the player to the queue |
| Deck progress, queue, activity log | Numbers match the server after every action |
| Squads tab, Team stats tab | Filter by team, sort order-wise, totals equal the ledger |
| Feasibility warning | Appears when remaining players cannot fill every squad to 18 |
| Export CSV | Downloads, opens in Excel, totals match the stats tab |
| PIN, offline dot, auto-reconnect | Wrong PIN gives a clear message; stopping the server shows offline; restarting recovers without a reload |
| Arena sync | Within 500 ms of any operator action; never shows operator controls |
| Photo fallback | A missing image shows the designed monogram, never a broken icon |

**Aesthetic rule.** The target is a calm, expensive-feeling instrument at night that stays easy on the eyes for six hours, and that people photograph on the big screen. Concretely:
- **One focal point per screen.** Operator: the live price. Arena: the player and the price. Everything else is quieter in size, weight and contrast. If two things compete, demote one.
- **System, not decoration.** Use a 4/8 px spacing scale, one type scale (16 / 20 / 28 / 44 / 72 / 144), at most three corner radii with a clear hierarchy, and no card around everything. Group with space first, lines second, boxes last.
- **Considered details:** the price numeral ticks smoothly when it changes; the leading team's chip and edge bar carry that team's color; the Sold overlay is a short choreographed reveal (name, team, price) and not a flash; every control has designed hover, pressed, focus, disabled and loading states; empty and error states have real wording and a next step.
- **Player monogram fallback** is a designed element (large initials, deck-tinted surface), not a grey circle, because every player will use it until photos exist.
- **Dark done well:** no pure black, no pure white, text at about 90% white, color used only to mean something, generous line height, no vibrating saturated-on-dark text, no glow.
- **Review loop (required):** screenshot every screen at 1366x768 and 3840x2160, critique each against this list as a hostile art director would, fix, screenshot again. Do at least two rounds. Before finishing, remove one decorative element from each screen. Then re-run the function checks. Include before and after screenshots in the report.

## 2. Source material (read before writing code)
- `seed/players.csv`: the 180-player dataset. **This is the only player source.** Never hard-code players.
- `seed/reference_host.html`: the earlier single-file host app. Port its **features**, not its code (it uses floats, localStorage, no backend, CDN Tailwind and Google Fonts).
- `seed/reference_card_studio.html`: the earlier player-card component. The card design **will change later**, so build the card as one isolated, replaceable module (section 5).
- `server.js`, `test.js`, `public/index.html`: current backend, tests and interim UI.

## 3. Dataset facts (verified; treat as ground truth)
180 rows, 21 columns, no blanks, unique `player_id` (`IPL-001`..`IPL-180`), unique names and photo filenames. 7 decks: 1 Mavericks (30), 2 Capped Batsmen, 3 Capped Bowlers, 4 Capped All-Rounders, 5 Capped Wicketkeepers, 6 Uncapped Batsmen, 7 Uncapped Bowlers & ARs (25 each). 116 Indian, 64 Overseas (16 Australia, 14 South Africa, 9 England, 8 West Indies, 7 New Zealand, 5 Afghanistan, 2 Sri Lanka, 2 United States, 1 Canada). Roles: Batsman 59, Bowler 51, All-Rounder 37, Wicketkeeper 33 (`is_wicketkeeper` is true exactly for Wicketkeeper). Base prices (lakh): 30, 40, 50, 75, 100, 125, 150, 200. `photo_path` looks like `/assets/players/deck_1/sachin_tendulkar.png`; **no photos were supplied**.

Columns: `player_id, name, jersey_number, deck_number, deck_name, player_era (Active | Retired Legend), nationality_category (Indian | Overseas), country, country_code, role, is_wicketkeeper, popularity_score, batting_metric, bowling_metric, keeping_metric, overall_rating, base_price_lakhs, base_price_display, bid_increment_lakhs, photo_filename, photo_path`.

Decisions already made and implemented. Do not silently reverse them:
- **Bid increment comes from each player's `bid_increment_lakhs`** (5, 10, 20 or 25), not a global slab. The earlier spec's 10/20/25 slab is only a fallback idea.
- **Order** is deck 1 to 7, CSV order within a deck. The operator can also call any pending player by id (`{type:"next", pid}`).
- **Squad minimum is 18 and there are exactly 180 players.** So every player must be sold for all ten teams to reach 18. The view-model's `feasibility` field warns when remaining players cannot cover the shortfall. Surface it prominently, never as a blocking error.
- **Presets:** `MEGA` (120 Cr each, empty squads) and `MINI` (purses and retained counts copied from the host file; unverified, editable in `server.js`). Chosen with the `PRESET` env var, locked to the log once an auction starts.
- Names and likenesses are of real people. Use photos only if the organizer supplies them in `public/assets/players/deck_N/`. Missing photo means a monogram, never a broken image icon.

## 4. Backend contract (already built; wire the UI to exactly this)
- `GET /api/stream` (SSE) pushes the full view-model on connect and after every change. `GET /api/state` is the same once. `GET /api/players` is the static catalog (camelCase: `id,name,jersey,deck,deckName,era,os,country,cc,role,wk,pop,bat,bowl,keep,ovr,base,inc,photo`). `GET /api/health`. `GET /api/export.csv` (results).
- `POST /api/cmd` with `{type}`: `next` (+optional `pid`), `bid` (+`team`), `custom` (+`team`, `price` in lakh), `resetbid`, `sold`, `unsold`, `accel`, `release` (+`team`, `pid`), `undo`. Errors return `400 {error}` with a plain-language message to show verbatim in a toast. `401` means the PIN is wrong (header `x-pin`).
- View-model: `cfg, preset, seq, canUndo, teams[] {id,name,short,c,start,purse,spent,n,held,os,lead,block,squad[]}, lot {p,price,team,trail,next}, queue[], unsold[], status{}, decks[], counts, feasibility, last, log[]`. `block` is the reason a team cannot bid on the next increment, or null.
- All money is integer lakh. Format only at display: below 100 is `75 L`, otherwise Cr with up to 2 decimals.
- Rules are enforced **server-side only**. The UI disables buttons for convenience but never decides legality.

## 5. UI scope
**Routes:** `/operator` (host and operator, tabs below) and `/arena` (read-only projector view). Split into `index.html`, `app.css`, `app.js`, `card.js` under `public/` if it helps; no build step, no frameworks unless I ask, no CDN anywhere (the earlier files load Tailwind and Google Fonts from the internet: remove that; self-host woff2 in `public/fonts`).

**Operator tabs (port from the host file):** (1) Stage: current lot, ten team paddles with live `block` reasons, Sold, Unsold, Next lot, Undo, Clear bids, custom bid, deck progress, call-by-name search. (2) Squads: per-team squad lists with filter, price, overseas marker, and **Release** (confirm first). (3) Team stats, order-wise: purse left, spent, players, overseas, sortable. Also an activity log, an unsold list with the Accelerated round button, results export, and a short guide dialog. Skip "add custom player" in this pass.

**Hotkeys:** teams 1-9 and 0, `S` sold, `U` unsold, `N` next, `C` custom bid (type crore, Enter arms it, next team key places it, Esc cancels), `Ctrl/Cmd+Z` undo. No F-keys (they collide with reload and fullscreen). Ignore keydown repeats and inputs in focus; lock while a request is in flight.

**Arena:** 16:9, readable from 15 m. Idle (next up, progress), live (card, price at least 13vh, leader, bid trail), Sold and Unsold overlays (about 4 s, hidden on undo), ten-team ledger (purse, squad count). Never shows operator controls.

**Player card module:** `createPlayerCardHTML(player, {size})` in `card.js`, taking the camelCase catalog object, returning an HTML string, with everything it needs inlined or in its own CSS block. Show photo with monogram fallback, jersey, role, flag or country code, deck badge, ratings from `bat/bowl/keep/ovr`, popularity as stars, base price. Operator and Arena both call it, so replacing the card later touches one file only.

**Design (use Stitch first).** Generate five screens: Operator Stage, Operator Squads/Stats, Arena idle, Arena live, Arena Sold. Export, then adapt. **Tokens win over Stitch output.** Dark only, `color-scheme: dark`. Ink `#14111F`, panel `#1D1A2B`, raised `#272339`, line `#3A3552`, text `#F1EDF7`, muted `#A39DBA`; marigold `#FFC24D` only for the live price and current leader; lagoon `#3DD9B0` sold; madder `#FF6B7A` blocked or unsold; team colors only as chips, edge bars and meters. Bricolage Grotesque for display and numerals, Instrument Sans for text, tabular numerals for all money. The memorable element is the price numeral; everything else stays quiet. Avoid: purple-blue gradients, neon glow, glassmorphism, identical rounded-card grids, tracked all-caps labels, eyebrow text, monospace labels, emoji, a single accented word in a headline, scattered entrance animations. Sentence case, plain verbs, errors that say what to do next. Motion only in response to actions, respect `prefers-reduced-motion`. Quality floor: visible focus, contrast 4.5:1, works from a 1280 px laptop to a 4K projector.

## 6. Backend changes you may make
Only additive, each with a test: serve fonts and assets (already handled by static route); a `/api/call?q=` name search if the UI needs it; Right to Match (`RTM_OFFER`, `RTM_MATCH`, `RTM_DECLINE`) as an optional phase 2, off by default; optional seeded shuffle within a deck, persisted so restarts keep the order.

## 7. Verification protocol (this is the main job; report evidence, not claims)
1. `npm test` passes before and after. Add tests for anything you add.
2. **Connection audit.** Script it (`scripts/audit.js`, plain Node): (a) every `getElementById`/`querySelector('#id')` in `app.js` exists in the HTML; (b) every `fetch`/`EventSource` URL resolves to a live route; (c) every view-model field the UI reads exists in a real `/api/state` response; (d) every `type` the UI sends is handled by `run()`; (e) no `http(s)://` resource loads other than localhost; (f) every `photo_path` either exists on disk or the UI shows the fallback.
3. **Browser run** with a headless browser (Playwright if available): load `/operator` and `/arena`, zero console errors, zero failed requests; drive a lot end to end (next, bids, custom bid, sold, undo, unsold, accelerated round, release); assert the Arena updates within 500 ms and the Sold overlay appears then clears on undo. Capture screenshots of all five screens at 1366x768 and 3840x2160 and review them against section 5.
4. **Failure drills:** kill the server mid-lot (`kill -9`), restart, confirm the same lot and purses; stop the server and confirm the UI shows the offline dot and a clear message, then recovers by itself; open two operator tabs and confirm both stay in sync; wrong PIN; held key does not double-bid; custom bid typed as `2.5`, `2,5`, `abc`, blank.
5. **Dry run:** the existing test sells all 180 players; repeat it through the real UI with a script, then export the CSV and check totals against the Squads and Stats tabs.

## 8. Deployable on localhost
Deliver: `npm start` (and `npm run start:mini`); a `start.bat` and `start.sh` that check Node 18+, print the Operator and Arena URLs plus the laptop's LAN address for the projector device, and open the browser; a `README.md` covering the PIN, where `data/events.json` and the 30 rolling backups live, how to start a fresh auction (move `data/` aside), how to add photos, and a pre-event checklist (disable sleep, close other apps, test the projector at its real resolution, print the results CSV). No internet needed at any point.

## 9. Definition of done
Every row of the function table is proven; two or more design review rounds are done and the screenshots look intentional, not templated; all tests and the audit pass; zero console errors on both views; the failure drills pass; screenshots match the brief; the README works for someone who has never opened a terminal. Finish with: what you built, what you verified (with command output), and anything you could not verify.
