-- Dodaj foreign key constraints do tabeli messages
-- sender_id i recipient_id powinny wskazywać na public.users (naszą tabelę użytkowników)

-- 1. Usuń stare foreign keys jeśli istnieją (mogą wskazywać na auth.users)
-- Używamy bloku DO aby sprawdzić wszystkie możliwe nazwy constraints
do $$
declare
  constraint_name text;
begin
  -- Usuń wszystkie constraints dla sender_id
  for constraint_name in 
    select conname from pg_constraint 
    where conrelid = 'public.messages'::regclass
    and confrelid = 'auth.users'::regclass
    and array_length(conkey, 1) = 1
    and (select attname from pg_attribute where attrelid = conrelid and attnum = conkey[1]) = 'sender_id'
  loop
    execute format('alter table public.messages drop constraint if exists %I', constraint_name);
  end loop;
  
  -- Usuń wszystkie constraints dla recipient_id
  for constraint_name in 
    select conname from pg_constraint 
    where conrelid = 'public.messages'::regclass
    and confrelid = 'auth.users'::regclass
    and array_length(conkey, 1) = 1
    and (select attname from pg_attribute where attrelid = conrelid and attnum = conkey[1]) = 'recipient_id'
  loop
    execute format('alter table public.messages drop constraint if exists %I', constraint_name);
  end loop;
  
  -- Usuń również znane nazwy constraints na wszelki wypadek
  execute 'alter table public.messages drop constraint if exists fk_messages_sender';
  execute 'alter table public.messages drop constraint if exists messages_sender_id_fkey';
  execute 'alter table public.messages drop constraint if exists fk_messages_recipient';
  execute 'alter table public.messages drop constraint if exists messages_recipient_id_fkey';
end $$;

-- 2. Dodaj foreign key constraint dla sender_id wskazujący na public.users
alter table public.messages
  add constraint fk_messages_sender
  foreign key (sender_id)
  references public.users(id)
  on delete cascade;

-- 3. Dodaj foreign key constraint dla recipient_id wskazujący na public.users
alter table public.messages
  add constraint fk_messages_recipient
  foreign key (recipient_id)
  references public.users(id)
  on delete cascade;

-- 4. Sprawdź czy reply_to_id ma już foreign key (było parent_id z foreign key)
-- Jeśli nie, dodaj foreign key constraint dla reply_to_id
-- (parent_id już miał foreign key, ale po zmianie nazwy na reply_to_id może potrzebować aktualizacji)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_messages_reply_to'
    and table_name = 'messages'
    and table_schema = 'public'
  ) then
    alter table public.messages
      add constraint fk_messages_reply_to
      foreign key (reply_to_id)
      references public.messages(id)
      on delete cascade;
  end if;
end $$;

-- 5. Upewnij się że indeksy są poprawnie nazwane
-- (to może być już zrobione w poprzedniej migracji, ale dla pewności)
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_recipient on public.messages(recipient_id);

