create extension if not exists "pgcrypto";

-- Tabela: users (opcjonalna; w Supabase zazwyczaj używa się auth.users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Tabela: books
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  description text,
  year int,
  genre text,
  rating int check (rating between 1 and 5),
  image text,
  created_at timestamptz not null default now()
);

-- Tabela: reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);