-- Wymuś naprawę foreign key dla reply_to_id
-- Ta migracja usuwa WSZYSTKIE foreign keys dla reply_to_id i dodaje poprawny

-- 1. Usuń WSZYSTKIE foreign keys dla reply_to_id (nawet te które mogą być poprawne)
-- Następnie dodamy poprawny
do $$
declare
  constraint_name text;
begin
  -- Znajdź i usuń WSZYSTKIE foreign keys dla reply_to_id
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'  -- foreign key
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
    raise notice 'Usunięto constraint dla reply_to_id: %', constraint_name;
  end loop;
  
  -- Usuń również znane nazwy constraints
  execute 'alter table public.messages drop constraint if exists fk_messages_reply_to cascade';
  execute 'alter table public.messages drop constraint if exists messages_reply_to_id_fkey cascade';
  execute 'alter table public.messages drop constraint if exists messages_parent_id_fkey cascade';
end $$;

-- 2. Dodaj poprawny foreign key dla reply_to_id -> messages.id
do $$
begin
  -- Sprawdź czy już istnieje poprawny foreign key
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
  raise notice '==========================================';
  raise notice 'Aktualne foreign keys dla messages.reply_to_id:';
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
      and kcu.column_name = 'reply_to_id'
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

