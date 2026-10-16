-- Proposal only; never applied to a hosted project. Not a migration.
create schema if not exists nolmt_private;
revoke all on schema nolmt_private from public;
create table nolmt_private.inquiries (
 id uuid primary key,
 payload_hash text not null check (length(payload_hash) = 64),
 envelope text not null check (octet_length(envelope) <= 16000),
 created_at timestamptz not null default now()
);
alter table nolmt_private.inquiries enable row level security;
revoke all on nolmt_private.inquiries from public;
-- No API exposure, public policies, service credentials or role grants here.
-- A narrowly scoped backend role and INSERT/SELECT RLS policies need separate review.
