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

## Before merging to main
- Stripe: agent plan buttons go to Alice for now. Swap in payment links when ready.
- Replace every amber PLACEHOLDER: rating (4.8 / 37), client logos, stats
  (1.2M, 4.6s, 31%, 9s, 3×), case metrics + quotes, the lander testimonial
  (needs a real, named client).
- Record the three 30-second result clips (cards say "Clip coming soon").
- Confirm the 14-day live promise and headline claims (5 seconds, 2 a.m.).
- Lander phone number was omitted (the draft used a 555 placeholder).

## Preview without touching the live site
`render.yaml` already has `pullRequestPreviewsEnabled: true`.
Push `redesign`, open a pull request into `main`, and Render gives it its own
preview URL. The chat endpoint must allow that preview domain (and later
nolmt.ai), or Alice falls back to a failed-send message there.
