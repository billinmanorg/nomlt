# NOLMT rewards API contract

What the backend must implement for `public/js/api.js` to switch out of demo
mode. Set `apiBase` in `public/js/config.js` and every call below is used
instead of the browser-local demo adapter.

**The governing rule:** the browser reports that something happened. The server
decides what it is worth, whether it is allowed, and whether it becomes
claimable. A frontend event is never proof that an activity occurred.

- All responses are JSON.
- Authentication is a session cookie; the client sends `credentials: "include"`.
- Errors return a non-2xx status with `{ "message": "…" }`. The message is shown
  to the user, so write it for a person, not a log.

---

## Configuration

### `GET /config`

Returns the same shape as `window.NOLMT_CONFIG`, minus `apiBase`. Replaces the
bundled defaults at page load, so reward amounts and rules change without
redeploying the website.

```json
{
  "chain": { "network": null, "chainId": null, "tokenContract": null,
             "claimContract": null, "explorerBase": null },
  "claim": { "minimumBalance": 25 },
  "levels": [ { "id": "participant", "name": "Participant", "threshold": 0 } ],
  "rewardActions": [ /* see below */ ],
  "utilityActions": [ /* see below */ ],
  "journey": [ { "id": "participate", "label": "Participate" } ]
}
```

This response is public. It carries reward **names, descriptions and amounts**
only. Limits, cooldowns, verification requirements, risk levels, caps and
treasury settings must **not** appear here — the browser does not need them and
publishing them helps people circumvent them.

Never include treasury addresses, signer keys, private configuration or
internal risk thresholds in this response. It is public.

**Reward action fields (public)** — `action_id`, `action_name`, `description`,
`surface`, `reward_amount`, `enabled`.

**Utility action fields (public)** — `utility_id`, `name`, `description`,
`cost`, `category`, `enabled`.

Everything else about an action stays server-side.

---

## Session and account

### `GET /session`

```json
{ "user": { "id": "usr_…", "email": "…", "name": "…",
            "emailVerified": true, "profileComplete": true, "createdAt": "…" },
  "wallet": { "address": "0x…", "connectedAt": "…" } }
```

Both keys are `null` when signed out.

### `POST /auth/signup`
Body `{ "name", "email", "password" }`. Creates the account, sends the
verification email, grants the `account_created` reward, and returns
`{ "ok": true, "user": {…}, "reward": {…} }`.

Requires a human challenge (CAPTCHA or equivalent). Rate limit by IP and device.

### `POST /auth/signin`
Body `{ "email", "password" }`. Requires a human challenge on suspicious logins.

### `POST /auth/signout`

### `POST /auth/verify-email`
Body `{ "token" }`. On success, promotes every reward held with
`blocked_on: "email_verification"` from `PENDING` to `CLAIMABLE`, then grants
the `email_verified` reward.

### `POST /me/profile`
Body is the profile answers. Grants `profile_completed`. Never request or store
government IDs, financial credentials, medical data or national insurance /
social security numbers.

---

## Rewards

### `POST /rewards/events`

The single entry point for earning. Body:

```json
{ "action_id": "lesson_ai_fundamentals", "metadata": { "surface": "education" } }
```

The server must, in this order:

1. Look up the action. Reject if unknown, disabled, or outside `start_at`/`end_at`.
2. Check eligibility: login, email verification, phone verification, wallet.
3. Check `lifetime_limit`, `weekly_limit`, `daily_limit` and `cooldown_seconds`
   against that user's history.
4. Check the account caps in `caps`.
5. **Verify the action actually happened**, from server-side state — the lesson
   was served and completed, the App Builder submission exists, the referral
   qualified. Do not trust the request.
6. Generate a unique server-side `event_id`. Reject replays.
7. Score risk. High risk, or a `risk_level: "high"` action, writes `REVIEW`
   rather than `CLAIMABLE`.
8. Write an immutable ledger entry.

Response:

```json
{ "ok": true, "status": "CLAIMABLE", "amount": 5,
  "label": "Complete AI Fundamentals", "event_id": "evt_…",
  "blocked_on": null, "firstEarn": false }
```

Rejections return `ok: false` with `message`, and `requiresAccount: true` when
the fix is signing up.

**Reward statuses:** `PENDING`, `VALIDATED`, `CLAIMABLE`, `REVIEW`, `REJECTED`,
`CLAIMED`, `EXPIRED`.

**`blocked_on` values used by the UI:** `email_verification`, `manual_review`.

### `GET /rewards/balance`

```json
{ "pending": 10, "claimable": 32, "claimed": 0, "review": 0, "spent": 20,
  "lifetime": 62, "total": 42,
  "level": { "id": "contributor", "name": "Contributor", "threshold": 25 },
  "nextLevel": { "id": "builder", "name": "Builder", "threshold": 75 } }
```

`total` is what the header pill shows: pending + claimable.
`claimable` is net of utility spending.

### `GET /rewards/ledger`

Newest first. Rewards, utility spends and claims in one list.

```json
[ { "kind": "reward", "id": "evt_…", "at": "…", "label": "Complete AI Fundamentals",
    "amount": 5, "status": "CLAIMABLE", "blocked_on": null },
  { "kind": "spend", "id": "utx_…", "at": "…", "label": "Implementation resource pack",
    "amount": -20, "status": "USED", "blocked_on": null } ]
```

Negative `amount` renders as an outgoing entry.

### `GET /me/journey`

Drives the journey rail.

```json
{ "discover": true, "participate": true, "earn": true, "accumulate": true,
  "wallet": false, "claim": false, "use": false }
```

### `GET /me/callout` → `{ "seen": false }` and `POST /me/callout`

Whether the "You just experienced tokenization" callout has been shown.

---

## Wallet

### `POST /wallet/connect`
Body `{ "address" }`. Validate the address format server-side. Reject a wallet
already linked to another account, or flag it — one wallet across many accounts
is a primary sybil signal. Returns `{ "ok": true, "wallet": {…} }`.

### `POST /wallet/disconnect`

---

## Claims

### `POST /claims`

Validates identity, balance, wallet, risk score, claim limits and previous
claims, then creates an authorized claim. The browser never instructs the
treasury.

```json
{ "claim_id": "clm_…", "user_id": "usr_…", "wallet_address": "0x…",
  "amount": 42, "reward_ids": ["evt_…"], "nonce": "…",
  "created_at": "…", "expires_at": "…", "status": "AUTHORIZED",
  "transaction_hash": null, "network": "…", "risk_score": 10 }
```

**Claim statuses:** `CREATED`, `AWAITING_SIGNATURE`, `AUTHORIZED`, `SUBMITTED`,
`CONFIRMED`, `FAILED`, `REVIEW`, `CANCELLED`.

Requirements:

- A reward may appear in **one** successful claim. Enforce with a transaction
  and a unique constraint, not application logic alone.
- Enforce `claim.minimumBalance`, `claim.maximumPerClaim` and
  `claim.cooldownHours`.
- If no network or claim contract is configured, return `ok: false` with
  `notConfigured: true` and the prepared `claim` object. The UI shows the claim
  it would have made and states plainly that nothing was transferred. **Do not
  return a fabricated transaction hash.**

### `GET /claims` — claim history for the signed-in user.

---

## Utility

### `POST /utility/{utility_id}/use`

Checks eligibility, availability and balance, then debits atomically and records
a utility transaction. Returns `{ "ok": true, "utility": {…} }`.

Insufficient balance returns `ok: false` with a message naming the shortfall.

---

## Non-negotiables

1. Every reward event is validated server-side.
2. Every reward event has a unique server-generated id; replays are rejected.
3. Rewards are immutable ledger entries. Corrections are new entries, never
   overwrites.
4. Pending rewards can be invalidated by an admin before claim, with an audit
   trail entry naming the admin and the reason.
5. Treasury signing keys never reach the browser, a build artefact, or `/config`.
6. Rate limit accounts, IPs, devices, sessions, wallets, reward actions and API
   endpoints independently.
7. Risk is weighted, not binary. One weak signal never permanently blocks a user;
   it raises verification requirements or moves a reward to `REVIEW`.
8. Do not send wallet addresses or account identifiers to third-party analytics.


---

## Contact

### `POST /contact`

Body `{ "name", "email", "topic", "notes" }` from the discovery-call form on
`/book`. Requires a human challenge and rate limiting by IP. Returns 2xx on
success; the form shows a plain confirmation and does not claim to have sent
anything when `apiBase` is unset.

---

## AI Guide

The website ships a scripted guide with no model behind it. If you add one:

### `POST /agent/message`

Body `{ "session_id", "message", "history": [...] }` → `{ "reply", "suggestions": [...], "cta": {...} }`.

Keep the model, provider, routing strategy, system prompt and cost controls
server-side. None of it may be visible in the browser, and the public site must
not describe the underlying architecture.
