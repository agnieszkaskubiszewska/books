alter table public.books add column if not exists owner_id uuid;
create index if not exists idx_books_owner on public.books(owner_id);

