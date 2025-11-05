-- Napraw foreign key dla reply_to_id
-- reply_to_id powinno wskazywać na messages.id, a nie na recipient_id
-- Ta migracja usuwa błędne foreign keys i dodaje poprawny

-- 1. Usuń wszystkie błędne foreign keys dla reply_to_id
-- (które mogą wskazywać na recipient_id lub inne błędne miejsca)
do $$
declare
  constraint_name text;
begin
  -- Znajdź i usuń wszystkie foreign keys dla reply_to_id które nie wskazują na messages.id
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'  -- foreign key
      and confrelid != 'public.messages'::regclass  -- nie wskazuje na messages (błędne!)
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'reply_to_id'
      )
  loop
    execute format('alter table public.messages drop constraint if exists %I cascade', constraint_name);
    raise notice 'Usunięto błędny constraint dla reply_to_id: %', constraint_name;
  end loop;
  
  -- Usuń również constraint który może wskazywać na recipient_id
  -- (choć to nie powinno się zdarzyć, ale na wszelki wypadek)
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'
      and array_length(conkey, 1) = 1
      and array_length(confkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'reply_to_id'
      )
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = confrelid 
          and attnum = confkey[1] 
          and attname = 'recipient_id'
      )
  loop
    execute format('alter table public.messages drop constraint if exists %I cascade', constraint_name);
    raise notice 'Usunięto constraint reply_to_id -> recipient_id: %', constraint_name;
  end loop;
end $$;

-- 2. Usuń również constraint z pierwotnej migracji jeśli istnieje pod starą nazwą
-- (parent_id miało foreign key, po zmianie nazwy może być problem)
do $$
begin
  -- Sprawdź czy istnieje constraint dla reply_to_id wskazujący na messages.id
  if not exists (
    select 1 
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_name = 'messages'
      and tc.table_schema = 'public'
      and kcu.column_name = 'reply_to_id'
      and ccu.table_name = 'messages'
      and ccu.table_schema = 'public'
      and ccu.column_name = 'id'
  ) then
    -- Usuń wszystkie istniejące constraints dla reply_to_id (nawet te błędne)
    execute 'alter table public.messages drop constraint if exists messages_reply_to_id_fkey cascade';
    execute 'alter table public.messages drop constraint if exists fk_messages_reply_to cascade';
    
    -- Dodaj poprawny foreign key
    alter table public.messages
      add constraint fk_messages_reply_to
      foreign key (reply_to_id)
      references public.messages(id)
      on delete cascade;
    
    raise notice 'Dodano poprawny foreign key: reply_to_id -> messages.id';
  else
    raise notice 'Foreign key reply_to_id -> messages.id już istnieje';
  end if;
end $$;

-- 3. Sprawdź i wyświetl aktualne foreign keys dla reply_to_id (dla debugowania)
do $$
declare
  r record;
begin
  raise notice 'Aktualne foreign keys dla reply_to_id:';
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
      and kcu.column_name = 'reply_to_id'
  loop
    raise notice 'FK: %.% -> %.%.%', 
      r.constraint_name, 
      r.column_name, 
      r.foreign_table_schema, 
      r.foreign_table_name, 
      r.foreign_column_name;
  end loop;
end $$;

