-- Tabela rent_queue: przechowuje kolejkowane propozycje dat wypożyczenia
-- Kiedy książka jest już wypożyczona, owner może zaproponować alternatywne daty
-- kolejnemu zainteresowanemu użytkownikowi.

create table if not exists public.rent_queue (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  book_owner uuid not null references public.users(id) on delete restrict,
  borrower uuid not null references public.users(id) on delete restrict,
  thread_id uuid not null references public.threads(id) on delete cascade,
  proposed_from date not null,
  proposed_to date not null,
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- jedno aktywne zaproszenie na wątek
create unique index rent_queue_one_active_per_thread
  on public.rent_queue (thread_id)
  where (status = 'proposed');

create index idx_rent_queue_book on public.rent_queue (book_id);
create index idx_rent_queue_owner on public.rent_queue (book_owner, status);
create index idx_rent_queue_borrower on public.rent_queue (borrower, status);

alter table public.rent_queue enable row level security;

create policy rq_select on public.rent_queue for select
  using (auth.uid() = book_owner or auth.uid() = borrower);

create policy rq_insert on public.rent_queue for insert
  with check (auth.uid() = book_owner);

create policy rq_update on public.rent_queue for update
  using (auth.uid() = book_owner or auth.uid() = borrower)
  with check (true);
