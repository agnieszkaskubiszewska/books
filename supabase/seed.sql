-- Seed: initial books
BEGIN;

-- (opcjonalnie) usuń istniejące rekordy aby uniknąć duplikatów podczas ponownego uruchomienia
DELETE FROM public.books;

INSERT INTO public.books (title, author, description, year, genre, rating, image) VALUES
  ('Clean Code', 'Robert C. Martin', 'O jakości i czytelności kodu w projektach software''owych.', 2008, 'other', 5, NULL),
  ('Refactoring', 'Martin Fowler', 'Techniki bezpiecznej zmiany struktury kodu bez zmiany zachowania.', 1999, 'other', 5, NULL),
  ('You Don''t Know JS', 'Kyle Simpson', 'Seria książek zgłębiających mechanikę JavaScript.', 2015, 'other', 4, NULL),
  ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 'Praktyczne nawyki i podejścia do rzemiosła programistycznego.', 1999, 'other', 5, NULL),
  ('Designing Data-Intensive Applications', 'Martin Kleppmann', 'Architektura systemów danych: skalowalność, spójność, niezawodność.', 2017, 'other', 5, NULL),
  ('JavaScript: The Good Parts', 'Douglas Crockford', 'Wybrane, solidne elementy języka JavaScript.', 2008, 'other', 4, NULL),
  ('Eloquent JavaScript', 'Marijn Haverbeke', 'Wprowadzenie do JS z naciskiem na zrozumienie i ćwiczenia.', 2011, 'other', 4, NULL),
  ('Introduction to Algorithms', 'Cormen, Leiserson, Rivest, Stein', 'Kompendium algorytmów i struktur danych.', 2009, 'other', 5, NULL),
  ('The Mythical Man-Month', 'Frederick P. Brooks Jr.', 'Eseje o inżynierii oprogramowania i zarządzaniu projektami.', 1975, 'other', 4, NULL),
  ('Domain-Driven Design', 'Eric Evans', 'Projektowanie złożonych systemów poprzez modelowanie dziedzinowe.', 2003, 'other', 5, NULL);

COMMIT;


