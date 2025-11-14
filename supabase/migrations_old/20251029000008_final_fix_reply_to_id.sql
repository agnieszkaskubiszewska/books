-- Ostateczna naprawa foreign key dla reply_to_id
-- Ta migracja sprawdza bezpośrednio w pg_constraint i wymusza poprawny foreign key

-- 1. Sprawdź i wyświetl WSZYSTKIE aktualne foreign keys dla reply_to_id (PRZED naprawą)
do $$
declare
  r record;
begin
  raise notice '==========================================';
  raise notice 'Foreign keys dla reply_to_id PRZED naprawą:';
  raise notice '==========================================';
  for r in
    select 
      conname as constraint_name,
      confrelid::regclass::text as foreign_table,
      (select attname from pg_attribute where attrelid = confrelid and attnum = confkey[1]) as foreign_column
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and contype = 'f'
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'reply_to_id'
      )
  loop
    raise notice 'FK: % -> %.%', r.constraint_name, r.foreign_table, r.foreign_column;
  end loop;
  raise notice '==========================================';
end $$;

-- 2. Usuń WSZYSTKIE foreign keys dla reply_to_id (bez wyjątków)
do $$
declare
  constraint_name text;
begin
  for constraint_name in 
    select conname 
    from pg_constraint 
    where conrelid = 'public.messages'::regclass
      and contype = 'f'
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
    raise notice 'Usunięto constraint: %', constraint_name;
  end loop;
end $$;

-- 3. Dodaj poprawny foreign key dla reply_to_id -> messages.id
do $$
begin
  alter table public.messages
    add constraint fk_messages_reply_to
    foreign key (reply_to_id)
    references public.messages(id)
    on delete cascade;
  
  raise notice 'Dodano poprawny foreign key: reply_to_id -> messages.id';
exception
  when duplicate_object then
    raise notice 'Foreign key już istnieje (może być problem z cache)';
end $$;

-- 4. Sprawdź i wyświetl WSZYSTKIE aktualne foreign keys dla reply_to_id (PO naprawie)
do $$
declare
  r record;
begin
  raise notice '==========================================';
  raise notice 'Foreign keys dla reply_to_id PO naprawie:';
  raise notice '==========================================';
  for r in
    select 
      conname as constraint_name,
      confrelid::regclass::text as foreign_table,
      (select attname from pg_attribute where attrelid = confrelid and attnum = confkey[1]) as foreign_column
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and contype = 'f'
      and array_length(conkey, 1) = 1
      and exists (
        select 1 
        from pg_attribute 
        where attrelid = conrelid 
          and attnum = conkey[1] 
          and attname = 'reply_to_id'
      )
  loop
    raise notice 'FK: % -> %.%', r.constraint_name, r.foreign_table, r.foreign_column;
    
    -- Sprawdź czy to błędny foreign key
    if r.foreign_column != 'id' or r.foreign_table != 'messages' then
      raise notice 'UWAGA: ZNALEZIONO BŁĘDNY FOREIGN KEY!';
    end if;
  end loop;
  raise notice '==========================================';
end $$;

-- 5. Sprawdź również wszystkie foreign keys w tabeli messages (dla pełnego obrazu)
do $$
declare
  r record;
begin
  raise notice '==========================================';
  raise notice 'WSZYSTKIE foreign keys w tabeli messages:';
  raise notice '==========================================';
  for r in
    select 
      conname as constraint_name,
      (select attname from pg_attribute where attrelid = conrelid and attnum = conkey[1]) as local_column,
      confrelid::regclass::text as foreign_table,
      (select attname from pg_attribute where attrelid = confrelid and attnum = confkey[1]) as foreign_column
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and contype = 'f'
  loop
    raise notice 'FK: %.% -> %.%', r.local_column, r.constraint_name, r.foreign_table, r.foreign_column;
  end loop;
  raise notice '==========================================';
end $$;

