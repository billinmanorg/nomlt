# NOLMT redesign — branch notes

Built from the "NOLMT Clean Prototype". Commit this to a `redesign` branch.
Nothing reaches the live site until `redesign` is merged into `main`.

## Chat integration — untouched
These files are byte-for-byte identical to the zip this was built from:
`public/js/config.js` (NOLMT_CHAT endpoint + key), `public/js/api.js`,
`public/js/nolmt.js`, `public/js/pages/agent.js`, `public/css/nolmt.css`,
`src/pages/ai-agents.html`.
Alice's panel markup (`<div class="agent" data-agent …>`) is identical on every
page it appears on: homepage, AI Agents, Pricing, and the real-estate lander.
Buttons reach Alice through the existing `data-start-agent` hook in agent.js.

## What changed
- `src/pages/index.html` — new homepage (hero demo, who it's for, how it works,
  results, agent plans, Alice, comparison, AI apps, FAQ, final CTA).
- `src/pages/real-estate.html` — new paid-media lander (logo only, no menu, noindex).
- `src/pages/pricing.html` — Launch / Growth / Scale agent plans added.
  NOLMT Bot card removed (replaced by the plans). Vault, Video and the
  $3k / $6k / $12k development products keep their Stripe links.
- `public/css/rd.css`, `public/js/pages/rd.js` — new, scoped to the redesign.
  The hero "build my preview" console is a scripted demo; it never calls the chat endpoint.
- `build.py` + `src/layout.html` — nav is now 4 links + "Build my agent";
  "Your NOLMT" pill removed from the header; Tokenization stays in the footer
  under "NOLMT Rewards · beta".

## Staging revision (Oct 2026)
- Homepage hero now hosts the real Alice panel (same markup as before, moved up);
  the scripted "build my preview" console and URL forms are gone from the homepage.
  rd.js still supports the console for the real-estate lander.
- Stats strip, client-logo row, star rating and all testimonial/case cards removed.
  "Results" section replaced by "Apps we've built" (from apps-built.html).
- Pricing matches nolmt-pricing-preview.onrender.com: Launch $199 (no setup fee),
  Growth $399, Scale $749; annual = 10× monthly; Growth/Scale setup "provided
  before purchase", waived on annual. App builds: AI Website App $3,000,
  Community App $6,000, Custom AI App $12,000 (one-time, Stripe links kept).
  Every $999 setup reference removed. rd.js reads data-setup="none|scoped".

## Staging revision 2 (Oct 15, 2026 — from the Oct 13 review call)
- Homepage "How it works": four steps now, the white tags under each step
  ("Free · 2 min", "Setup scoped before you buy", "From $199/mo · cancel anytime")
  are gone. Step 4 = "Create an AI app — your agent helps you create and manage
  an AI app for your customers, followers and stakeholders."
- San Diego Home Buyers screenshot captured from sandiegohomebuyers.org and
  placed on the homepage card and apps-built.html.
- Pricing (homepage + /pricing): the AI Agents / AI Apps tabs and the
  Launch / Growth / Scale plans are removed. Three AI Apps only, with a
  Monthly / One-time toggle:
    AI Website App  $250/mo  or $2,500 one-time
    Community App   $500/mo  or $5,000 one-time
    Custom AI App   $1,000/mo or $10,000 one-time
  One-time = 12 months for the price of 10 ("2 months free").
  "Ask Alice" appears once under the cards ("Buy now and we schedule your
  kickoff, or discuss it with Alice first"); the "Want both?" line is gone.
- Every leftover $199 / Launch / Growth / Scale mention on the homepage and
  pricing page (hero, comparison table, FAQ, final CTA, meta descriptions)
  rewritten around the app prices.

## Open before merging to main
- Stripe links wired (Oct 20): one-time/annual and monthly links per app,
  on the homepage and /pricing. Old $3k/$6k/$12k links removed.
- Token page: public/token.html — standalone (own styles, not built from
  src/), noindex, not in the sitemap, not linked from any nav. Images in
  assets/token/. The interest form is disabled by design ("Requests opening
  soon") until a destination is chosen.
- The real-estate paid-media lander (real-estate.html) still sells the $399
  Growth plan — not mentioned on the call, left as is.
- Book a call form (book.html) now emails bill@billinman.org (CC
  claflair@clearmortgagecapital.com) via FormSubmit (js/pages/book.js).
  FIRST SUBMISSION: FormSubmit emails bill@billinman.org an "Activate form"
  link — click it once, after that every request is delivered. If apiBase is
  ever set in config.js, the site's own /contact endpoint takes over.
  The "Client login" link goes to nolmt-twin.netlify.app/login.
- Confirm the 14-day live promise and headline claims (5 seconds, 2 a.m.).
- Branded open-house game: confirm public URL.

## Preview without touching the live site
`render.yaml` already has `pullRequestPreviewsEnabled: true`.
Push `redesign`, open a pull request into `main`, and Render gives it its own
preview URL. The chat endpoint must allow that preview domain (and later
nolmt.ai), or Alice falls back to a failed-send message there.
