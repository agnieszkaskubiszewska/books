-- 1) Tabela rents: przechowuje informacje o wypożyczeniach książek
create table if not exists public.rents (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null,
  book_owner uuid not null,
  borrower uuid not null,
  rent_from timestamptz not null default now(),
  rent_to timestamptz,
  finished boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.rents enable row level security;

-- 2) Klucze obce
alter table public.rents
  add constraint rents_book_id_fkey
  foreign key (book_id) references public.books(id)
  on delete cascade;

-- Zapewnij unikalność (id, owner_id) w books, aby móc zbudować złożony FK (book_id, book_owner) -> (books.id, books.owner_id)
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename  = 'books'
      and indexname  = 'books_id_owner_unique'
  ) then
    execute 'create unique index books_id_owner_unique on public.books (id, owner_id)';
  end if;
end $$;

alter table public.rents
  add constraint rents_book_owner_matches_book
  foreign key (book_id, book_owner)
  references public.books(id, owner_id)
  on delete cascade;

alter table public.rents
  add constraint rents_book_owner_fkey
  foreign key (book_owner) references public.users(id)
  on delete restrict;

alter table public.rents
  add constraint rents_borrower_fkey
  foreign key (borrower) references public.users(id)
  on delete restrict;

-- 3) Tylko jedno otwarte wypożyczenie na książkę (finished = false)
create unique index if not exists rents_one_open_per_book
  on public.rents (book_id)
  where (finished = false);

-- 4) Indeksy pomocnicze
create index if not exists idx_rents_borrower
  on public.rents (borrower, finished, rent_from);

create index if not exists idx_rents_owner
  on public.rents (book_owner, finished, rent_from);

-- 5) Funkcja i trigger do synchronizacji books.rent
-- Konwencja: books.rent = true, gdy brak otwartego wypożyczenia; false, gdy istnieje otwarte wypożyczenie
create or replace function public.recompute_book_rent_flag(target_book_id uuid)
returns void
language plpgsql
as $$
begin
  update public.books b
  set rent = not exists (
    select 1
    from public.rents r
    where r.book_id = target_book_id
      and r.finished = false
  )
  where b.id = target_book_id;
end;
$$;

create or replace function public.trigger_sync_book_rent_flag()
returns trigger
language plpgsql
as $$
declare
  affected_book_id uuid;
begin
  if tg_op = 'DELETE' then
    affected_book_id := old.book_id;
  else
    affected_book_id := new.book_id;
  end if;
  perform public.recompute_book_rent_flag(affected_book_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists rents_sync_book_rent_aiud on public.rents;
create trigger rents_sync_book_rent_aiud
after insert or update of finished, book_id or delete on public.rents
for each row execute function public.trigger_sync_book_rent_flag();

-- 6) RLS – dostęp dla uczestników wypożyczenia (właściciel i wypożyczający)
create policy rents_select_on_participants
on public.rents for select
using (auth.uid() = book_owner or auth.uid() = borrower);

create policy rents_insert_by_participants
on public.rents for insert
with check (auth.uid() = book_owner or auth.uid() = borrower);

create policy rents_update_by_participants
on public.rents for update
using (auth.uid() = book_owner or auth.uid() = borrower)
with check (true);


