-- Synchronizacja public.users z auth.users
-- Gdy użytkownik się zarejestruje w auth.users, automatycznie tworzy się wpis w public.users

-- 1. Upewnij się że public.users.id nie generuje nowego UUID
-- (id w public.users powinno być identyczne z id w auth.users)
-- Usuń default gen_random_uuid() jeśli istnieje
do $$
begin
  -- Sprawdź czy default istnieje i usuń go
  if exists (
    select 1 from pg_attrdef ad
    join pg_attribute a on ad.adrelid = a.attrelid and ad.adnum = a.attnum
    join pg_class c on a.attrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public' and c.relname = 'users' and a.attname = 'id'
  ) then
    alter table public.users alter column id drop default;
  end if;
end $$;

-- 2. Stwórz funkcję która automatycznie tworzy wpis w public.users gdy użytkownik się zarejestruje
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- 3. Stwórz trigger który automatycznie tworzy wpis w public.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 4. Synchronizuj istniejących użytkowników (jeśli już są w auth.users ale nie w public.users)
insert into public.users (id, email)
select id, email
from auth.users
where id not in (select id from public.users)
on conflict (id) do nothing;

