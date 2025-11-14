do $$
declare r record;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name
    from pg_attribute a
    join pg_class c on a.attrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where a.attname = 'rent_mode'
      and n.nspname = 'public'
      and c.relkind = 'r' -- tylko tabele
  loop
    execute format('alter table %I.%I drop column if exists rent_mode cascade', r.schema_name, r.table_name);
  end loop;
end $$;
