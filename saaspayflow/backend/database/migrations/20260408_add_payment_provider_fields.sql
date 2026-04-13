alter table if exists payments
  add column if not exists provider text not null default 'manual';

alter table if exists payments
  add column if not exists provider_transaction_id text;

alter table if exists payments
  add column if not exists failure_reason text;

create unique index if not exists idx_payments_provider_transaction_id
  on payments(provider_transaction_id)
  where provider_transaction_id is not null;
