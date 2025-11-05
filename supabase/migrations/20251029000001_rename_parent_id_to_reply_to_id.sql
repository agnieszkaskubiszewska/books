-- Zmiana nazwy kolumny parent_id na reply_to_id dla lepszej czytelności
-- reply_to_id jest bardziej opisowe - jasno wskazuje że to odpowiedź do innej wiadomości

-- 1. Zmień nazwę kolumny parent_id na reply_to_id
alter table public.messages 
  rename column parent_id to reply_to_id;

-- 2. Zaktualizuj nazwę indeksu
drop index if exists idx_messages_parent;
create index if not exists idx_messages_reply_to on public.messages(reply_to_id);

-- 3. Usuń stare funkcje (aby móc zmienić typ zwracany)
drop function if exists public.get_messages_with_users();
drop function if exists public.get_message_with_users(uuid);

-- 4. Stwórz funkcje ponownie z reply_to_id
create or replace function public.get_messages_with_users()
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  reply_to_id uuid,
  read boolean,
  created_at timestamptz,
  sender_email text,
  recipient_email text
)
language sql
security definer
stable
as $$
  select 
    m.id,
    m.sender_id,
    m.recipient_id,
    m.body,
    m.reply_to_id,
    m.read,
    m.created_at,
    (select email from public.users where id = m.sender_id) as sender_email,
    (select email from public.users where id = m.recipient_id) as recipient_email
  from public.messages m
  where auth.uid() = m.sender_id or auth.uid() = m.recipient_id
  order by m.created_at desc;
$$;

-- 5. Stwórz funkcję get_message_with_users
create or replace function public.get_message_with_users(message_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  reply_to_id uuid,
  read boolean,
  created_at timestamptz,
  sender_email text,
  recipient_email text
)
language sql
security definer
stable
as $$
  select 
    m.id,
    m.sender_id,
    m.recipient_id,
    m.body,
    m.reply_to_id,
    m.read,
    m.created_at,
    (select email from public.users where id = m.sender_id) as sender_email,
    (select email from public.users where id = m.recipient_id) as recipient_email
  from public.messages m
  where m.id = message_id
    and (auth.uid() = m.sender_id or auth.uid() = m.recipient_id);
$$;

-- 6. Przywróć uprawnienia do funkcji
grant execute on function public.get_messages_with_users() to authenticated;
grant execute on function public.get_message_with_users(uuid) to authenticated;

