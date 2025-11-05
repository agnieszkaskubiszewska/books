-- 1) Add thread_id column
alter table public.messages add column if not exists thread_id uuid;

-- 2) Populate thread_id: dla rootów = id, dla odpowiedzi = reply_to_id
update public.messages
set thread_id = coalesce(reply_to_id, id)
where thread_id is null;

-- 3) Index na thread
create index if not exists idx_messages_thread on public.messages(thread_id, created_at);

-- 4) Usuń stary FK i kolumnę reply_to_id
do $$
begin
  alter table public.messages drop constraint if exists fk_messages_reply_to cascade;
exception when others then null;
end $$;

alter table public.messages drop column if exists reply_to_id;

