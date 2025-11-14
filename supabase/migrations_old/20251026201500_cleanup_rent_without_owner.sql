-- Ustaw rent=false dla książek, które nie mają przypisanego właściciela
update public.books
set rent = false
where rent is true
  and owner_id is null;

