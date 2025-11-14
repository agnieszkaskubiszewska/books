-- Napraw foreign keys - upewnij się że wskazują na public.users zamiast auth.users
-- Ta migracja naprawia foreign keys jeśli wskazują na auth.users

-- 1. Usuń wszystkie foreign keys wskazujące na auth.users dla sender_id i recipient_id
do $$
declare
  constraint_name text;
begin
  -- Znajdź i usuń wszystkie foreign keys dla sender_id wskazujące na auth.users
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'  -- foreign key
      and confrelid = 'auth.users'::regclass
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname in ('sender_id', 'recipient_id')
      )
  loop
    execute format('alter table public.messages drop constraint if exists %I cascade', constraint_name);
    raise notice 'Usunięto constraint: %', constraint_name;
  end loop;
end $$;

-- 2. Dodaj foreign keys wskazujące na public.users
-- Sprawdź czy już nie istnieją przed dodaniem
do $$
begin
  -- Dodaj foreign key dla sender_id jeśli nie istnieje
  if not exists (
    select 1 
    from information_schema.table_constraints 
    where constraint_name = 'fk_messages_sender'
      and table_name = 'messages'
      and table_schema = 'public'
  ) then
    alter table public.messages
      add constraint fk_messages_sender
      foreign key (sender_id)
      references public.users(id)
      on delete cascade;
    raise notice 'Dodano foreign key: fk_messages_sender -> public.users';
  end if;
  
  -- Dodaj foreign key dla recipient_id jeśli nie istnieje
  if not exists (
    select 1 
    from information_schema.table_constraints 
    where constraint_name = 'fk_messages_recipient'
      and table_name = 'messages'
      and table_schema = 'public'
  ) then
    alter table public.messages
      add constraint fk_messages_recipient
      foreign key (recipient_id)
      references public.users(id)
      on delete cascade;
    raise notice 'Dodano foreign key: fk_messages_recipient -> public.users';
  end if;
end $$;

-- 3. Sprawdź i wyświetl aktualne foreign keys (dla debugowania)
-- To pokaże jakie foreign keys są teraz ustawione
do $$
declare
  r record;
begin
  raise notice 'Aktualne foreign keys dla messages:';
  for r in
    select 
      tc.constraint_name,
      kcu.column_name,
      ccu.table_schema as foreign_table_schema,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    from information_schema.table_constraints as tc
    join information_schema.key_column_usage as kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage as ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_name = 'messages'
      and tc.table_schema = 'public'
      and kcu.column_name in ('sender_id', 'recipient_id')
  loop
    raise notice 'FK: %.% -> %.%.%', 
      r.constraint_name, 
      r.column_name, 
      r.foreign_table_schema, 
      r.foreign_table_name, 
      r.foreign_column_name;
  end loop;
end $$;

