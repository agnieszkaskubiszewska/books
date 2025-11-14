update public.books
set rent_mode = 'local'
where rent_mode = 'shipping';

do $$
declare
  c text;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.books'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%rent_mode%'
  loop
    execute format('alter table public.books drop constraint %I', c);
  end loop;
end $$;

alter table public.books
  add constraint books_rent_mode_local_check
  check (rent_mode is null or rent_mode = 'local');

