create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  sender_name text,
  recipient_id uuid not null,
  recipient_name text,
  body text not null,
  parent_id uuid references public.messages(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- A user can see messages where they are sender or recipient
create policy messages_select_on_participants
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- A user can insert a message only as themselves as sender
create policy messages_insert_as_self
on public.messages for insert
with check (auth.uid() = sender_id);

-- Only the recipient can mark message as read (update rows where they are recipient)
create policy messages_update_read_by_recipient
on public.messages for update
using (auth.uid() = recipient_id)
with check (true);

create index if not exists idx_messages_parent on public.messages(parent_id);
create index if not exists idx_messages_participants on public.messages(sender_id, recipient_id);

