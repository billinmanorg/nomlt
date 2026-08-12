# Backend notes

Design notes for the service behind `docs/API_CONTRACT.md`. Nothing here is
implemented in this repository — this is the specification the front end was
built against, so the two halves meet cleanly.

---

## Data model

Relational, with real foreign keys. Token ledger records must not be casually
overwritten.

```
users                  id, email, email_verified_at, phone_verified_at,
                       password_hash, name, profile jsonb, status,
                       created_at, last_seen_at
user_verifications     id, user_id, kind, token_hash, expires_at, consumed_at
wallet_connections     id, user_id, address, connected_at, disconnected_at,
                       first_seen_chain_activity_at
reward_actions         action_id (pk), action_name, description, surface,
                       reward_amount, daily_limit, weekly_limit, lifetime_limit,
                       requires_login, requires_email_verification,
                       requires_phone_verification, requires_wallet,
                       cooldown_seconds, enabled, start_at, end_at, risk_level
reward_events          event_id (pk), user_id, action_id, event_type, source,
                       source_id, metadata jsonb, created_at, validated_at,
                       risk_score, reward_amount, reward_status, blocked_on
reward_ledger          id, user_id, event_id, delta, balance_after, kind,
                       created_at, correcting_entry_for
reward_campaigns       id, name, allocation, spent, starts_at, ends_at, rules jsonb
utility_actions        utility_id (pk), name, description, cost, category,
                       eligibility, enabled, start_at, end_at
utility_transactions   transaction_id (pk), user_id, utility_id, cost,
                       created_at, granted_until
claims                 claim_id (pk), user_id, wallet_address, amount, nonce,
                       created_at, expires_at, status, transaction_hash,
                       network, risk_score
claim_items            claim_id, event_id  -- unique(event_id)
risk_events            id, user_id, signal, weight, detail jsonb, created_at
risk_scores            user_id, score, band, computed_at
referrals              id, referrer_id, invitee_id, code, qualified_at,
                       rejected_reason
treasury_configuration singleton: network, chain_id, token_contract,
                       claim_contract, signer_ref, daily_max, per_user_max,
                       per_wallet_max, per_action_max, claim_min, claim_max,
                       rewards_paused, claims_paused
admin_audit_log        id, admin_id, action, target_type, target_id,
                       before jsonb, after jsonb, reason, created_at
```

Key constraints:

- `unique(claim_items.event_id)` — this is what makes double-claiming impossible.
  Do not rely on application code for it.
- `reward_events.event_id` is server-generated and unique; reject replays.
- Ledger entries are append-only. A mistake is corrected with a new entry
  referencing the original via `correcting_entry_for`.

---

## Reward engine

```
EVENT → VALIDATION → ELIGIBILITY → RISK → REWARD RULE → LEDGER ENTRY
```

Run inside one transaction. The validation step is the one that matters: it
must confirm from server-side state that the activity happened. A POST saying
"I finished the lesson" is a claim by an untrusted party, not evidence.

Practical version per surface:

- **Lessons** — the server issued the lesson, recorded a start, and the
  completion arrives with a plausible elapsed time and the correct answer.
  Unrealistically fast completion is a risk signal, not an automatic block.
- **App Builder** — a stored submission exists with substantive answers.
- **Referral** — the invitee verified and independently completed a qualifying
  action. Never pay on a link click.
- **Feedback** — held at `REVIEW` until a person reads it.

---

## Anti-bot and anti-farming

Layered, because no single control survives contact with a determined farmer.

1. **Email verification** required before rewards become claimable.
2. **Human challenge** on account creation, suspicious login, high-value reward
   events, referral claims and wallet claims.
3. **Rate limiting** on accounts, IPs, devices, sessions, wallets, reward
   actions and API endpoints — independently, so one limit failing does not
   open the rest.
4. **Action cooldowns** from `cooldown_seconds`; once-ever actions enforced by
   `lifetime_limit`.
5. **Unique event ids**, server-generated, replay-rejected.
6. **Duplicate detection** — email, phone, wallet, device, IP behaviour,
   browser and device patterns, unusual referral clusters.
7. **Behavioural signals** — unrealistically fast completion, identical
   submissions, automated navigation, high-volume registration, referral loops,
   many accounts on one wallet, many wallets on one device.
8. **Device and session risk**, using privacy-conscious signals. Do not build
   invasive tracking because it is technically possible.
9. **Daily and weekly caps** per user, device, wallet, action and campaign.
10. **Claim threshold** — a minimum claimable balance before a blockchain claim,
    which reduces both abuse and transaction overhead.
11. **Claim cooldown**, configured not hard-coded.
12. **Fraud hold** — suspicious rewards move to `REVIEW`, not to claimable.
13. **Admin reversal** — invalidate fraudulent pending rewards before claim,
    always with an audit trail entry.

### Anti-sybil scoring

Weighted, never a single-signal ban. Signals: account age, verified email,
verified phone where required, wallet age, wallet reuse, device reuse, IP
clustering, behaviour patterns, reward velocity, claim velocity, completion
velocity.

```
LOW / NORMAL   → proceed
MEDIUM         → additional verification
HIGH           → reward hold, manual review
```

---

## Claim architecture

```
USER → CLAIM REQUEST → SERVER VALIDATES (identity, balance, wallet, risk,
       claim limits, previous claims) → SERVER CREATES AUTHORIZED CLAIM →
       CLAIM CONTRACT / SECURE TREASURY → TRANSFER → USER WALLET → RECORDED
```

**Preferred: claim contract.** The backend signs an authorization containing
`wallet`, `amount`, `nonce`, `expiry`, `claim_id`. The contract verifies the
signature before releasing tokens. This gives auditable authorization and
enforceable on-chain limits.

**Alternative: controlled treasury service.** A secure backend service executes
approved transfers from a treasury wallet. Simpler, but the limits live only in
your code.

Do not deploy anything on-chain until network, token contract, treasury wallet,
claim contract and signer policy are confirmed, and all five are environment
driven.

### Contract safety

Established audited libraries. Role-based access, pausability, replay
protection, nonces, claim expiry, maximum claim controls, signer rotation,
emergency pause, events and logging, no arbitrary external calls. Keep it
deliberately simple — no DeFi functionality that nobody asked for.

**Independent security review before the treasury is funded.** Not after.

### Gas

Architect for both `user_pays` and `sponsored`, selected by configuration.
Do not assume one until network economics are settled. If the user pays,
explain the fee before they commit. Never hide a blockchain transaction
requirement.

---

## Analytics events

Emit these, and keep wallet addresses and account identifiers out of
third-party analytics.

```
REWARD_OPPORTUNITY_VIEW   REWARD_ACTION_START      REWARD_ACTION_COMPLETE
REWARD_GRANTED_PENDING    REWARD_BECAME_CLAIMABLE
WALLET_CONNECT_START      WALLET_CONNECTED
CLAIM_START               CLAIM_AUTHORIZED         CLAIM_SUBMITTED
CLAIM_CONFIRMED           CLAIM_FAILED
UTILITY_VIEW              UTILITY_USE_START        UTILITY_USE_COMPLETE
REFERRAL_CREATED          REFERRAL_QUALIFIED       FRAUD_FLAG
```

---

## Deployment shape on Render

- **Static site** — this repository, publish directory `public`.
- **Web service** — the API. Node or Python, whatever the team maintains best.
- **Postgres** — the ledger. Point-in-time recovery on, because a reward ledger
  with value attached is not something to restore from last night's dump.
- **Background worker** — referral qualification, risk recomputation, claim
  submission and confirmation polling.

Set `apiBase` in `public/js/config.js` to the API service URL, allow the site
origin in the API's CORS configuration with credentials enabled, and the demo
adapter is never used again.
