alter table public.rents
  add column if not exists pre_3d_email_sent boolean not null default false;

create index if not exists rents_finished_idx on public.rents (finished);
create index if not exists rents_pre3_idx on public.rents (pre_3d_email_sent);
create index if not exists rents_rent_to_idx on public.rents (rent_to)