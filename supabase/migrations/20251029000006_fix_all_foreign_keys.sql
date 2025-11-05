-- Napraw wszystkie foreign keys - usuń błędne i dodaj poprawne
-- Ta migracja naprawia wszystkie foreign keys w bazie danych

-- 1. Usuń WSZYSTKIE błędne foreign keys dla messages.sender_id i messages.recipient_id
-- (które mogą wskazywać na niewłaściwe tabele)
do $$
declare
  constraint_name text;
begin
  -- Znajdź i usuń wszystkie foreign keys dla sender_id które NIE wskazują na public.users
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'  -- foreign key
      and confrelid != 'public.users'::regclass  -- nie wskazuje na public.users (błędne!)
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'sender_id'
      )
  loop
    execute format('alter table public.messages drop constraint if exists %I cascade', constraint_name);
    raise notice 'Usunięto błędny constraint dla sender_id: %', constraint_name;
  end loop;
  
  -- Znajdź i usuń wszystkie foreign keys dla recipient_id które NIE wskazują na public.users
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'  -- foreign key
      and confrelid != 'public.users'::regclass  -- nie wskazuje na public.users (błędne!)
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'recipient_id'
      )
  loop
    execute format('alter table public.messages drop constraint if exists %I cascade', constraint_name);
    raise notice 'Usunięto błędny constraint dla recipient_id: %', constraint_name;
  end loop;
end $$;

-- 2. Usuń WSZYSTKIE błędne foreign keys dla reviews.review_text
-- (review_text to tekst, nie powinno mieć foreign key!)
do $$
declare
  constraint_name text;
begin
  -- Znajdź i usuń wszystkie foreign keys dla review_text (które nie powinny istnieć!)
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.reviews'::regclass
      and contype = 'f'  -- foreign key
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'review_text'
      )
  loop
    execute format('alter table public.reviews drop constraint if exists %I cascade', constraint_name);
    raise notice 'Usunięto błędny constraint dla review_text: %', constraint_name;
  end loop;
end $$;

-- 3. Dodaj poprawne foreign keys dla messages.sender_id i recipient_id do public.users
do $$
begin
  -- Dodaj foreign key dla sender_id jeśli nie istnieje
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
      and kcu.column_name = 'sender_id'
      and ccu.table_name = 'users'
      and ccu.table_schema = 'public'
      and ccu.column_name = 'id'
  ) then
    alter table public.messages
      add constraint fk_messages_sender
      foreign key (sender_id)
      references public.users(id)
      on delete cascade;
    raise notice 'Dodano foreign key: messages.sender_id -> public.users.id';
  else
    raise notice 'Foreign key messages.sender_id -> public.users.id już istnieje';
  end if;
  
  -- Dodaj foreign key dla recipient_id jeśli nie istnieje
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
      and kcu.column_name = 'recipient_id'
      and ccu.table_name = 'users'
      and ccu.table_schema = 'public'
      and ccu.column_name = 'id'
  ) then
    alter table public.messages
      add constraint fk_messages_recipient
      foreign key (recipient_id)
      references public.users(id)
      on delete cascade;
    raise notice 'Dodano foreign key: messages.recipient_id -> public.users.id';
  else
    raise notice 'Foreign key messages.recipient_id -> public.users.id już istnieje';
  end if;
end $$;

-- 4. Wyświetl wszystkie aktualne foreign keys dla messages (dla debugowania)
do $$
declare
  r record;
begin
  raise notice '==========================================';
  raise notice 'Aktualne foreign keys dla messages:';
  raise notice '==========================================';
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
    order by kcu.column_name
  loop
    raise notice 'FK: %.% -> %.%.%', 
      r.constraint_name, 
      r.column_name, 
      r.foreign_table_schema, 
      r.foreign_table_name, 
      r.foreign_column_name;
  end loop;
  raise notice '==========================================';
end $$;

-- 5. Wyświetl wszystkie aktualne foreign keys dla reviews (dla debugowania)
do $$
declare
  r record;
begin
  raise notice '==========================================';
  raise notice 'Aktualne foreign keys dla reviews:';
  raise notice '==========================================';
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
      and tc.table_name = 'reviews'
      and tc.table_schema = 'public'
    order by kcu.column_name
  loop
    raise notice 'FK: %.% -> %.%.%', 
      r.constraint_name, 
      r.column_name, 
      r.foreign_table_schema, 
      r.foreign_table_name, 
      r.foreign_column_name;
  end loop;
  raise notice '==========================================';
end $$;

