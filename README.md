# NOLMT.ai

**Lead Without Limits.** Marketing website, AI app development sales experience,
tokenized community experience, and a working demonstration of utility-token
mechanics — in one static site.

Built to the NOLMT Brand Style Guide v1.0 and the NOLMT Token Utility product
requirement.

---

## What this is, precisely

The site does four jobs at once:

1. NOLMT's marketing website
2. An AI App Development sales experience
3. A tokenized community experience
4. A live demonstration of how a business can tokenize participation

A visitor can walk the whole journey — **discover → participate → earn →
accumulate → connect wallet → claim → use** — and the journey rail on the
homepage, tokenization page, earn page and dashboard shows their real position
in it.

### What is live, and what is not

This repository is the **front end**. It is honest about that, on the site
itself (`/about.html#status`) and here.

| Capability | Status |
| --- | --- |
| Website, content, brand system | Live |
| Reward configuration (amounts, caps, cooldowns, utility prices) | Live |
| Reward ledger, balance, journey, activity history | Demonstration — runs in the browser |
| Accounts, email verification | Demonstration |
| Server-side validation, anti-bot, anti-sybil, risk scoring | Pending backend — contract defined in `docs/API_CONTRACT.md` |
| Wallet connection | Demonstration — address capture only |
| Claims, treasury, smart contract | Not enabled — no network confirmed |

**The demo adapter is not a security boundary.** It exists so the experience can
be reviewed and sold before the backend exists. Anything in a browser can be
edited by the person using the browser. No reward is production-ready until a
server decides it. See "Going to production" below.

---

## Run it locally

No build step, no dependencies.

```bash
python3 -m http.server 8000 --directory public
# → http://localhost:8000
```

Open `http://localhost:8000/index.html`. To reset your demo balance, use
**Reset demo data** at the bottom of `/my-nolmt.html`.

---

## Deploy to Render

The generated site lives in `public/` and is committed, so Render does not need
to build anything.

### Option A — Blueprint (recommended)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. It reads `render.yaml`.
3. Deploy. Render serves `./public` with sensible cache and security headers.

### Option B — Manual

1. In Render: **New → Static Site**, connect the GitHub repo.
2. **Build command:** leave empty.
3. **Publish directory:** `public`
4. Deploy.

### After deploying

- Add your domain under **Settings → Custom Domains** (Render issues TLS).
- Update the absolute URLs in `public/sitemap.xml`, `public/robots.txt` and the
  `<link rel="canonical">` in `src/layout.html` if the domain is not `nolmt.ai`,
  then re-run `python3 build.py`.
- Set the **404 page** to `404.html` in Render's redirect/rewrite rules if you
  want custom not-found handling.

---

## Repository layout

```
build.py                 Assembles pages from src/ into public/. Run after editing src/.
render.yaml              Render blueprint: static site, no build command.

src/
  layout.html            The shared shell — head, header, nav, footer, scripts.
  pages/*.html           Body content per page, with a small metadata header.

public/                  ← the deployed site. Committed. Do not edit HTML here.
  *.html                 Generated. Edit src/ instead.
  css/nolmt.css          The whole design system.
  js/config.js           Reward + utility configuration. Every amount lives here.
  js/api.js              Rewards client: server adapter + demo adapter.
  js/nolmt.js            Shared behaviour: nav, rewards pill, journey rail, toasts.
  js/pages/*.js          Per-page logic, loaded automatically when the file exists.
  assets/brand/          Logos, marks, favicon, OG image, colour tokens.
  assets/fonts/          Manrope, Inter, IBM Plex Mono (SIL OFL, self-hosted).

docs/
  API_CONTRACT.md        What the backend must implement.
  BACKEND_NOTES.md       Data model, anti-abuse and claim architecture.
```

### Editing content

Edit the fragment in `src/pages/`, then:

```bash
python3 build.py
```

Each fragment starts with a metadata block:

```html
<!--meta
title: Tokenization
description: Used for the meta description and social preview.
nav: tokenization
-->
```

`nav` decides which header item is marked as the current page.

### Adding a page

1. Create `src/pages/your-page.html` with a `<!--meta -->` block.
2. Optionally create `public/js/pages/your-page.js` — it is included automatically.
3. To put it in the header, add it to the `NAV` list at the top of `build.py`.
4. Run `python3 build.py`.

---

## Changing rewards without touching code

Everything is in `public/js/config.js`. Nothing is hard-coded in page markup.

```js
{
  action_id: "lesson_ai_fundamentals",
  action_name: "Complete AI Fundamentals",
  reward_amount: 5,
  daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
  requires_login: true, requires_email_verification: true,
  requires_phone_verification: false, requires_wallet: false,
  cooldown_seconds: 0, enabled: true,
  start_at: null, end_at: null, risk_level: "low"
}
```

Change a number here and every surface updates: the Ways to Earn grids, the
inline "earn N NOLMT" mentions, the admin preview at `/admin.html`, and the
reward the demo grants.

**In production this file is defaults only.** When `apiBase` is set, the site
fetches `GET {apiBase}/config` on load and the server response replaces it — so
amounts and rules change without redeploying the website, which is one of the
launch requirements.

Pages reference config values declaratively:

- `data-amount="action_id"` → that action's reward amount
- `data-cost="utility_id"` → that utility's price
- `data-config="claim.minimumBalance"` → any config path
- `data-earn-grid` / `data-use-grid` → renders the catalogue
- `data-earn="action_id"` → a button that submits a reward event
- `data-use="utility_id"` → a button that spends a balance

---

## Going to production

The token system is not production-ready until all of the following are true.
This is the checklist from the product requirement, with the current state.

- [x] A non-crypto user can participate without a wallet
- [x] Users can see why they earned NOLMT
- [x] Pending rewards are visually and linguistically distinct from claimed tokens
- [x] Reward amounts and rules change without redeploying the website
- [x] The same system demonstrates how a customer could tokenize their business
- [x] NOLMT can be used as well as earned
- [x] The experience stays understandable to a normal business owner
- [x] The experience avoids becoming a speculative token website
- [x] Treasury private keys are never exposed to the front end (none exist here)
- [ ] **Rewards validated server-side** — needs the backend
- [ ] **Bots cannot cheaply farm rewards** — needs server-side rate limits, human challenge, duplicate detection, risk scoring
- [ ] **Users cannot double-claim** — needs transactional DB controls
- [ ] **Administrators can pause rewards and claims** — needs the admin service

To connect the backend, set one value:

```js
// public/js/config.js
apiBase: "https://nolmt-api.onrender.com"
```

The site then routes every decision to the server and the demo adapter is never
used. The demonstration strip and demo-only copy disappear automatically.

Before enabling claims, confirm and set: network, chain id, token contract,
claim contract, treasury signer policy and gas mode. Until `chain.network` and
`chain.claimContract` are set, the claim flow deliberately stops at the point
where an authorization would be signed and tells the user why — it does not
invent a transaction hash.

**The claim contract must receive an independent security review before any
treasury is funded.**

---

## Design system notes

Derived from the brand style guide, not invented:

- **Colour** — Midnight `#0B2035`, Gold `#C79A3B`, Signal Blue `#2878F0`,
  Warm White `#F7F5F0`, Slate `#596878`, Charcoal `#1C2229`, Near Black `#090D12`.
  Composition holds to roughly 45% warm white/white, 30% navy, 15% neutral,
  5–7% gold, 3–5% Signal Blue. Gold is an accent, never the atmosphere.
- **Type** — Manrope (display), Inter (body/UI), IBM Plex Mono (technical and
  data). Self-hosted, no third-party font request. Hierarchy follows the guide:
  hero 64–80, H1 48–64, H2 32–44, H3 22–28, body 16–18.
- **The Open Frame** — used as the section eyebrow marker, the featured-card
  corner, the product tier diagrams (one frame → connected frames → modular
  system), and the journey rail: a boundary that does not close, with a gold
  path continuing through the opening. The rail's gold path advances with the
  visitor's real progress.
- **Restraint** — the token mark appears only where tokenization is being
  explained. No price charts, market caps, coin renders, glowing brains or
  robots. Not every page is dark.

Quality floor: responsive to 390px, visible keyboard focus, `prefers-reduced-
motion` respected, scroll reveals degrade to visible content if JavaScript fails,
one `<h1>` per page, no horizontal overflow.

---

## Licences

- Manrope, Inter, IBM Plex Mono — SIL Open Font License 1.1
  (`public/assets/fonts/licenses/`)
- Brand assets and site content — NOLMT
