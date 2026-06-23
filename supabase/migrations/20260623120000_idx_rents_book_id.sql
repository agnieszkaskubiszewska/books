-- Speeds up books_with_rent_stats view which does GROUP BY book_id on the rents table
create index if not exists idx_rents_book_id
  on public.rents (book_id);
