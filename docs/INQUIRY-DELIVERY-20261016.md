# NOLMT inquiry delivery preparation

Status: source and synthetic verification only. No hosted database, credentials,
challenge provider, API service, public form configuration or release changed.

## Useful change

The discovery-call form now has a separate `contactApiBase` setting. Setting the
old shared `apiBase` would activate unrelated rewards/session/wallet APIs, which
this contact implementation does not implement. Leave both current live settings
unchanged until the inquiry service is separately approved and accepted.

The new server accepts POST /contact only from the approved exact Origin, requires
JSON, bounded fields/body, a UUID v4 idempotency key, mandatory challenge verification
and mandatory rate limiting. Trusted client-address resolution is supplied by the
hosting integration; arbitrary forwarded headers must never be trusted.

Contact content is encrypted with AES-256-GCM before storage. Each envelope is bound
to its request id. A keyed content hash plus primary key makes retries idempotent
and rejects reuse with changed content. A lost response after an insert can safely
be retried with the same id. No content or credentials are logged. No email is sent,
no appointment is confirmed, and no token, payment, AI or marketing action occurs.
The endpoint does not expose a listing/read route. A separate authenticated staff
review workflow is still needed before real leads can be operated reliably.

The browser disables duplicate submits, preserves newer edits, retains the same
request identifier for retries during the open page session, and requires a matching
JSON receipt before clearing fields. A page reload loses the in-memory retry id;
reload/recovery UX must be accepted before production (do not infer exactly-once
across reloads). Challenge UI/provider and timeout/recovery acceptance are pending.

## Database proposal, not an applied migration

`server/contact-schema.sql`: private `nolmt_private.inquiries` table with UUID id,
keyed payload hash, encrypted envelope and timestamp. RLS enabled, PUBLIC privileges
revoked, no public API exposure/policies. No hosted role grants or migration applied.
`postgresContactStore(query)` takes an injected parameterized PostgreSQL query
function; actual driver/pool configuration remains part of approved activation.
Do not connect as broad postgres/service_role for convenience. Approve a narrowly
scoped backend role with only required INSERT/SELECT policies and retention access.

## Exact activation bundle still needed

1. Existing NOLMT-owned Supabase project ref and database destination, region,
   staging isolation, schema approval, limited backend identity and read policies.
   No existing project has been verified as NOLMT's destination; do not reuse a
   Twin or XAPPX database by assumption.
2. Existing suitable API host/service ID and routing. Current Render resource is
   static and cannot run this server. Inspect safe reuse before new resources;
   approve any monthly cost/cap. No service was created or repurposed.
3. Approved challenge provider and plan/cap, domain/site configuration, retention
   and privacy disclosure. Owner completes any secure credential generation/entry.
   Durable per-client/global abuse limits and trusted proxy topology must be chosen.
4. Encryption-key storage, rotation and recovery owner, approved data fields and
   retention period, staff responsible for reviewing/responding to inquiries.
   Contact purpose is responding to this request, not marketing consent.
5. Exact production/staging origins and independent endpoint configuration,
   successful real-browser submit/readback/retry/mobile acceptance using synthetic
   details first. Then authorize real inquiries. No production data in tests.

## Verification

Node built-ins for runtime; PGlite 0.5.8 pinned and lockfile for disposable tests.
`npm ci --ignore-scripts && npm test` runs synthetic tests only. Tests cover actual
HTTP-to-Postgres persistence, encrypted payload readback, parallel duplicate sends,
lost response/retry, id conflicts, body/field/type/origin/challenge/rate-limit denial,
public-role read denial, missing dependencies, and browser submit state transitions.
No real database, API provider or personal/customer records are involved.

Partial static-build smoke test ran for /book with the canonical build.py. Binary
font assets cannot be fetched through the GitHub connector, so the committed page
preserves its existing HTML and asset versions and changes only the exact book.js
SHA-1 cache key. A full asset build and supported visual/browser acceptance remain
release checks. Other HTML, prices, Stripe links, chat integration and Render
blueprint are untouched.

## PR #1 reconciliation

PR head: c5d351fea1f6ac62b86b53437fe4be5f7f300a54 (redesign).
Current main branch: b00a5f812f1a2c28ca3aa66b47b1cb3ad045d903.
PR metadata's base_sha cd1d1f085304821e8b36cfa08e7e1ba8374c9c34 is the merge base,
not current main. GitHub compare confirms 1 main commit versus 14 redesign commits.
Main changed privacy/terms and generated HTML across 25 paths overlapping redesign.
The PR is reported unmergeable. Its generated files must be regenerated after
preserving main's legal-source changes; do not resolve by taking one entire side.
This inquiry branch does not merge or overwrite either active branch.

Existing public pricing differs from the unchanged payment-link amounts in redesign
notes. This work does not resolve commercial pricing or change payment links.

Reference inspected: https://supabase.com/docs/guides/database/connecting-to-postgres
The changelog markdown fetch was unsupported by the web reader; no hosted Supabase
feature or SDK-dependent integration was activated based on an assumed version.
