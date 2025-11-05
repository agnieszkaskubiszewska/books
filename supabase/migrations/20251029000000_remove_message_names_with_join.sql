-- Usuń kolumny sender_name i recipient_name z tabeli messages
-- Zamiast tego użyjemy JOIN z auth.users przez funkcję SQL

-- 1. Usuń kolumny sender_name i recipient_name
alter table public.messages 
  drop column if exists sender_name,
  drop column if exists recipient_name;

-- 2. Stwórz funkcję SQL która zwraca wiadomości z emailami użytkowników
-- Funkcja używa security definer aby móc odczytać auth.users
create or replace function public.get_messages_with_users()
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  parent_id uuid,
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
    m.parent_id,
    m.read,
    m.created_at,
    (select email from auth.users where id = m.sender_id) as sender_email,
    (select email from auth.users where id = m.recipient_id) as recipient_email
  from public.messages m
  where auth.uid() = m.sender_id or auth.uid() = m.recipient_id
  order by m.created_at desc;
$$;

-- 3. Stwórz funkcję do pobierania pojedynczej wiadomości z emailami
create or replace function public.get_message_with_users(message_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  parent_id uuid,
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
    m.parent_id,
    m.read,
    m.created_at,
    (select email from auth.users where id = m.sender_id) as sender_email,
    (select email from auth.users where id = m.recipient_id) as recipient_email
  from public.messages m
  where m.id = message_id
    and (auth.uid() = m.sender_id or auth.uid() = m.recipient_id);
$$;

-- 4. Nadaj uprawnienia do funkcji
grant execute on function public.get_messages_with_users() to authenticated;
grant execute on function public.get_message_with_users(uuid) to authenticated;

