-- Drop legacy overall column if exists
alter table public.users drop column if exists user_rating;

-- Store per-rating entries to compute averages
create table if not exists public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  ratee_id uuid not null references public.users(id) on delete cascade,
  rater_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner','borrower')),
  rating integer not null check (rating between 1 and 5),
  thread_id uuid references public.threads(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_ratings_ratee on public.user_ratings (ratee_id, role);
create index if not exists idx_user_ratings_thread on public.user_ratings (thread_id);

