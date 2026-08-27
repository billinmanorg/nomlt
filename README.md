# NOLMT.ai

**Lead Without Limits. Enter the AI Economy.**
Build an AI Agent. Build an AI App. Add digital utility.

A static website built to the NOLMT Style Guide and the NOLMT.ai Website
Requirements v1.0. No build step required to deploy.

---

## The public story is three things

Everything on the site supports **AI Agents**, **AI Apps** and **Tokenization**.
Anything that does not support one of those three was left out on purpose.

Primary actions: **Try an AI Agent**, **Build my app**, **Tokenize my business**.

---

## Run it locally

```bash
python3 -m http.server 8000 --directory public
# → http://localhost:8000
```

## Deploy to Render

`public/` is committed, so Render does not build anything.

- **Blueprint:** New → Blueprint, point at the repo. It reads `render.yaml`.
- **Manual:** New → Static Site. Build command **empty**. Publish directory **`public`**.
- Static sites have **no start command**.

If you edit anything in `src/`, run `python3 build.py` and commit the output —
or set the Render build command to `python3 build.py`.

### Cache busting

`build.py` appends a content hash to every local CSS and JS reference, e.g.
`css/nolmt.css?v=f8ca08ff`. The hash changes whenever the file changes, so a
browser can never pair fresh HTML with a stale stylesheet or script — which is
what makes an updated page render as unstyled boxes with dead buttons.

**Always run `python3 build.py` after editing anything in `public/css` or
`public/js`**, otherwise the HTML still points at the old hash. `render.yaml`
also keeps css/ and js/ on a short cache as a safety net.

---

## Routes

```
/                       Homepage — the whole story in one scroll
/ai-agents              AI Agents + live NOLMT AI Guide
/ai-app-development     $3K / $6K / $12K, plus the App Planner
/apps                   Example app library
/tokenization           Digital utility + the "is it right for us" check
/subtokens              Build your own tokenized community
/ai-education           Learning modules that earn NOLMT
/my-nolmt               Balance, activity, wallet, claim
/account                Create a verified account
/about                  Brief
/book                   Discovery call request
/privacy /terms /utility-disclosure
/404
```

Header nav is deliberately small: **AI Agents · AI Apps · Tokenization ·
Examples · About**, plus Your NOLMT and Try an AI Agent.

---

## Brand implementation

From the NOLMT Style Guide:

- **Logo** — the radial expanding-ray symbol, generated as SVG in
  `public/assets/brand/`: `nolmt-symbol.svg`, `nolmt-lockup.svg`,
  `nolmt-favicon.svg`, `nolmt-app-icon.svg`, plus mono light/dark versions.
  If you have the original vector files from your designer, drop them in with
  the same filenames and every page picks them up — nothing else to change.
- **Colour** — Midnight Navy `#081426` foundation, Deep Navy `#0B2035`,
  Electric Blue `#1E90FF`, Cyan Blue `#11C5FF`, Aqua Teal `#21E6D8`,
  Soft White `#F5F7FA`, Cool Gray `#97A6B8`. Navy carries the site, blue and
  aqua are controlled accents, and white sections do the heavy lifting for
  clarity. Tokens are in `:root` at the top of `css/nolmt.css`.
- **Type** — Manrope (headlines), Inter (body/UI), IBM Plex Mono (technical
  labels). Self-hosted in `assets/fonts/`, so there is no Google Fonts request
  at runtime. All three are Google Fonts under the SIL Open Font License.
- **No** crypto-casino styling, gold coins, cyberpunk, glowing brains,
  blockchain graphics or technical dashboards on public pages.

---

## Alice — the AI Agent

The homepage leads with **two large choice boxes**: *Build an AI Agent* and
*Build a Web App*. Either one drops the visitor straight into a conversation
with **Alice** in `public/js/pages/agent.js`.

Alice introduces herself, asks what business they are in, asks whether the goal
is saving time or generating revenue, explains what NOLMT would build for that
combination, and then asks for a short **discovery call with Taylor**. The two
boxes set the track (`data-start-agent="agent"` or `"app"`), which changes her
framing and her recommendation — the destination is the same.

The whole script lives in the `SECTORS` object and the `advance()` / `pitch()`
functions at the top of that file, so the wording can be edited without
touching anything else.

It runs entirely in the browser from the script in that file. **It does not
call a language model, and it never claims to.** To connect a real one, replace
`respond()` with a call to your own endpoint and keep the model, provider,
routing and prompts server-side — none of that belongs in the browser.

---

## NOLMT utility

Users can earn small amounts of NOLMT for approved participation, see their
balance as **Pending / Available / Claimed**, and use it across the ecosystem.
A wallet is only needed to claim.

`public/js/config.js` holds the public reward names, amounts and utility
prices. Change a number there and every surface updates — the earn grids, the
inline "earn N NOLMT" mentions, and the reward the demo grants.

**What is deliberately not in that file, or anywhere public:** qualification
rules, daily/weekly/lifetime limits, cooldowns, risk scoring, fraud thresholds,
device signals and treasury configuration. Those live server-side and are never
published, because publishing them helps people circumvent them. The public
site says only *"rewards are subject to verification and program rules."*

When `apiBase` is set, the site fetches `GET {apiBase}/config` and the server
response replaces the defaults, so amounts change without a redeploy.

### Current state

| Capability | Status |
| --- | --- |
| Website, content, brand system | Live |
| Alice, the AI Agent (scripted) | Live |
| Reward names, amounts, utility catalogue | Live, config-driven |
| Balance, activity, journey | Demonstration — runs in the browser |
| Accounts and verification | Demonstration |
| Server-side qualification, anti-bot, anti-sybil | Pending backend |
| Wallet connection | Demonstration — address capture only |
| Claiming | Not open — no network confirmed |

The demonstration adapter exists so the experience can be reviewed before the
backend lands. **It is not a security boundary.** Reward qualification must
happen server-side. Connect it by setting one value:

```js
// public/js/config.js
apiBase: "https://nolmt-api.onrender.com"
```

The demonstration notices then disappear on their own.

Claiming deliberately stops at the point where an authorization would be
signed, tells the user plainly that nothing was transferred, and does not
invent a transaction hash. Confirm network, token contract, claim contract and
signer policy before enabling it — and get the claim contract independently
reviewed before any treasury is funded.

---

## Partner logos

Both partner marks are in place in `public/assets/partners/`:

```
angeltwin.png     AngelTwin.com
angltoken.webp    ANGLToken.io
```

Each renders as a circular badge beside its name, set in NOLMT typography.

The AngelTwin artwork arrived as a JPEG on a white ground. Its emblem was
cropped and placed on a masked white circular chip so it reads on navy without
altering the partner's own colours — the style guide forbids recolouring a
partner mark, and these figures are drawn for a light background. If AngelTwin
can supply a vector or a transparent version made for dark backgrounds, save it
over `angeltwin.png` (or drop in an SVG and update the two `<img src>`
attributes in `src/pages/index.html` and `src/pages/about.html`).

Partner marks keep equal optical prominence, are never merged with the NOLMT
symbol, and NOLMT is never recoloured to match a partner.

## Repository layout

```
build.py             Assembles src/ into public/. Run after editing src/.
render.yaml          Render blueprint: static site, no build command.

src/layout.html      Shared shell — head, header, nav, footer, sticky CTA.
src/pages/*.html     Body content per page, with a small metadata header.

public/              ← the deployed site. Committed.
  css/nolmt.css      The design system.
  js/config.js       Public reward + utility configuration.
  js/api.js          Rewards client: server adapter + demonstration adapter.
  js/nolmt.js        Nav, balance pill, journey rail, toasts, earn/use wiring.
  js/pages/*.js      Per-page logic (agent, planner, lessons, dashboard…).
  assets/brand/      Radial logo system, favicon, app icon, OG image.
  assets/partners/   Partner logos — placeholders, see above.
  assets/fonts/      Manrope, Inter, IBM Plex Mono (SIL OFL).

docs/                Internal implementation notes — see the warning below.
```

### Page metadata

```html
<!--meta
title: Tokenization
description: Used for the meta description and social preview.
nav: tokenization          which header item is marked current
scripts: agent             extra scripts from js/pages/
cta_href: book.html        the sticky mobile CTA
cta_label: Tokenize my business
-->
```

### Declarative hooks

- `data-amount="action_id"` / `data-cost="utility_id"` — inject a configured amount
- `data-config="claim.minimumBalance"` — inject any public config value
- `data-earn-grid` / `data-use-grid` — render the catalogues
- `data-earn="action_id"` / `data-use="utility_id"` — buttons that earn or spend
- `data-rail` — the journey rail
- `data-agent` — an AI Guide panel
- `data-when="signed-in|signed-out|verified|unverified"` — visibility by state

---

## ⚠️ Keep this repository private

`docs/API_CONTRACT.md` and `docs/BACKEND_NOTES.md` describe the internal data
model, anti-abuse layers and claim architecture. That is exactly the material
the requirements say must not be public. Either keep the repo private, or move
`docs/` out before making it public.

The site itself contains no treasury addresses, keys, internal thresholds or
private endpoints.

---

## Quality floor

Responsive to 390px with a sticky primary CTA on mobile, one `<h1>` per page,
no horizontal scrolling, visible keyboard focus, `prefers-reduced-motion`
respected, and content that stays visible if JavaScript fails.

## Licences

Manrope, Inter, IBM Plex Mono — SIL Open Font License 1.1
(`public/assets/fonts/licenses/`). Brand assets and content — NOLMT.
