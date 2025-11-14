drop extension if exists "pg_net";


  create table "public"."books" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "author" text not null,
    "description" text,
    "year" integer,
    "genre" text,
    "rating" integer,
    "image" text,
    "rent" boolean default false,
    "rent_mode" text,
    "rent_region" text,
    "created_at" timestamp with time zone not null default now(),
    "owner_id" uuid not null
      );


alter table "public"."books" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "sender_id" uuid not null,
    "recipient_id" uuid not null,
    "body" text not null,
    "read" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "thread_id" uuid,
    "book_id" uuid
      );


alter table "public"."messages" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "book_id" uuid not null,
    "rating" integer not null,
    "review_text" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."threads" (
    "id" uuid not null default gen_random_uuid(),
    "book_id" uuid not null,
    "owner_id" uuid not null,
    "other_user_id" uuid not null,
    "last_message_id" uuid,
    "last_message_at" timestamp with time zone not null default now(),
    "is_closed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "created_at" timestamp with time zone not null default now(),
    "first_name" text,
    "last_name" text,
    "display_name" text
      );


CREATE UNIQUE INDEX books_pkey ON public.books USING btree (id);

CREATE INDEX idx_books_owner ON public.books USING btree (owner_id);

CREATE INDEX idx_messages_book_id ON public.messages USING btree (book_id);

CREATE INDEX idx_messages_participants ON public.messages USING btree (sender_id, recipient_id);

CREATE INDEX idx_messages_recipient ON public.messages USING btree (recipient_id);

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);

CREATE INDEX idx_messages_thread ON public.messages USING btree (thread_id, created_at);

CREATE INDEX idx_public_users_email ON public.users USING btree (email);

CREATE INDEX idx_threads_book ON public.threads USING btree (book_id);

CREATE INDEX idx_threads_last_at ON public.threads USING btree (last_message_at DESC);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX threads_one_per_pair ON public.threads USING btree (book_id, owner_id, other_user_id);

CREATE UNIQUE INDEX threads_pkey ON public.threads USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."books" add constraint "books_pkey" PRIMARY KEY using index "books_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."threads" add constraint "threads_pkey" PRIMARY KEY using index "threads_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."books" add constraint "books_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."books" validate constraint "books_rating_check";

alter table "public"."books" add constraint "books_rent_mode_check" CHECK ((rent_mode = ANY (ARRAY['local'::text, 'shipping'::text]))) not valid;

alter table "public"."books" validate constraint "books_rent_mode_check";

alter table "public"."books" add constraint "fk_books_owner" FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE RESTRICT not valid;

alter table "public"."books" validate constraint "fk_books_owner";

alter table "public"."messages" add constraint "fk_messages_recipient" FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "fk_messages_recipient";

alter table "public"."messages" add constraint "fk_messages_sender" FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "fk_messages_sender";

alter table "public"."messages" add constraint "fk_messages_thread" FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED not valid;

alter table "public"."messages" validate constraint "fk_messages_thread";

alter table "public"."messages" add constraint "messages_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_book_id_fkey";

alter table "public"."reviews" add constraint "reviews_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_book_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."threads" add constraint "threads_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE not valid;

alter table "public"."threads" validate constraint "threads_book_id_fkey";

alter table "public"."threads" add constraint "threads_last_message_id_fkey" FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL not valid;

alter table "public"."threads" validate constraint "threads_last_message_id_fkey";

alter table "public"."threads" add constraint "threads_one_per_pair" UNIQUE using index "threads_one_per_pair";

alter table "public"."threads" add constraint "threads_other_user_id_fkey" FOREIGN KEY (other_user_id) REFERENCES public.users(id) not valid;

alter table "public"."threads" validate constraint "threads_other_user_id_fkey";

alter table "public"."threads" add constraint "threads_owner_diff" CHECK ((owner_id <> other_user_id)) not valid;

alter table "public"."threads" validate constraint "threads_owner_diff";

alter table "public"."threads" add constraint "threads_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id) not valid;

alter table "public"."threads" validate constraint "threads_owner_id_fkey";

set check_function_bodies = off;

create or replace view "public"."books_with_owner" as  SELECT b.id,
    b.title,
    b.author,
    b.description,
    b.year,
    b.genre,
    b.rating,
    b.image,
    b.created_at,
    b.rent,
    b.rent_mode,
    b.rent_region,
    b.owner_id,
    split_part(u.email, '@'::text, 1) AS owner_name
   FROM (public.books b
     LEFT JOIN public.users u ON ((u.id = b.owner_id)));


CREATE OR REPLACE FUNCTION public.get_message_with_users(message_id uuid)
 RETURNS TABLE(id uuid, sender_id uuid, recipient_id uuid, body text, reply_to_id uuid, read boolean, created_at timestamp with time zone, sender_email text, recipient_email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select 
    m.id,
    m.sender_id,
    m.recipient_id,
    m.body,
    m.reply_to_id,
    m.read,
    m.created_at,
    (select email from auth.users where id = m.sender_id) as sender_email,
    (select email from auth.users where id = m.recipient_id) as recipient_email
  from public.messages m
  where m.id = message_id
    and (auth.uid() = m.sender_id or auth.uid() = m.recipient_id);
$function$
;

CREATE OR REPLACE FUNCTION public.get_messages_with_users()
 RETURNS TABLE(id uuid, sender_id uuid, recipient_id uuid, body text, reply_to_id uuid, read boolean, created_at timestamp with time zone, sender_email text, recipient_email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select 
    m.id,
    m.sender_id,
    m.recipient_id,
    m.body,
    m.reply_to_id,
    m.read,
    m.created_at,
    (select email from auth.users where id = m.sender_id) as sender_email,
    (select email from auth.users where id = m.recipient_id) as recipient_email
  from public.messages m
  where auth.uid() = m.sender_id or auth.uid() = m.recipient_id
  order by m.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'given_name',
             nullif(split_part(new.raw_user_meta_data->>'full_name',' ',1), '')),
    coalesce(new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'family_name',
             nullif(regexp_replace(new.raw_user_meta_data->>'full_name', '^\S+\s*', ''), ''))
  )
  on conflict (id) do update
  set email = excluded.email,
      first_name = coalesce(excluded.first_name, public.users.first_name),
      last_name = coalesce(excluded.last_name, public.users.last_name);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_profile_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.users
  set email = new.email,
      first_name = coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'given_name', first_name),
      last_name  = coalesce(new.raw_user_meta_data->>'last_name',  new.raw_user_meta_data->>'family_name', last_name)
  where id = new.id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_thread_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  update public.threads
     set last_message_id = new.id,
         last_message_at = new.created_at,
         updated_at = now()
   where id = new.thread_id;
  return null;
end $function$
;

CREATE OR REPLACE FUNCTION public.validate_message_participant()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare v_owner uuid; v_other uuid;
begin
  select owner_id, other_user_id into v_owner, v_other
  from public.threads where id = new.thread_id;

  if v_owner is null then
    raise exception 'Thread % not found', new.thread_id;
  end if;
  if new.sender_id <> v_owner and new.sender_id <> v_other then
    raise exception 'Sender % is not a participant of thread %', new.sender_id, new.thread_id;
  end if;
  return new;
end $function$
;

grant delete on table "public"."books" to "anon";

grant insert on table "public"."books" to "anon";

grant references on table "public"."books" to "anon";

grant select on table "public"."books" to "anon";

grant trigger on table "public"."books" to "anon";

grant truncate on table "public"."books" to "anon";

grant update on table "public"."books" to "anon";

grant delete on table "public"."books" to "authenticated";

grant insert on table "public"."books" to "authenticated";

grant references on table "public"."books" to "authenticated";

grant select on table "public"."books" to "authenticated";

grant trigger on table "public"."books" to "authenticated";

grant truncate on table "public"."books" to "authenticated";

grant update on table "public"."books" to "authenticated";

grant delete on table "public"."books" to "service_role";

grant insert on table "public"."books" to "service_role";

grant references on table "public"."books" to "service_role";

grant select on table "public"."books" to "service_role";

grant trigger on table "public"."books" to "service_role";

grant truncate on table "public"."books" to "service_role";

grant update on table "public"."books" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."threads" to "anon";

grant insert on table "public"."threads" to "anon";

grant references on table "public"."threads" to "anon";

grant select on table "public"."threads" to "anon";

grant trigger on table "public"."threads" to "anon";

grant truncate on table "public"."threads" to "anon";

grant update on table "public"."threads" to "anon";

grant delete on table "public"."threads" to "authenticated";

grant insert on table "public"."threads" to "authenticated";

grant references on table "public"."threads" to "authenticated";

grant select on table "public"."threads" to "authenticated";

grant trigger on table "public"."threads" to "authenticated";

grant truncate on table "public"."threads" to "authenticated";

grant update on table "public"."threads" to "authenticated";

grant delete on table "public"."threads" to "service_role";

grant insert on table "public"."threads" to "service_role";

grant references on table "public"."threads" to "service_role";

grant select on table "public"."threads" to "service_role";

grant trigger on table "public"."threads" to "service_role";

grant truncate on table "public"."threads" to "service_role";

grant update on table "public"."threads" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "books delete admin"
  on "public"."books"
  as permissive
  for delete
  to authenticated
using ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "books insert auth"
  on "public"."books"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "books select all"
  on "public"."books"
  as permissive
  for select
  to public
using (true);



  create policy "books update auth"
  on "public"."books"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "messages_insert_as_self"
  on "public"."messages"
  as permissive
  for insert
  to public
with check ((auth.uid() = sender_id));



  create policy "messages_select_on_participants"
  on "public"."messages"
  as permissive
  for select
  to public
using (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));



  create policy "messages_update_read_by_recipient"
  on "public"."messages"
  as permissive
  for update
  to public
using ((auth.uid() = recipient_id))
with check (true);


CREATE TRIGGER trg_messages_after_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_thread_last_message();

CREATE TRIGGER trg_messages_before_insert BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.validate_message_participant();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile_on_update();


