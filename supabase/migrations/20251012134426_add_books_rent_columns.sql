alter table public.books add column if not exists rent boolean default false;
alter table public.books add column if not exists rent_mode text check (rent_mode in ('local','shipping'));
alter table public.books add column if not exists rent_region text;