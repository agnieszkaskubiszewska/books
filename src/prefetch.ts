import { supabase } from './supabase';

export const BOOKS_SELECT =
  'id,title,author,description,year,genre,rating,image,created_at,rent,rent_region,owner_id,users!owner_id(id,first_name,last_name)';

function makeBooksQuery() {
  return Promise.all([
    supabase.from('books').select(BOOKS_SELECT),
    supabase.from('books_with_rent_stats').select('id,rent_count'),
  ]);
}

// Zapytanie startuje natychmiast gdy moduł jest importowany — przed zamontowaniem Reacta
let _prefetched: ReturnType<typeof makeBooksQuery> | null = makeBooksQuery();

export function consumeOrFetchBooks(): ReturnType<typeof makeBooksQuery> {
  if (_prefetched) {
    const p = _prefetched;
    _prefetched = null;
    return p;
  }
  return makeBooksQuery();
}
