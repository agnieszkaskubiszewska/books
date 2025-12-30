-- 01_enable_pg_net.sql 
create extension if not exists pg_net;

-- 02_private_app_secrets.sql
create schema if not exists private;

create table if not exists private.app_secrets (
  key   text primary key,
  value text not null
);

revoke all on schema private from public;
revoke all on all tables in schema private from public;

grant usage on schema private to postgres, service_role;
grant select, insert, update, delete on private.app_secrets to postgres, service_role;