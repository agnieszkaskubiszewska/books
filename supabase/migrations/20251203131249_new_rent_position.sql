alter table public.users
  add column if not exists user_rating integer not null default 0;