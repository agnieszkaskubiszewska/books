-- Seed: initial books
BEGIN;

DELETE FROM public.books;

INSERT INTO public.books (title, author, description, year, genre, rating, image, rent, rent_mode, rent_region) VALUES
  ('Clean Code', 'Robert C. Martin', 'O jakości i czytelności kodu w projektach software''owych.', 2008, 'other', 5, NULL, true, 'shipping', NULL),
  ('Refactoring', 'Martin Fowler', 'Techniki bezpiecznej zmiany struktury kodu bez zmiany zachowania.', 1999, 'other', 5, NULL, true, 'local', 'mazowieckie'),
  ('You Don''t Know JS', 'Kyle Simpson', 'Seria książek zgłębiających mechanikę JavaScript.', 2015, 'other', 4, NULL, false, NULL, NULL),
  ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 'Praktyczne nawyki i podejścia do rzemiosła programistycznego.', 1999, 'other', 5, NULL, true, 'shipping', NULL),
  ('Designing Data-Intensive Applications', 'Martin Kleppmann', 'Architektura systemów danych: skalowalność, spójność, niezawodność.', 2017, 'other', 5, NULL, true, 'local', 'małopolskie'),
  ('JavaScript: The Good Parts', 'Douglas Crockford', 'Wybrane, solidne elementy języka JavaScript.', 2008, 'other', 4, NULL, false, NULL, NULL),
  ('Eloquent JavaScript', 'Marijn Haverbeke', 'Wprowadzenie do JS z naciskiem na zrozumienie i ćwiczenia.', 2011, 'other', 4, NULL, true, 'local', 'pomorskie'),
  ('Introduction to Algorithms', 'Cormen, Leiserson, Rivest, Stein', 'Kompendium algorytmów i struktur danych.', 2009, 'other', 5, NULL, true, 'shipping', NULL),
  ('The Mythical Man-Month', 'Frederick P. Brooks Jr.', 'Eseje o inżynierii oprogramowania i zarządzaniu projektami.', 1975, 'other', 4, NULL, false, NULL, NULL),
  ('Domain-Driven Design', 'Eric Evans', 'Projektowanie złożonych systemów poprzez modelowanie dziedzinowe.', 2003, 'other', 5, NULL, true, 'local', 'śląskie');

COMMIT;


