-- Ensure threads has is_closed flag
alter table public.threads
  add column if not exists is_closed boolean not null default false;

-- Drop old UNIQUE constraint/index that forced single thread per pair regardless of closed state
do $$
begin
  begin
    execute 'alter table public.threads drop constraint if exists threads_one_per_pair';
  exception when others then
    null;
  end;
  begin
    execute 'drop index if exists public.threads_one_per_pair';
  exception when others then
    null;
  end;
end $$;

-- Allow multiple threads per pair, but enforce only ONE open thread (is_closed = false)
create unique index if not exists threads_one_open_per_pair
  on public.threads (book_id, owner_id, other_user_id)
  where (is_closed = false);


