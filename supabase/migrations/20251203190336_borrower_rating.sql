alter table public.users
  add column if not exists borrower_rating integer not null default 0,
  add column if not exists owner_rating integer not null default 0;