create or replace view public.books_with_rent_stats as
select
  b.*,
  coalesce(rs.rent_count, 0)      as rent_count,
  coalesce(rs.open_rent_count, 0) as open_rent_count,
  rs.last_rent_at                 as last_rent_at
from public.books b
left join (
  select
    r.book_id,
    count(*) as rent_count,
    count(*) filter (where r.finished = false) as open_rent_count,
    max(coalesce(r.rent_from, r.created_at)) as last_rent_at
  from public.rents r
  group by r.book_id
) rs
on rs.book_id = b.id;
